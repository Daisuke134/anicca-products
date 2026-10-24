ALTER TABLE public.monk_factory_accounts
  ADD COLUMN IF NOT EXISTS auto_post_intent boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.monk_factory_free_eligible(p_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.monk_factory_accounts AS account
    WHERE user_id = p_user_id AND subscription_status NOT IN ('active', 'trialing')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.monk_factory_free_eligible(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monk_factory_free_eligible(uuid) TO service_role;

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
  attempts bigint;
  outputs bigint;
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
    SELECT count(*), count(*) FILTER (WHERE status <> 'failed' OR video_completed_at IS NOT NULL)
      INTO attempts, outputs FROM public.monk_factory_jobs
      WHERE user_id = p_user_id AND period_key = 'free:lifetime' AND kind = 'video';
    IF attempts < 3 AND outputs < 3 THEN RAISE EXCEPTION 'free_quota_remaining'; END IF;
  END IF;
  UPDATE public.monk_factory_accounts SET
    checkout_nonce = gen_random_uuid(), checkout_created_at = date_trunc('second', now()),
    checkout_price_id = p_price_id, checkout_customer_id = stripe_customer_id,
    checkout_email = p_email, checkout_trial = NULL
    WHERE user_id = p_user_id RETURNING * INTO account;
  RETURN to_jsonb(account);
END;
$$;

CREATE OR REPLACE FUNCTION public.monk_factory_advance_job(p_job_id uuid,p_lease_id uuid,p_stage text,p_patch jsonb,p_keep_lease boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE job public.monk_factory_jobs; account public.monk_factory_accounts; next_stage text; allowed text[];
  quota_period text; trial boolean; paid boolean; free_job boolean;
BEGIN
  SELECT * INTO job FROM public.monk_factory_jobs WHERE id = p_job_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = job.user_id FOR UPDATE;
  SELECT * INTO job FROM public.monk_factory_jobs WHERE id = p_job_id AND lease_id = p_lease_id
    AND lease_until > now() AND stage = p_stage FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'invalid_job_transition'; END IF;
  next_stage := coalesce(p_patch->>'stage', job.stage);
  allowed := CASE job.stage
    WHEN 'reserved' THEN ARRAY['image_pending','script_submitting']
    WHEN 'image_pending' THEN ARRAY['image_submitting']
    WHEN 'image_submitting' THEN ARRAY['image_ready']
    WHEN 'image_ready' THEN ARRAY['avatar_submitting']
    WHEN 'avatar_submitting' THEN ARRAY['avatar_pending']
    WHEN 'avatar_pending' THEN ARRAY['completed']
    WHEN 'script_submitting' THEN ARRAY['script_ready']
    WHEN 'script_ready' THEN ARRAY['speech_submitting']
    WHEN 'speech_submitting' THEN ARRAY['speech_ready']
    WHEN 'speech_ready' THEN ARRAY['video_submitting']
    WHEN 'video_submitting' THEN ARRAY['video_pending']
    WHEN 'video_pending' THEN ARRAY['completed']
    WHEN 'completed' THEN ARRAY['post_ready']
    WHEN 'post_ready' THEN ARRAY['post_submitting']
    WHEN 'post_submitting' THEN ARRAY['post_pending']
    WHEN 'post_pending' THEN ARRAY['published']
    ELSE ARRAY[]::text[] END;
  IF next_stage <> job.stage AND next_stage <> 'failed' AND NOT next_stage = ANY(allowed) THEN
    RAISE EXCEPTION 'invalid_job_transition';
  END IF;
  IF next_stage LIKE '%\_submitting' ESCAPE '\' AND p_patch->>'status' IS DISTINCT FROM 'effect_unknown' THEN
    RAISE EXCEPTION 'invalid_job_transition';
  END IF;
  IF next_stage <> job.stage AND next_stage LIKE '%\_submitting' ESCAPE '\' THEN
    IF (job.origin = 'auto' OR next_stage = 'post_submitting') AND NOT account.auto_post THEN
      RAISE EXCEPTION 'autopost_stopped';
    END IF;
    free_job := job.period_key = 'free:lifetime' AND job.max_seconds = 20;
    trial := coalesce(account.subscription_status = 'trialing' AND account.stripe_subscription_id IS NOT NULL
      AND NOT account.cancel_at_period_end AND NOT account.billing_paused
      AND now() >= account.trial_start AND now() < account.trial_end, false);
    paid := coalesce(account.subscription_status = 'active' AND account.stripe_subscription_id IS NOT NULL
      AND account.period_paid AND NOT account.cancel_at_period_end AND NOT account.billing_paused
      AND now() >= account.period_start AND now() < account.period_end, false);
    quota_period := CASE WHEN trial THEN 'trial:' || account.stripe_subscription_id
      WHEN paid THEN 'paid:' || account.stripe_subscription_id || ':' || extract(epoch FROM account.period_start)::text
      ELSE NULL END;
    IF NOT free_job AND NOT (trial OR paid) THEN RAISE EXCEPTION 'subscription_required'; END IF;
    IF NOT free_job AND job.period_key <> quota_period THEN RAISE EXCEPTION 'job_period_expired'; END IF;
    IF (job.origin = 'auto' OR next_stage = 'post_submitting') AND
      (account.instagram_account_id IS NULL OR account.connected_at IS NULL OR account.social_checked_at IS NULL
        OR account.social_checked_at < now() - interval '1 minute') THEN
      RAISE EXCEPTION 'instagram_required';
    END IF;
  END IF;
  UPDATE public.monk_factory_jobs SET
    status = coalesce(p_patch->>'status', status), stage = next_stage,
    provider_id = coalesce(p_patch->>'provider_id', provider_id),
    script = coalesce(p_patch->>'script', script), caption = coalesce(p_patch->>'caption', caption),
    source_ids = coalesce(p_patch->'source_ids', source_ids),
    image_blob_key = coalesce(p_patch->>'image_blob_key', image_blob_key),
    image_receipt_id = coalesce(p_patch->>'image_receipt_id', image_receipt_id),
    avatar_provider_id = coalesce(p_patch->>'avatar_provider_id', avatar_provider_id),
    script_receipt_id = coalesce(p_patch->>'script_receipt_id', script_receipt_id),
    speech_receipt_id = coalesce(p_patch->>'speech_receipt_id', speech_receipt_id),
    video_provider_id = coalesce(p_patch->>'video_provider_id', video_provider_id),
    post_provider_id = coalesce(p_patch->>'post_provider_id', post_provider_id), post_id = coalesce(p_patch->>'post_id', post_id),
    image_url = coalesce(p_patch->>'image_url', image_url), audio_url = coalesce(p_patch->>'audio_url', audio_url),
    audio_seconds = coalesce((p_patch->>'audio_seconds')::numeric, audio_seconds),
    video_url = coalesce(p_patch->>'video_url', video_url), post_url = coalesce(p_patch->>'post_url', post_url),
    video_completed_at = coalesce((p_patch->>'video_completed_at')::timestamptz, video_completed_at),
    metrics = coalesce(p_patch->'metrics', metrics), metrics_at = coalesce((p_patch->>'metrics_at')::timestamptz, metrics_at),
    evidence = evidence || coalesce(p_patch->'evidence','{}'::jsonb), error_class = p_patch->>'error_class',
    image_nonce = CASE WHEN next_stage = 'image_pending' THEN coalesce(image_nonce, gen_random_uuid()) ELSE image_nonce END,
    image_ticket_until = CASE WHEN next_stage = 'image_pending' THEN now() + interval '5 minutes' ELSE image_ticket_until END,
    next_run_at = coalesce((p_patch->>'next_run_at')::timestamptz, now() + interval '30 seconds'),
    lease_id = CASE WHEN p_keep_lease THEN lease_id ELSE NULL END,
    lease_until = CASE WHEN p_keep_lease THEN lease_until ELSE NULL END, updated_at = now()
    WHERE id = p_job_id RETURNING * INTO job;
  IF job.kind = 'avatar' AND next_stage = 'completed' THEN
    IF job.avatar_provider_id IS NULL OR job.image_url IS NULL THEN RAISE EXCEPTION 'invalid_job_transition'; END IF;
    UPDATE public.monk_factory_accounts SET avatar_id = job.avatar_provider_id, avatar_image_url = job.image_url WHERE user_id = job.user_id;
  END IF;
  RETURN to_jsonb(job);
END;
$$;

CREATE OR REPLACE FUNCTION public.monk_factory_set_autopost(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE account public.monk_factory_accounts; trial boolean; paid boolean; attempts bigint; outputs bigint;
BEGIN
  PERFORM public.monk_factory_usage(p_user_id);
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id FOR UPDATE;
  trial := coalesce(account.subscription_status = 'trialing' AND account.stripe_subscription_id IS NOT NULL
    AND NOT account.cancel_at_period_end AND NOT account.billing_paused
    AND now() >= account.trial_start AND now() < account.trial_end, false);
  paid := coalesce(account.subscription_status = 'active' AND account.stripe_subscription_id IS NOT NULL
    AND account.period_paid AND NOT account.cancel_at_period_end AND NOT account.billing_paused
    AND now() >= account.period_start AND now() < account.period_end, false);
  IF NOT trial AND NOT paid THEN
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
      UPDATE public.monk_factory_accounts SET auto_post = false, auto_post_intent = false WHERE user_id = p_user_id;
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

CREATE OR REPLACE FUNCTION public.monk_factory_usage(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE account public.monk_factory_accounts; trial boolean; paid boolean; quota_period text; attempts bigint; outputs bigint;
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
  ELSE RETURN jsonb_build_object('videosRemaining', NULL, 'attemptsRemaining', NULL, 'maxSeconds', NULL, 'periodEnd', NULL, 'asOf', now());
  END IF;
  SELECT count(*), count(*) FILTER (WHERE status <> 'failed' OR video_completed_at IS NOT NULL)
    INTO attempts, outputs FROM public.monk_factory_jobs
    WHERE user_id = p_user_id AND period_key = quota_period AND kind = 'video';
  RETURN jsonb_build_object(
    'videosRemaining', greatest(0, (CASE WHEN trial OR quota_period = 'free:lifetime' THEN 3 ELSE 30 END) - outputs),
    'attemptsRemaining', greatest(0, (CASE WHEN trial OR quota_period = 'free:lifetime' THEN 3 ELSE 36 END) - attempts),
    'maxSeconds', CASE WHEN trial OR quota_period = 'free:lifetime' THEN 20 ELSE 45 END,
    'periodEnd', CASE WHEN trial THEN account.trial_end WHEN quota_period = 'free:lifetime' THEN NULL ELSE account.period_end END,
    'asOf', now());
END;
$$;

CREATE FUNCTION public.monk_factory_set_autopost_intent(p_user_id uuid, p_enabled boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE usage jsonb;
BEGIN
  IF p_enabled THEN
    usage := public.monk_factory_usage(p_user_id);
    IF coalesce((usage->>'videosRemaining')::integer, 0) <= 0
      OR coalesce((usage->>'attemptsRemaining')::integer, 0) <= 0 THEN
      RAISE EXCEPTION 'subscription_required';
    END IF;
    UPDATE public.monk_factory_accounts SET auto_post_intent = true WHERE user_id = p_user_id;
  ELSE
    UPDATE public.monk_factory_accounts SET auto_post = false, auto_post_intent = false WHERE user_id = p_user_id;
  END IF;
  RETURN jsonb_build_object('auto_post_intent', p_enabled, 'auto_post', false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.monk_factory_set_autopost_intent(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monk_factory_set_autopost_intent(uuid, boolean) TO service_role;

GRANT EXECUTE ON FUNCTION public.monk_factory_reserve_job(uuid, text, text),
  public.monk_factory_checkout_context(uuid, text, text), public.monk_factory_advance_job(uuid, uuid, text, jsonb, boolean),
  public.monk_factory_set_autopost(uuid), public.monk_factory_schedule_auto(uuid), public.monk_factory_usage(uuid)
  TO service_role;
