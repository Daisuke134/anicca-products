CREATE TABLE public.monk_factory_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  profile_reserved_at timestamptz,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  subscription_status text NOT NULL DEFAULT 'none',
  trial_used boolean NOT NULL DEFAULT false,
  trial_start timestamptz,
  trial_end timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  period_paid boolean NOT NULL DEFAULT false,
  auto_post boolean NOT NULL DEFAULT false,
  social_profile text UNIQUE,
  instagram_account_id text,
  instagram_username text,
  connected_at timestamptz,
  avatar_id text,
  avatar_image_url text,
  next_post_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.monk_factory_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.monk_factory_accounts(user_id),
  occurrence_id text NOT NULL CHECK (length(occurrence_id) BETWEEN 1 AND 160),
  kind text NOT NULL CHECK (kind IN ('avatar', 'video')),
  period_key text NOT NULL,
  status text NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'processing', 'effect_unknown', 'completed', 'failed')),
  stage text NOT NULL DEFAULT 'reserved',
  max_seconds integer NOT NULL CHECK (max_seconds IN (20, 45)),
  reserved_micro_usd bigint NOT NULL CHECK (reserved_micro_usd >= 0),
  actual_micro_usd bigint CHECK (actual_micro_usd >= 0),
  provider_id text,
  script text,
  caption text,
  image_url text,
  audio_url text,
  audio_seconds numeric,
  video_url text,
  video_completed_at timestamptz,
  post_url text,
  metrics jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_class text,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  lease_id uuid,
  lease_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, occurrence_id)
);

CREATE INDEX monk_factory_jobs_due ON public.monk_factory_jobs(next_run_at)
  WHERE status IN ('reserved', 'processing');
CREATE INDEX monk_factory_jobs_period ON public.monk_factory_jobs(user_id, period_key);

CREATE TABLE public.monk_factory_stripe_events (
  id text PRIMARY KEY,
  user_id uuid REFERENCES public.monk_factory_accounts(user_id),
  event_type text NOT NULL,
  stripe_object_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.monk_factory_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monk_factory_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monk_factory_stripe_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.monk_factory_accounts, public.monk_factory_jobs,
  public.monk_factory_stripe_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.monk_factory_accounts, public.monk_factory_jobs TO authenticated;
GRANT ALL ON public.monk_factory_accounts, public.monk_factory_jobs,
  public.monk_factory_stripe_events TO service_role;
CREATE POLICY monk_factory_account_owner ON public.monk_factory_accounts
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY monk_factory_job_owner ON public.monk_factory_jobs
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE FUNCTION public.monk_factory_reserve_profile(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  account public.monk_factory_accounts;
BEGIN
  -- One transaction owns the shared 25-profile capacity calculation.
  PERFORM pg_advisory_xact_lock(hashtextextended('ai_monk_factory_profiles', 0));
  INSERT INTO public.monk_factory_accounts(user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id FOR UPDATE;
  IF account.profile_reserved_at IS NOT NULL THEN RETURN to_jsonb(account); END IF;
  IF (SELECT count(*) FROM public.monk_factory_accounts WHERE profile_reserved_at IS NOT NULL) >= 25 THEN
    RAISE EXCEPTION 'profile_capacity';
  END IF;
  UPDATE public.monk_factory_accounts SET profile_reserved_at = now()
    WHERE user_id = p_user_id RETURNING * INTO account;
  RETURN to_jsonb(account);
END;
$$;

CREATE FUNCTION public.monk_factory_reserve_job(p_user_id uuid, p_occurrence_id text, p_kind text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  account public.monk_factory_accounts;
  job public.monk_factory_jobs;
  quota_period text;
  trial boolean;
  max_attempts integer;
  max_outputs integer;
  reservation bigint;
  budget bigint;
  attempts bigint;
  outputs bigint;
BEGIN
  IF p_kind IS NULL OR p_kind NOT IN ('avatar', 'video') OR p_occurrence_id IS NULL
      OR length(p_occurrence_id) NOT BETWEEN 1 AND 160 THEN
    RAISE EXCEPTION 'invalid_job';
  END IF;
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR account.profile_reserved_at IS NULL THEN RAISE EXCEPTION 'profile_required'; END IF;
  SELECT * INTO job FROM public.monk_factory_jobs
    WHERE user_id = p_user_id AND occurrence_id = p_occurrence_id;
  IF FOUND THEN
    IF job.kind <> p_kind THEN RAISE EXCEPTION 'occurrence_conflict'; END IF;
    RETURN to_jsonb(job);
  END IF;
  trial := account.subscription_status = 'trialing';
  IF account.stripe_subscription_id IS NULL OR (
    (trial AND now() >= account.trial_start AND now() < account.trial_end) OR
    (account.subscription_status = 'active' AND account.period_paid
      AND now() >= account.period_start AND now() < account.period_end)
  ) IS NOT TRUE THEN RAISE EXCEPTION 'subscription_required'; END IF;
  quota_period := CASE WHEN trial THEN 'trial:' || account.stripe_subscription_id
    ELSE 'paid:' || account.stripe_subscription_id || ':' || extract(epoch FROM account.period_start)::text END;
  max_attempts := CASE WHEN trial THEN 3 ELSE 36 END;
  max_outputs := CASE WHEN trial THEN 3 ELSE 30 END;
  budget := CASE WHEN trial THEN 4250000 ELSE 70000000 END;
  reservation := CASE WHEN p_kind = 'avatar' THEN 1600000 WHEN trial THEN 860000 ELSE 1872500 END;
  IF p_kind = 'avatar' THEN
    IF EXISTS (SELECT 1 FROM public.monk_factory_jobs WHERE user_id = p_user_id AND kind = 'avatar') THEN
      RAISE EXCEPTION 'avatar_exists';
    END IF;
  ELSE
    SELECT count(*), count(*) FILTER (WHERE status <> 'failed' OR video_completed_at IS NOT NULL)
      INTO attempts, outputs FROM public.monk_factory_jobs
      WHERE user_id = p_user_id AND period_key = quota_period AND kind = 'video';
    IF attempts >= max_attempts OR outputs >= max_outputs THEN RAISE EXCEPTION 'quota_exhausted'; END IF;
  END IF;
  IF coalesce((SELECT sum(reserved_micro_usd) FROM public.monk_factory_jobs
    WHERE user_id = p_user_id AND period_key = quota_period), 0) + reservation > budget THEN
    RAISE EXCEPTION 'budget_exhausted';
  END IF;
  INSERT INTO public.monk_factory_jobs(user_id, occurrence_id, kind, period_key, max_seconds, reserved_micro_usd)
    VALUES (p_user_id, p_occurrence_id, p_kind, quota_period, CASE WHEN trial THEN 20 ELSE 45 END, reservation)
    RETURNING * INTO job;
  RETURN to_jsonb(job);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.monk_factory_reserve_profile(uuid),
  public.monk_factory_reserve_job(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monk_factory_reserve_profile(uuid),
  public.monk_factory_reserve_job(uuid, text, text) TO service_role;
