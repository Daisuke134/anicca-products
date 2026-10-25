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
  max_attempts := CASE WHEN free THEN 6 WHEN trial THEN 3 ELSE 36 END;
  max_outputs := CASE WHEN trial OR free THEN 3 ELSE 30 END;
  budget := CASE WHEN free THEN 6760000 WHEN trial THEN 4250000 ELSE 70000000 END;
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

CREATE OR REPLACE FUNCTION public.monk_factory_checkout_context(p_user_id uuid, p_price_id text, p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  account public.monk_factory_accounts;
  completed bigint;
BEGIN
  IF p_price_id IS NULL OR p_price_id !~ '^price_[A-Za-z0-9]+$'
    OR p_email IS NULL OR length(p_email) NOT BETWEEN 1 AND 320 THEN
    RAISE EXCEPTION 'invalid_checkout';
  END IF;
  INSERT INTO public.monk_factory_accounts(user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id FOR UPDATE;
  IF account.checkout_nonce IS NOT NULL THEN RETURN to_jsonb(account); END IF;
  IF account.stripe_subscription_id IS NOT NULL
    AND account.subscription_status NOT IN ('none', 'canceled', 'incomplete_expired') THEN
    RAISE EXCEPTION 'subscription_exists';
  END IF;
  IF public.monk_factory_free_eligible(p_user_id) THEN
    SELECT count(*) FILTER (WHERE video_completed_at IS NOT NULL AND video_url IS NOT NULL)
      INTO completed FROM public.monk_factory_jobs
      WHERE user_id = p_user_id AND period_key = 'free:lifetime' AND kind = 'video';
    IF completed < 3 THEN RAISE EXCEPTION 'free_quota_remaining'; END IF;
  END IF;
  UPDATE public.monk_factory_accounts SET
    checkout_nonce = gen_random_uuid(), checkout_created_at = date_trunc('second', now()),
    checkout_price_id = p_price_id, checkout_customer_id = stripe_customer_id,
    checkout_email = p_email, checkout_trial = NULL
    WHERE user_id = p_user_id RETURNING * INTO account;
  RETURN to_jsonb(account);
END;
$$;

CREATE OR REPLACE FUNCTION public.monk_factory_usage(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  account public.monk_factory_accounts;
  trial boolean;
  paid boolean;
  quota_period text;
  attempts bigint;
  outputs bigint;
  completed bigint;
  video_limit integer;
  attempt_limit integer;
BEGIN
  INSERT INTO public.monk_factory_accounts(user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id FOR UPDATE;
  trial := coalesce(account.subscription_status = 'trialing' AND account.stripe_subscription_id IS NOT NULL
    AND NOT account.cancel_at_period_end AND NOT account.billing_paused
    AND now() >= account.trial_start AND now() < account.trial_end, false);
  paid := coalesce(account.subscription_status = 'active' AND account.stripe_subscription_id IS NOT NULL
    AND account.period_paid AND NOT account.cancel_at_period_end AND NOT account.billing_paused
    AND now() >= account.period_start AND now() < account.period_end, false);
  IF trial THEN quota_period := 'trial:' || account.stripe_subscription_id;
  ELSIF paid THEN quota_period := 'paid:' || account.stripe_subscription_id || ':' || extract(epoch FROM account.period_start)::text;
  ELSIF public.monk_factory_free_eligible(p_user_id) THEN quota_period := 'free:lifetime';
  ELSE RETURN jsonb_build_object('videosRemaining',NULL,'attemptsRemaining',NULL,'completedVideos',NULL,
    'attemptsUsed',NULL,'maxAttempts',NULL,'maxSeconds',NULL,'periodEnd',NULL,'asOf',now());
  END IF;
  SELECT count(*), count(*) FILTER (WHERE status <> 'failed' OR video_completed_at IS NOT NULL),
    count(*) FILTER (WHERE video_completed_at IS NOT NULL AND video_url IS NOT NULL)
    INTO attempts, outputs, completed FROM public.monk_factory_jobs
    WHERE user_id = p_user_id AND period_key = quota_period AND kind = 'video';
  video_limit := CASE WHEN trial OR quota_period = 'free:lifetime' THEN 3 ELSE 30 END;
  attempt_limit := CASE WHEN quota_period = 'free:lifetime' THEN 6 WHEN trial THEN 3 ELSE 36 END;
  RETURN jsonb_build_object(
    'videosRemaining', greatest(0, video_limit - CASE WHEN quota_period = 'free:lifetime' THEN completed ELSE outputs END),
    'attemptsRemaining', greatest(0, attempt_limit - attempts),
    'completedVideos', completed,
    'attemptsUsed', attempts,
    'maxAttempts', attempt_limit,
    'maxSeconds', CASE WHEN trial OR quota_period = 'free:lifetime' THEN 20 ELSE 45 END,
    'periodEnd', CASE WHEN trial THEN account.trial_end WHEN quota_period = 'free:lifetime' THEN NULL ELSE account.period_end END,
    'asOf', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.monk_factory_set_autopost(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE account public.monk_factory_accounts; trial boolean; paid boolean; attempts bigint; outputs bigint;
  has_unposted_free_video boolean;
BEGIN
  PERFORM public.monk_factory_usage(p_user_id);
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id FOR UPDATE;
  trial := coalesce(account.subscription_status = 'trialing' AND account.stripe_subscription_id IS NOT NULL
    AND NOT account.cancel_at_period_end AND NOT account.billing_paused
    AND now() >= account.trial_start AND now() < account.trial_end, false);
  paid := coalesce(account.subscription_status = 'active' AND account.stripe_subscription_id IS NOT NULL
    AND account.period_paid AND NOT account.cancel_at_period_end AND NOT account.billing_paused
    AND now() >= account.period_start AND now() < account.period_end, false);
  SELECT EXISTS (
    SELECT 1 FROM public.monk_factory_jobs
    WHERE user_id = p_user_id AND kind = 'video' AND period_key = 'free:lifetime'
      AND video_completed_at IS NOT NULL AND video_url IS NOT NULL AND post_url IS NULL AND post_provider_id IS NULL
  ) INTO has_unposted_free_video;
  IF NOT trial AND NOT paid AND NOT has_unposted_free_video THEN
    IF NOT public.monk_factory_free_eligible(p_user_id) THEN RAISE EXCEPTION 'subscription_required'; END IF;
    SELECT count(*), count(*) FILTER (WHERE status <> 'failed' OR video_completed_at IS NOT NULL)
      INTO attempts, outputs FROM public.monk_factory_jobs
      WHERE user_id = p_user_id AND period_key = 'free:lifetime' AND kind = 'video';
    IF attempts >= 6 OR outputs >= 3 THEN RAISE EXCEPTION 'subscription_required'; END IF;
  END IF;
  UPDATE public.monk_factory_accounts SET auto_post = true, auto_post_intent = true,
    next_post_at = CASE WHEN auto_post THEN coalesce(next_post_at, now()) ELSE now() END
    WHERE user_id = p_user_id AND instagram_account_id IS NOT NULL
      AND connected_at IS NOT NULL AND social_checked_at > now() - interval '1 minute'
    RETURNING * INTO account;
  IF NOT FOUND THEN RAISE EXCEPTION 'instagram_required'; END IF;
  RETURN jsonb_build_object('auto_post', account.auto_post);
END;
$$;

GRANT EXECUTE ON FUNCTION public.monk_factory_reserve_job(uuid, text, text),
  public.monk_factory_checkout_context(uuid, text, text), public.monk_factory_usage(uuid),
  public.monk_factory_set_autopost(uuid) TO service_role;
