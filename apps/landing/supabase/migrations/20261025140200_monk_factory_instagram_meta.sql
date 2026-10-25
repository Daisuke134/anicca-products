ALTER TABLE public.monk_factory_accounts
  ADD COLUMN instagram_access_token_ciphertext text,
  ADD COLUMN instagram_access_token_expires_at timestamptz,
  ADD COLUMN instagram_business_id text,
  ADD COLUMN instagram_oauth_state_hash text,
  ADD COLUMN instagram_oauth_state_expires_at timestamptz;

ALTER TABLE public.monk_factory_jobs
  ADD COLUMN metrics_checked_at timestamptz;

CREATE UNIQUE INDEX monk_factory_instagram_oauth_state
  ON public.monk_factory_accounts(instagram_oauth_state_hash)
  WHERE instagram_oauth_state_hash IS NOT NULL;

-- OAuth state and encrypted access tokens remain service-role only. Authenticated
-- users keep the prior explicit column grant and cannot read these new fields.
REVOKE SELECT (instagram_access_token_ciphertext, instagram_access_token_expires_at,
  instagram_business_id, instagram_oauth_state_hash, instagram_oauth_state_expires_at)
  ON public.monk_factory_accounts FROM authenticated;

CREATE FUNCTION public.monk_factory_fence_instagram_publish(p_job_id uuid, p_lease_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE job public.monk_factory_jobs; account public.monk_factory_accounts;
BEGIN
  SELECT * INTO job FROM public.monk_factory_jobs WHERE id = p_job_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = job.user_id FOR UPDATE;
  SELECT * INTO job FROM public.monk_factory_jobs WHERE id = p_job_id AND lease_id = p_lease_id
    AND lease_until > now() AND stage = 'post_pending' AND status = 'processing' FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF NOT account.auto_post THEN RAISE EXCEPTION 'autopost_stopped'; END IF;
  IF account.instagram_account_id IS NULL OR account.connected_at IS NULL OR account.social_checked_at IS NULL
      OR account.social_checked_at < now() - interval '1 minute' THEN
    RAISE EXCEPTION 'instagram_required';
  END IF;
  UPDATE public.monk_factory_jobs SET status = 'effect_unknown', updated_at = now(),
    evidence = evidence || jsonb_build_object('publish_fence', jsonb_build_object('effect', 'unknown',
      'phase', 'media_publish_submitting', 'next_action', 'official_readback'))
    WHERE id = p_job_id RETURNING * INTO job;
  RETURN to_jsonb(job);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.monk_factory_fence_instagram_publish(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monk_factory_fence_instagram_publish(uuid, uuid) TO service_role;
