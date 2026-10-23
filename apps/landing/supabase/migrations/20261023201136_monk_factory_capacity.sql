CREATE OR REPLACE FUNCTION public.monk_factory_apply_billing(p_user_id uuid, p_nonce uuid, p_state jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  account public.monk_factory_accounts;
  release_unused boolean;
BEGIN
  SELECT * INTO account FROM public.monk_factory_accounts WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR p_nonce IS NULL OR account.billing_sync_nonce IS DISTINCT FROM p_nonce
    OR account.billing_sync_until IS NULL OR account.billing_sync_until <= now() THEN
    RAISE EXCEPTION 'billing_sync_conflict';
  END IF;
  IF jsonb_typeof(p_state) IS DISTINCT FROM 'object' OR NOT p_state ?& ARRAY[
    'stripe_customer_id', 'stripe_subscription_id', 'subscription_status', 'trial_used',
    'trial_start', 'trial_end', 'period_start', 'period_end', 'period_paid',
    'cancel_at_period_end', 'billing_paused'] THEN RAISE EXCEPTION 'invalid_billing'; END IF;
  release_unused := p_state->>'subscription_status' IN ('canceled', 'incomplete_expired')
    AND account.stripe_subscription_id = p_state->>'stripe_subscription_id'
    AND account.checkout_nonce::text = p_state->>'subscription_checkout_nonce'
    AND account.social_profile IS NULL AND account.social_submit_started_at IS NULL;
  UPDATE public.monk_factory_accounts SET
    stripe_customer_id = p_state->>'stripe_customer_id',
    stripe_subscription_id = p_state->>'stripe_subscription_id',
    subscription_status = p_state->>'subscription_status',
    trial_used = account.trial_used OR (p_state->>'trial_used')::boolean,
    trial_start = (p_state->>'trial_start')::timestamptz,
    trial_end = (p_state->>'trial_end')::timestamptz,
    period_start = (p_state->>'period_start')::timestamptz,
    period_end = (p_state->>'period_end')::timestamptz,
    period_paid = (p_state->>'period_paid')::boolean,
    cancel_at_period_end = (p_state->>'cancel_at_period_end')::boolean,
    billing_paused = (p_state->>'billing_paused')::boolean,
    auto_post = account.auto_post AND coalesce((p_state->>'auto_post')::boolean, true),
    profile_reserved_at = CASE WHEN release_unused THEN NULL ELSE account.profile_reserved_at END,
    checkout_nonce = CASE WHEN release_unused THEN NULL ELSE account.checkout_nonce END,
    checkout_created_at = CASE WHEN release_unused THEN NULL ELSE account.checkout_created_at END,
    checkout_price_id = CASE WHEN release_unused THEN NULL ELSE account.checkout_price_id END,
    checkout_customer_id = CASE WHEN release_unused THEN NULL ELSE account.checkout_customer_id END,
    checkout_email = CASE WHEN release_unused THEN NULL ELSE account.checkout_email END,
    checkout_trial = CASE WHEN release_unused THEN NULL ELSE account.checkout_trial END,
    checkout_session_id = CASE WHEN release_unused THEN NULL ELSE account.checkout_session_id END,
    social_lease_id = CASE WHEN release_unused THEN NULL ELSE account.social_lease_id END,
    social_lease_until = CASE WHEN release_unused THEN NULL ELSE account.social_lease_until END,
    billing_checked_at = now(), billing_sync_nonce = NULL, billing_sync_until = NULL
    WHERE user_id = p_user_id RETURNING * INTO account;
  RETURN to_jsonb(account);
END;
$$;

CREATE FUNCTION public.monk_factory_release_unused_profile(
  p_user_id uuid, p_checkout_nonce uuid, p_checkout_session_id text, p_subscription_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE account public.monk_factory_accounts;
BEGIN
  UPDATE public.monk_factory_accounts SET
    profile_reserved_at = NULL, checkout_nonce = NULL, checkout_created_at = NULL,
    checkout_price_id = NULL, checkout_customer_id = NULL, checkout_email = NULL,
    checkout_trial = NULL, checkout_session_id = NULL, social_lease_id = NULL, social_lease_until = NULL
    WHERE user_id = p_user_id AND checkout_nonce = p_checkout_nonce AND checkout_session_id = p_checkout_session_id
      AND social_profile IS NULL AND social_submit_started_at IS NULL
      AND ((stripe_subscription_id IS NULL AND p_subscription_id IS NULL)
        OR (stripe_subscription_id = p_subscription_id AND subscription_status IN ('canceled', 'incomplete_expired')))
    RETURNING * INTO account;
  RETURN CASE WHEN FOUND THEN to_jsonb(account) ELSE NULL END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.monk_factory_release_unused_profile(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monk_factory_release_unused_profile(uuid, uuid, text, text) TO service_role;
