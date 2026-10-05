-- Durable Stripe event, delivery, and subscription state for ebook/Letter fulfillment.
CREATE TABLE IF NOT EXISTS public.ebook_webhook_receipts (
  stripe_event_id text PRIMARY KEY,
  stripe_session_id text UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  product text NOT NULL CHECK (product IN ('ebook', 'letter')),
  lang text NOT NULL CHECK (lang IN ('en', 'jp')),
  attribution_token text,
  payment_status text,
  subscription_status text,
  amount_total bigint,
  amount_paid bigint,
  currency text,
  delivery_status text NOT NULL CHECK (
    delivery_status IN ('processing', 'retryable_failure', 'effect_unknown', 'delivered', 'not_required', 'needs_email')
  ),
  resend_id text,
  error_class text,
  next_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ebook_webhook_receipts_subscription_idx
  ON public.ebook_webhook_receipts (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

ALTER TABLE public.ebook_webhook_receipts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ebook_webhook_receipts TO service_role;

-- Keep a stable subscriber mapping and DB-issued readback generations per Stripe subscription.
CREATE TABLE IF NOT EXISTS public.ebook_subscription_states (
  stripe_subscription_id text PRIMARY KEY,
  subscriber_id text,
  stripe_customer_id text,
  subscription_lang text,
  subscription_status text NOT NULL,
  readback_at timestamptz NOT NULL,
  readback_generation bigint NOT NULL DEFAULT 0,
  stripe_subscription_created_at timestamptz,
  event_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ebook_subscription_states
  ADD COLUMN IF NOT EXISTS subscriber_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_lang text,
  ADD COLUMN IF NOT EXISTS readback_generation bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_subscription_created_at timestamptz;

UPDATE public.ebook_subscription_states AS state
   SET subscriber_id = subscriber.id::text,
       stripe_customer_id = COALESCE(state.stripe_customer_id, subscriber.stripe_customer_id),
       subscription_lang = COALESCE(state.subscription_lang, subscriber.lang)
  FROM public.subscribers AS subscriber
 WHERE state.subscriber_id IS NULL
   AND subscriber.stripe_subscription_id = state.stripe_subscription_id;

ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS stripe_subscription_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_legacy_paid_pending_readback boolean NOT NULL DEFAULT false;

UPDATE public.subscribers
   SET stripe_legacy_paid_pending_readback = true
 WHERE lower(tier) = 'paid'
   AND stripe_subscription_id IS NULL
   AND stripe_legacy_paid_pending_readback = false;

-- Preserve the pre-migration access tier until each existing subscription is read from Stripe.
INSERT INTO public.ebook_subscription_states (
  stripe_subscription_id, subscriber_id, stripe_customer_id, subscription_lang, subscription_status,
  readback_at, readback_generation, event_id, updated_at
)
SELECT DISTINCT ON (subscriber.stripe_subscription_id)
       subscriber.stripe_subscription_id,
       subscriber.id::text,
       subscriber.stripe_customer_id,
       subscriber.lang,
       CASE WHEN lower(subscriber.tier) = 'paid'
            THEN 'legacy_paid_pending_readback'
            ELSE 'legacy_inactive_pending_readback'
       END,
       now(), 0, 'migration_ebook_subscription_mapping', now()
  FROM public.subscribers AS subscriber
 WHERE subscriber.stripe_subscription_id IS NOT NULL
 ORDER BY subscriber.stripe_subscription_id, subscriber.signed_up_at NULLS FIRST, subscriber.id::text
ON CONFLICT (stripe_subscription_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS ebook_subscription_states_subscriber_idx
  ON public.ebook_subscription_states (subscriber_id);

ALTER TABLE public.ebook_subscription_states ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ebook_subscription_states TO service_role;

CREATE OR REPLACE FUNCTION public.upsert_ebook_subscriber(
  p_email text,
  p_lang text,
  p_stripe_customer_id text,
  p_touch_existing boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
  v_subscriber_id text;
  v_outcome text := 'existing';
BEGIN
  v_email := NULLIF(lower(trim(p_email)), '');
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'missing subscriber email';
  END IF;
  IF p_lang IS NULL OR p_lang NOT IN ('en', 'jp') THEN
    RAISE EXCEPTION 'invalid subscriber language';
  END IF;
  IF p_touch_existing IS NULL THEN
    RAISE EXCEPTION 'missing subscriber update mode';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_email, 0));
  SELECT id::text
    INTO v_subscriber_id
    FROM public.subscribers
   WHERE lower(trim(email)) = v_email
   ORDER BY signed_up_at NULLS FIRST, id::text
   LIMIT 1
   FOR UPDATE;

  IF v_subscriber_id IS NULL THEN
    INSERT INTO public.subscribers (
      email, lang, tier, stripe_customer_id, signed_up_at
    ) VALUES (
      v_email, p_lang, 'expired', p_stripe_customer_id, now()
    ) ON CONFLICT DO NOTHING
    RETURNING id::text INTO v_subscriber_id;
    IF v_subscriber_id IS NOT NULL THEN
      v_outcome := 'created';
    ELSE
      SELECT id::text
        INTO v_subscriber_id
        FROM public.subscribers
       WHERE lower(trim(email)) = v_email
       ORDER BY signed_up_at NULLS FIRST, id::text
       LIMIT 1
       FOR UPDATE;
    END IF;
  END IF;

  IF v_subscriber_id IS NULL THEN
    RAISE EXCEPTION 'subscriber row missing after upsert';
  END IF;
  IF v_outcome = 'existing' AND p_touch_existing THEN
    UPDATE public.subscribers
       SET lang = p_lang,
           stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id)
     WHERE id::text = v_subscriber_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'subscriber row missing during upsert';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'outcome', v_outcome, 'subscriber_id', v_subscriber_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_ebook_subscription_readback(
  p_stripe_subscription_id text,
  p_email text,
  p_lang text,
  p_stripe_customer_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
  v_subscriber_id text;
  v_subscriber jsonb;
  v_mapped_subscriber_id text;
  v_existing_subscriber_id text;
  v_generation bigint;
BEGIN
  IF p_stripe_subscription_id IS NULL THEN
    RAISE EXCEPTION 'missing subscription identity';
  END IF;

  v_email := NULLIF(lower(trim(p_email)), '');
  IF v_email IS NOT NULL THEN
    SELECT subscriber_id
      INTO v_mapped_subscriber_id
      FROM public.ebook_subscription_states
     WHERE stripe_subscription_id = p_stripe_subscription_id;
    IF v_mapped_subscriber_id IS NOT NULL THEN
      SELECT id::text
        INTO v_subscriber_id
        FROM public.subscribers
       WHERE id::text = v_mapped_subscriber_id
         AND lower(trim(email)) = v_email
       FOR UPDATE;
      IF v_subscriber_id IS NULL THEN
        RAISE EXCEPTION 'letter subscription email mapping mismatch';
      END IF;
    ELSE
      v_subscriber := public.upsert_ebook_subscriber(
        v_email, p_lang, p_stripe_customer_id, false
      );
      v_subscriber_id := v_subscriber->>'subscriber_id';
    END IF;
    IF v_subscriber_id IS NULL THEN
      RAISE EXCEPTION 'letter subscriber row missing after upsert';
    END IF;
  ELSE
    -- Resolve the mapping without a row lock, then lock subscriber before subscription state
    -- on both paths so concurrent Checkout and lifecycle events have one lock order.
    SELECT subscriber_id
      INTO v_subscriber_id
      FROM public.ebook_subscription_states
     WHERE stripe_subscription_id = p_stripe_subscription_id;
    IF v_subscriber_id IS NULL AND p_stripe_customer_id IS NOT NULL THEN
      SELECT id::text
        INTO v_subscriber_id
        FROM public.subscribers
       WHERE stripe_customer_id = p_stripe_customer_id
       ORDER BY signed_up_at NULLS FIRST
       LIMIT 1;
    END IF;
    IF v_subscriber_id IS NULL THEN
      RAISE EXCEPTION 'letter subscription mapping missing';
    END IF;
  END IF;

  PERFORM 1 FROM public.subscribers WHERE id::text = v_subscriber_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'letter subscriber row missing';
  END IF;

  INSERT INTO public.ebook_subscription_states (
    stripe_subscription_id, subscriber_id, stripe_customer_id, subscription_lang, subscription_status,
    readback_at, readback_generation, event_id
  ) VALUES (
    p_stripe_subscription_id, v_subscriber_id, p_stripe_customer_id, p_lang, 'unknown', now(), 0, ''
  ) ON CONFLICT (stripe_subscription_id) DO NOTHING;

  SELECT subscriber_id, readback_generation
    INTO v_existing_subscriber_id, v_generation
    FROM public.ebook_subscription_states
   WHERE stripe_subscription_id = p_stripe_subscription_id
   FOR UPDATE;
  IF v_existing_subscriber_id IS NULL THEN
    UPDATE public.ebook_subscription_states
       SET subscriber_id = v_subscriber_id
     WHERE stripe_subscription_id = p_stripe_subscription_id;
    v_existing_subscriber_id := v_subscriber_id;
  END IF;
  IF v_existing_subscriber_id IS DISTINCT FROM v_subscriber_id THEN
    RAISE EXCEPTION 'letter subscription subscriber mismatch';
  END IF;

  UPDATE public.ebook_subscription_states
     SET readback_generation = readback_generation + 1,
         stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
         subscription_lang = COALESCE(p_lang, subscription_lang),
         updated_at = now()
   WHERE stripe_subscription_id = p_stripe_subscription_id;
  v_generation := v_generation + 1;

  RETURN jsonb_build_object(
    'outcome', 'reserved', 'generation', v_generation, 'subscriber_id', v_subscriber_id
  );
END;
$$;

DROP FUNCTION IF EXISTS public.apply_ebook_subscription_state(text, text, timestamptz, text, text, text, text);

CREATE OR REPLACE FUNCTION public.apply_ebook_subscription_state(
  p_stripe_subscription_id text,
  p_subscriber_id text,
  p_readback_generation bigint,
  p_subscription_status text,
  p_subscription_created_at timestamptz,
  p_event_id text,
  p_lang text DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_state_subscriber_id text;
  v_current_generation bigint;
  v_current_status text;
  v_legacy_paid_pending boolean;
  v_pointer_subscription_id text;
  v_pointer_created_at timestamptz;
  v_candidate_subscription_id text;
  v_candidate_created_at timestamptz;
  v_candidate_customer_id text;
  v_candidate_lang text;
  v_can_reselect_pointer boolean;
  v_has_access boolean;
BEGIN
  IF p_stripe_subscription_id IS NULL OR p_subscriber_id IS NULL
     OR p_readback_generation IS NULL OR p_readback_generation < 1
     OR p_subscription_status IS NULL OR p_subscription_created_at IS NULL
     OR p_event_id IS NULL THEN
    RAISE EXCEPTION 'missing subscription state identity';
  END IF;

  SELECT stripe_subscription_id, stripe_subscription_created_at, stripe_legacy_paid_pending_readback
    INTO v_pointer_subscription_id, v_pointer_created_at, v_legacy_paid_pending
    FROM public.subscribers
   WHERE id::text = p_subscriber_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'letter subscriber row missing';
  END IF;

  SELECT subscriber_id, readback_generation, subscription_status
    INTO v_state_subscriber_id, v_current_generation, v_current_status
    FROM public.ebook_subscription_states
   WHERE stripe_subscription_id = p_stripe_subscription_id
   FOR UPDATE;
  IF NOT FOUND OR v_state_subscriber_id IS DISTINCT FROM p_subscriber_id THEN
    RAISE EXCEPTION 'letter subscription mapping missing or mismatched';
  END IF;
  IF v_current_generation <> p_readback_generation THEN
    RETURN jsonb_build_object(
      'outcome', 'stale', 'status', v_current_status, 'generation', v_current_generation
    );
  END IF;

  UPDATE public.ebook_subscription_states
     SET stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
         subscription_lang = COALESCE(p_lang, subscription_lang),
         subscription_status = p_subscription_status,
         stripe_subscription_created_at = p_subscription_created_at,
         readback_at = now(),
         event_id = p_event_id,
         updated_at = now()
   WHERE stripe_subscription_id = p_stripe_subscription_id;

  SELECT EXISTS (
    SELECT 1
      FROM public.ebook_subscription_states
     WHERE subscriber_id = p_subscriber_id
       AND subscription_status IN ('active', 'trialing', 'legacy_paid_pending_readback')
  ) OR v_legacy_paid_pending
    INTO v_has_access;

  -- An unmapped legacy pointer is retained until its own Stripe created time is read.
  -- Once known, reselect from every state so an earlier blocked Checkout can converge.
  v_can_reselect_pointer := v_pointer_subscription_id IS NULL
    OR v_pointer_subscription_id = p_stripe_subscription_id
    OR v_pointer_created_at IS NOT NULL;
  IF v_can_reselect_pointer THEN
    SELECT stripe_subscription_id, stripe_subscription_created_at, stripe_customer_id, subscription_lang
      INTO v_candidate_subscription_id, v_candidate_created_at, v_candidate_customer_id, v_candidate_lang
      FROM public.ebook_subscription_states
     WHERE subscriber_id = p_subscriber_id
       AND stripe_subscription_created_at IS NOT NULL
     ORDER BY stripe_subscription_created_at DESC, stripe_subscription_id DESC
     LIMIT 1;

    IF FOUND AND (
      v_pointer_subscription_id IS NULL
      OR v_pointer_subscription_id = p_stripe_subscription_id
      OR v_candidate_created_at > v_pointer_created_at
      OR (v_candidate_created_at = v_pointer_created_at AND v_candidate_subscription_id > v_pointer_subscription_id)
    ) THEN
      v_pointer_subscription_id := v_candidate_subscription_id;
      v_pointer_created_at := v_candidate_created_at;
    ELSE
      v_candidate_subscription_id := NULL;
    END IF;
  ELSE
    v_candidate_subscription_id := NULL;
  END IF;

  UPDATE public.subscribers
     SET tier = CASE WHEN v_has_access THEN 'paid' ELSE 'expired' END,
         stripe_subscription_id = COALESCE(v_candidate_subscription_id, stripe_subscription_id),
         stripe_subscription_created_at = CASE WHEN v_candidate_subscription_id IS NOT NULL THEN v_pointer_created_at ELSE stripe_subscription_created_at END,
         stripe_customer_id = CASE WHEN v_candidate_subscription_id IS NOT NULL THEN COALESCE(v_candidate_customer_id, stripe_customer_id) ELSE stripe_customer_id END,
         lang = CASE WHEN v_candidate_subscription_id IS NOT NULL THEN COALESCE(v_candidate_lang, lang) ELSE lang END,
         unsubscribed_at = CASE
           WHEN v_has_access THEN NULL
           WHEN p_subscription_status = 'canceled' THEN COALESCE(unsubscribed_at, now())
           ELSE unsubscribed_at
         END
   WHERE id::text = p_subscriber_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'letter subscriber row missing during update';
  END IF;

  RETURN jsonb_build_object(
    'outcome', 'applied', 'status', p_subscription_status, 'generation', p_readback_generation
  );
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_ebook_subscriber(text, text, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_ebook_subscriber(text, text, text, boolean)
  TO service_role;
REVOKE ALL ON FUNCTION public.reserve_ebook_subscription_readback(text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ebook_subscription_readback(text, text, text, text)
  TO service_role;
REVOKE ALL ON FUNCTION public.apply_ebook_subscription_state(text, text, bigint, text, timestamptz, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_ebook_subscription_state(text, text, bigint, text, timestamptz, text, text, text)
  TO service_role;
