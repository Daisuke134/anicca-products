ALTER TABLE public.monk_factory_accounts
  ADD COLUMN IF NOT EXISTS auto_post_paused boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.monk_factory_reject_paused_autopost()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.auto_post AND NEW.auto_post_paused THEN
    RAISE EXCEPTION 'autopost_paused';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS monk_factory_reject_paused_autopost ON public.monk_factory_accounts;
CREATE TRIGGER monk_factory_reject_paused_autopost
  BEFORE INSERT OR UPDATE OF auto_post, auto_post_paused ON public.monk_factory_accounts
  FOR EACH ROW EXECUTE FUNCTION public.monk_factory_reject_paused_autopost();

CREATE OR REPLACE FUNCTION public.monk_factory_set_autopost_paused(p_user_id uuid, p_paused boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE account public.monk_factory_accounts;
BEGIN
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile_required'; END IF;
  IF NOT account.auto_post_intent THEN RAISE EXCEPTION 'autopost_intent_required'; END IF;

  IF p_paused THEN
    UPDATE public.monk_factory_accounts SET auto_post = false, auto_post_paused = true
      WHERE user_id = p_user_id RETURNING * INTO account;
  ELSE
    IF NOT account.auto_post_paused AND account.auto_post THEN
      RETURN jsonb_build_object('auto_post', true, 'auto_post_intent', true, 'auto_post_paused', false);
    END IF;
    IF NOT account.auto_post_paused THEN RAISE EXCEPTION 'autopost_not_paused'; END IF;
    UPDATE public.monk_factory_accounts SET auto_post_paused = false WHERE user_id = p_user_id;
    -- Reuse the atomic entitlement, fresh Instagram-readback and quota checks.
    PERFORM public.monk_factory_set_autopost(p_user_id);
    SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object('auto_post', account.auto_post,
    'auto_post_intent', account.auto_post_intent, 'auto_post_paused', account.auto_post_paused);
END;
$$;

CREATE OR REPLACE FUNCTION public.monk_factory_start_autopost_if_intended(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE account public.monk_factory_accounts;
BEGIN
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile_required'; END IF;
  -- A stale OAuth/status readback cannot override a Stop or an explicit Pause.
  IF NOT account.auto_post_intent OR account.auto_post_paused THEN
    RETURN jsonb_build_object('auto_post', account.auto_post,
      'auto_post_intent', account.auto_post_intent, 'auto_post_paused', account.auto_post_paused);
  END IF;
  IF NOT account.auto_post THEN PERFORM public.monk_factory_set_autopost(p_user_id); END IF;
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id;
  RETURN jsonb_build_object('auto_post', account.auto_post,
    'auto_post_intent', account.auto_post_intent, 'auto_post_paused', account.auto_post_paused);
END;
$$;

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
    UPDATE public.monk_factory_accounts SET auto_post = false, auto_post_intent = false, auto_post_paused = false
      WHERE user_id = p_user_id;
  END IF;
  RETURN jsonb_build_object('auto_post_intent', p_enabled, 'auto_post', false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.monk_factory_set_autopost_paused(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monk_factory_set_autopost_paused(uuid, boolean) TO service_role;
REVOKE EXECUTE ON FUNCTION public.monk_factory_start_autopost_if_intended(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monk_factory_start_autopost_if_intended(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.monk_factory_set_autopost_intent(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monk_factory_set_autopost_intent(uuid, boolean) TO service_role;
