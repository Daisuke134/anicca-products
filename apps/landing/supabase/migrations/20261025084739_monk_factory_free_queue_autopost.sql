CREATE OR REPLACE FUNCTION public.monk_factory_set_autopost_intent(p_user_id uuid, p_enabled boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE usage jsonb; has_unposted_free_video boolean;
BEGIN
  IF p_enabled THEN
    usage := public.monk_factory_usage(p_user_id);
    SELECT EXISTS (
      SELECT 1 FROM public.monk_factory_jobs
      WHERE user_id = p_user_id AND kind = 'video' AND period_key = 'free:lifetime'
        AND status = 'completed' AND video_url IS NOT NULL AND post_url IS NULL AND post_provider_id IS NULL
    ) INTO has_unposted_free_video;
    IF (coalesce((usage->>'videosRemaining')::integer, 0) <= 0
      OR coalesce((usage->>'attemptsRemaining')::integer, 0) <= 0) AND NOT has_unposted_free_video THEN
      RAISE EXCEPTION 'subscription_required';
    END IF;
    UPDATE public.monk_factory_accounts SET auto_post_intent = true WHERE user_id = p_user_id;
  ELSE
    UPDATE public.monk_factory_accounts SET auto_post = false, auto_post_intent = false WHERE user_id = p_user_id;
  END IF;
  RETURN jsonb_build_object('auto_post_intent', p_enabled, 'auto_post', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.monk_factory_set_autopost(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  account public.monk_factory_accounts;
  trial boolean;
  paid boolean;
  attempts bigint;
  outputs bigint;
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
      AND status = 'completed' AND video_url IS NOT NULL AND post_url IS NULL AND post_provider_id IS NULL
  ) INTO has_unposted_free_video;
  IF NOT trial AND NOT paid AND NOT has_unposted_free_video THEN
    IF NOT public.monk_factory_free_eligible(p_user_id) THEN RAISE EXCEPTION 'subscription_required'; END IF;
    SELECT count(*), count(*) FILTER (WHERE status <> 'failed' OR video_completed_at IS NOT NULL)
      INTO attempts, outputs FROM public.monk_factory_jobs
      WHERE user_id = p_user_id AND period_key = 'free:lifetime' AND kind = 'video';
    IF attempts >= 3 OR outputs >= 3 THEN RAISE EXCEPTION 'subscription_required'; END IF;
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

CREATE OR REPLACE FUNCTION public.monk_factory_schedule_auto(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  account public.monk_factory_accounts;
  job public.monk_factory_jobs;
  usage jsonb;
  eligible boolean;
BEGIN
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR NOT account.auto_post OR account.next_post_at IS NULL OR account.next_post_at > now()
    OR account.avatar_id IS NULL OR account.instagram_account_id IS NULL THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.monk_factory_jobs WHERE id = account.auto_job_id AND post_url IS NULL AND status <> 'failed') THEN RETURN NULL; END IF;
  SELECT * INTO job FROM public.monk_factory_jobs WHERE user_id = p_user_id AND kind = 'video'
    AND status = 'completed' AND video_url IS NOT NULL AND post_url IS NULL AND post_provider_id IS NULL
    ORDER BY video_completed_at, created_at LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    UPDATE public.monk_factory_jobs SET status = 'processing', stage = 'post_ready', autopost_requested = true, next_run_at = now()
      WHERE id = job.id RETURNING * INTO job;
  ELSE
    IF EXISTS (SELECT 1 FROM public.monk_factory_jobs WHERE user_id = p_user_id AND kind = 'video'
      AND status IN ('reserved','processing','effect_unknown')) THEN RETURN NULL; END IF;
    eligible := public.monk_factory_free_eligible(p_user_id);
    IF NOT eligible THEN
      eligible := EXISTS (SELECT 1 FROM public.monk_factory_accounts WHERE user_id = p_user_id
        AND stripe_subscription_id IS NOT NULL AND NOT cancel_at_period_end AND NOT billing_paused AND
        ((subscription_status = 'trialing' AND now() >= trial_start AND now() < trial_end) OR
         (subscription_status = 'active' AND period_paid AND now() >= period_start AND now() < period_end)));
    END IF;
    IF eligible AND public.monk_factory_free_eligible(p_user_id) THEN
      usage := public.monk_factory_usage(p_user_id);
      eligible := coalesce((usage->>'videosRemaining')::integer, 0) > 0
        AND coalesce((usage->>'attemptsRemaining')::integer, 0) > 0;
    END IF;
    IF NOT eligible THEN
      UPDATE public.monk_factory_accounts SET auto_post = false WHERE user_id = p_user_id;
      RETURN NULL;
    END IF;
    PERFORM public.monk_factory_reserve_job(p_user_id, 'auto:' || account.next_post_at::text, 'video');
    UPDATE public.monk_factory_jobs SET origin = 'auto', autopost_requested = true WHERE user_id = p_user_id
      AND occurrence_id = 'auto:' || account.next_post_at::text RETURNING * INTO job;
  END IF;
  UPDATE public.monk_factory_accounts SET auto_job_id = job.id, next_post_at = now() + interval '24 hours' WHERE user_id = p_user_id;
  RETURN to_jsonb(job);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.monk_factory_set_autopost_intent(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monk_factory_set_autopost_intent(uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.monk_factory_set_autopost(uuid), public.monk_factory_schedule_auto(uuid) TO service_role;
