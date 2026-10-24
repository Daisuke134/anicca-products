CREATE TABLE public.monk_factory_company_budget (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  daily_cap_micro_usd bigint NOT NULL CHECK (daily_cap_micro_usd BETWEEN 0 AND 1000000000),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.monk_factory_company_budget(id, daily_cap_micro_usd) VALUES (true, 10000000);

ALTER TABLE public.monk_factory_company_budget ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.monk_factory_company_budget FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.monk_factory_company_budget TO service_role;

CREATE OR REPLACE FUNCTION public.monk_factory_company_budget_status()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  company_cap bigint;
  company_reserved bigint;
  utc_day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  utc_day_end timestamptz := utc_day_start + interval '1 day';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('monk_factory_company_budget_utc_v1', 0));
  SELECT daily_cap_micro_usd INTO company_cap FROM public.monk_factory_company_budget WHERE id = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('ready', false, 'reason', 'spend_cap_setup'); END IF;
  SELECT coalesce(sum(reserved_micro_usd), 0) INTO company_reserved
    FROM public.monk_factory_jobs
    WHERE (created_at >= utc_day_start AND created_at < utc_day_end)
       OR (stage NOT IN ('post_ready', 'post_submitting', 'post_pending', 'published')
         AND ((updated_at >= utc_day_start AND updated_at < utc_day_end)
           OR status IN ('reserved', 'processing', 'effect_unknown')));
  RETURN jsonb_build_object('ready', company_reserved < company_cap,
    'reason', CASE WHEN company_reserved >= company_cap THEN 'company_budget_exhausted' ELSE NULL END);
END;
$$;

CREATE OR REPLACE FUNCTION public.monk_factory_reserve_job(p_user_id uuid, p_occurrence_id text, p_kind text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  account public.monk_factory_accounts;
  job public.monk_factory_jobs;
  quota_period text;
  trial boolean;
  paid boolean;
  free boolean;
  max_attempts integer;
  max_outputs integer;
  reservation bigint;
  budget bigint;
  attempts bigint;
  outputs bigint;
  company_cap bigint;
  company_reserved bigint;
  utc_day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  utc_day_end timestamptz := utc_day_start + interval '1 day';
BEGIN
  IF p_kind IS NULL OR p_kind NOT IN ('avatar', 'video') OR p_occurrence_id IS NULL
      OR length(p_occurrence_id) NOT BETWEEN 1 AND 160 THEN
    RAISE EXCEPTION 'invalid_job';
  END IF;
  INSERT INTO public.monk_factory_accounts(user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id FOR UPDATE;
  SELECT * INTO job FROM public.monk_factory_jobs
    WHERE user_id = p_user_id AND occurrence_id = p_occurrence_id;
  IF FOUND THEN
    IF job.kind <> p_kind THEN RAISE EXCEPTION 'occurrence_conflict'; END IF;
    RETURN to_jsonb(job);
  END IF;

  trial := coalesce(account.subscription_status = 'trialing' AND account.stripe_subscription_id IS NOT NULL
    AND NOT account.cancel_at_period_end AND NOT account.billing_paused
    AND now() >= account.trial_start AND now() < account.trial_end, false);
  paid := coalesce(account.subscription_status = 'active' AND account.stripe_subscription_id IS NOT NULL
    AND account.period_paid AND NOT account.cancel_at_period_end AND NOT account.billing_paused
    AND now() >= account.period_start AND now() < account.period_end, false);
  free := NOT trial AND NOT paid AND public.monk_factory_free_eligible(p_user_id);
  IF NOT (trial OR paid OR free) THEN RAISE EXCEPTION 'subscription_required'; END IF;

  quota_period := CASE WHEN trial THEN 'trial:' || account.stripe_subscription_id
    WHEN paid THEN 'paid:' || account.stripe_subscription_id || ':' || extract(epoch FROM account.period_start)::text
    ELSE 'free:lifetime' END;
  max_attempts := CASE WHEN trial OR free THEN 3 ELSE 36 END;
  max_outputs := CASE WHEN trial OR free THEN 3 ELSE 30 END;
  budget := CASE WHEN trial OR free THEN 4250000 ELSE 70000000 END;
  reservation := CASE WHEN p_kind = 'avatar' THEN 1600000
    WHEN trial OR free THEN 860000 ELSE 1872500 END;
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

  PERFORM pg_advisory_xact_lock(hashtextextended('monk_factory_company_budget_utc_v1', 0));
  SELECT daily_cap_micro_usd INTO company_cap FROM public.monk_factory_company_budget WHERE id = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'spend_cap_setup'; END IF;
  SELECT coalesce(sum(reserved_micro_usd), 0) INTO company_reserved
    FROM public.monk_factory_jobs
    WHERE (created_at >= utc_day_start AND created_at < utc_day_end)
       OR (stage NOT IN ('post_ready', 'post_submitting', 'post_pending', 'published')
         AND ((updated_at >= utc_day_start AND updated_at < utc_day_end)
           OR status IN ('reserved', 'processing', 'effect_unknown')));
  IF company_reserved + reservation > company_cap THEN RAISE EXCEPTION 'company_budget_exhausted'; END IF;

  INSERT INTO public.monk_factory_jobs(user_id, occurrence_id, kind, period_key, max_seconds, reserved_micro_usd)
    VALUES (p_user_id, p_occurrence_id, p_kind, quota_period, CASE WHEN trial OR free THEN 20 ELSE 45 END, reservation)
    RETURNING * INTO job;
  RETURN to_jsonb(job);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.monk_factory_company_budget_status(),
  public.monk_factory_reserve_job(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monk_factory_company_budget_status(),
  public.monk_factory_reserve_job(uuid, text, text) TO service_role;
