-- Durable Stripe event and delivery receipts for ebook/Letter fulfillment.
-- Does not change the existing buyers or subscribers table contracts.
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

-- Serialize subscription state changes by subscription id. The observation timestamp
-- comes from a read-only Stripe retrieve call; an older concurrent webhook cannot
-- overwrite a later readback after it waits for this row lock.
CREATE TABLE IF NOT EXISTS public.ebook_subscription_states (
  stripe_subscription_id text PRIMARY KEY,
  subscription_status text NOT NULL,
  readback_at timestamptz NOT NULL,
  event_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ebook_subscription_states ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ebook_subscription_states TO service_role;

-- A PostgREST RPC gives one subscription a single transaction/row lock across
-- the readback generation check and its subscriber access update.
CREATE OR REPLACE FUNCTION public.apply_ebook_subscription_state(
  p_stripe_subscription_id text,
  p_subscription_status text,
  p_readback_at timestamptz,
  p_event_id text,
  p_email text DEFAULT NULL,
  p_lang text DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_previous_readback_at timestamptz;
  v_previous_status text;
  v_tier text;
  v_unsubscribed_at timestamptz;
BEGIN
  IF p_stripe_subscription_id IS NULL OR p_subscription_status IS NULL
     OR p_readback_at IS NULL OR p_event_id IS NULL THEN
    RAISE EXCEPTION 'missing subscription state identity';
  END IF;

  INSERT INTO public.ebook_subscription_states (
    stripe_subscription_id, subscription_status, readback_at, event_id
  ) VALUES (
    p_stripe_subscription_id, 'unknown', '1970-01-01T00:00:00Z'::timestamptz, ''
  ) ON CONFLICT (stripe_subscription_id) DO NOTHING;

  SELECT readback_at, subscription_status
    INTO v_previous_readback_at, v_previous_status
    FROM public.ebook_subscription_states
   WHERE stripe_subscription_id = p_stripe_subscription_id
   FOR UPDATE;

  IF p_readback_at < v_previous_readback_at THEN
    RETURN jsonb_build_object(
      'outcome', 'stale', 'status', v_previous_status, 'readback_at', v_previous_readback_at
    );
  END IF;
  IF p_readback_at = v_previous_readback_at THEN
    IF p_subscription_status = v_previous_status THEN
      RETURN jsonb_build_object(
        'outcome', 'duplicate', 'status', v_previous_status, 'readback_at', v_previous_readback_at
      );
    END IF;
    RETURN jsonb_build_object(
      'outcome', 'conflict', 'status', v_previous_status, 'readback_at', v_previous_readback_at
    );
  END IF;

  v_tier := CASE WHEN p_subscription_status IN ('active', 'trialing') THEN 'paid' ELSE 'expired' END;
  IF p_email IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(lower(trim(p_email)), 0));
    v_unsubscribed_at := CASE WHEN p_subscription_status = 'canceled' THEN now() ELSE NULL END;
    INSERT INTO public.subscribers (
      email, lang, tier, stripe_customer_id, stripe_subscription_id, signed_up_at, unsubscribed_at
    ) VALUES (
      lower(trim(p_email)), p_lang, v_tier, p_stripe_customer_id, p_stripe_subscription_id,
      now(), v_unsubscribed_at
    ) ON CONFLICT DO NOTHING;
    UPDATE public.subscribers
       SET lang = COALESCE(p_lang, lang),
           tier = v_tier,
           stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
           stripe_subscription_id = p_stripe_subscription_id,
           unsubscribed_at = CASE
             WHEN p_subscription_status = 'canceled' THEN COALESCE(unsubscribed_at, now())
             WHEN p_subscription_status IN ('active', 'trialing') THEN NULL
             ELSE unsubscribed_at
           END
     WHERE stripe_subscription_id = p_stripe_subscription_id
        OR lower(email) = lower(trim(p_email));
    IF NOT FOUND THEN
      RAISE EXCEPTION 'letter subscriber row missing after upsert';
    END IF;
  ELSE
    UPDATE public.subscribers
       SET tier = v_tier,
           unsubscribed_at = CASE
             WHEN p_subscription_status = 'canceled' THEN COALESCE(unsubscribed_at, now())
             WHEN p_subscription_status IN ('active', 'trialing') THEN NULL
             ELSE unsubscribed_at
           END
     WHERE stripe_subscription_id = p_stripe_subscription_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'letter subscriber row missing';
    END IF;
  END IF;

  UPDATE public.ebook_subscription_states
     SET subscription_status = p_subscription_status,
         readback_at = p_readback_at,
         event_id = p_event_id,
         updated_at = now()
   WHERE stripe_subscription_id = p_stripe_subscription_id;

  RETURN jsonb_build_object('outcome', 'applied', 'status', p_subscription_status, 'readback_at', p_readback_at);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_ebook_subscription_state(text, text, timestamptz, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_ebook_subscription_state(text, text, timestamptz, text, text, text, text)
  TO service_role;

-- Atomically compare Stripe readback generations and update Letter access.
CREATE OR REPLACE FUNCTION public.apply_ebook_subscription_state(
  p_stripe_subscription_id text,
  p_subscription_status text,
  p_readback_at timestamptz,
  p_event_id text,
  p_email text DEFAULT NULL,
  p_lang text DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_previous_readback_at timestamptz;
  v_previous_status text;
  v_tier text;
BEGIN
  IF p_stripe_subscription_id IS NULL OR p_subscription_status IS NULL
     OR p_readback_at IS NULL OR p_event_id IS NULL THEN
    RAISE EXCEPTION 'missing subscription state identity';
  END IF;

  INSERT INTO public.ebook_subscription_states (
    stripe_subscription_id, subscription_status, readback_at, event_id
  ) VALUES (
    p_stripe_subscription_id, 'unknown', '1970-01-01T00:00:00Z'::timestamptz, ''
  ) ON CONFLICT (stripe_subscription_id) DO NOTHING;

  SELECT readback_at, subscription_status
    INTO v_previous_readback_at, v_previous_status
    FROM public.ebook_subscription_states
   WHERE stripe_subscription_id = p_stripe_subscription_id
   FOR UPDATE;

  IF p_readback_at < v_previous_readback_at THEN
    RETURN jsonb_build_object(
      'outcome', 'stale', 'status', v_previous_status, 'readback_at', v_previous_readback_at
    );
  END IF;
  IF p_readback_at = v_previous_readback_at THEN
    IF p_subscription_status = v_previous_status THEN
      RETURN jsonb_build_object(
        'outcome', 'duplicate', 'status', v_previous_status, 'readback_at', v_previous_readback_at
      );
    END IF;
    RETURN jsonb_build_object(
      'outcome', 'conflict', 'status', v_previous_status, 'readback_at', v_previous_readback_at
    );
  END IF;

  v_tier := CASE WHEN p_subscription_status IN ('active', 'trialing') THEN 'paid' ELSE 'expired' END;
  IF p_email IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(lower(trim(p_email)), 0));
    UPDATE public.subscribers
       SET lang = COALESCE(p_lang, lang),
           tier = v_tier,
           stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
           stripe_subscription_id = p_stripe_subscription_id,
           unsubscribed_at = CASE
             WHEN p_subscription_status = 'canceled' THEN COALESCE(unsubscribed_at, now())
             WHEN p_subscription_status IN ('active', 'trialing') THEN NULL
             ELSE unsubscribed_at
           END
     WHERE stripe_subscription_id = p_stripe_subscription_id;
    IF NOT FOUND THEN
      UPDATE public.subscribers
         SET lang = COALESCE(p_lang, lang),
             tier = v_tier,
             stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
             stripe_subscription_id = p_stripe_subscription_id,
             unsubscribed_at = CASE
               WHEN p_subscription_status = 'canceled' THEN COALESCE(unsubscribed_at, now())
               WHEN p_subscription_status IN ('active', 'trialing') THEN NULL
               ELSE unsubscribed_at
             END
       WHERE lower(email) = lower(trim(p_email));
    END IF;
    IF NOT FOUND THEN
      INSERT INTO public.subscribers (
        email, lang, tier, stripe_customer_id, stripe_subscription_id, signed_up_at, unsubscribed_at
      ) VALUES (
        lower(trim(p_email)), p_lang, v_tier, p_stripe_customer_id, p_stripe_subscription_id,
        now(), CASE WHEN p_subscription_status = 'canceled' THEN now() ELSE NULL END
      );
    END IF;
  ELSE
    UPDATE public.subscribers
       SET tier = v_tier,
           unsubscribed_at = CASE
             WHEN p_subscription_status = 'canceled' THEN COALESCE(unsubscribed_at, now())
             WHEN p_subscription_status IN ('active', 'trialing') THEN NULL
             ELSE unsubscribed_at
           END
     WHERE stripe_subscription_id = p_stripe_subscription_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'letter subscriber row missing';
    END IF;
  END IF;

  UPDATE public.ebook_subscription_states
     SET subscription_status = p_subscription_status,
         readback_at = p_readback_at,
         event_id = p_event_id,
         updated_at = now()
   WHERE stripe_subscription_id = p_stripe_subscription_id;

  RETURN jsonb_build_object('outcome', 'applied', 'status', p_subscription_status, 'readback_at', p_readback_at);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_ebook_subscription_state(text, text, timestamptz, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_ebook_subscription_state(text, text, timestamptz, text, text, text, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.apply_ebook_subscription_state(
  p_stripe_subscription_id text,
  p_subscription_status text,
  p_readback_at timestamptz,
  p_event_id text,
  p_email text DEFAULT NULL,
  p_lang text DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_readback_at timestamptz;
  v_subscription_status text;
  v_tier text;
BEGIN
  IF p_stripe_subscription_id IS NULL OR p_readback_at IS NULL OR p_event_id IS NULL THEN
    RAISE EXCEPTION 'missing subscription state identity';
  END IF;

  INSERT INTO public.ebook_subscription_states (
    stripe_subscription_id, subscription_status, readback_at, event_id
  ) VALUES (
    p_stripe_subscription_id, 'unknown', '1970-01-01T00:00:00Z'::timestamptz, ''
  ) ON CONFLICT (stripe_subscription_id) DO NOTHING;

  SELECT readback_at, subscription_status
    INTO v_readback_at, v_subscription_status
    FROM public.ebook_subscription_states
   WHERE stripe_subscription_id = p_stripe_subscription_id
   FOR UPDATE;

  IF p_readback_at < v_readback_at THEN
    RETURN jsonb_build_object('outcome', 'stale', 'status', v_subscription_status, 'readback_at', v_readback_at);
  END IF;
  IF p_readback_at = v_readback_at THEN
    IF p_subscription_status = v_subscription_status THEN
      RETURN jsonb_build_object('outcome', 'duplicate', 'status', v_subscription_status, 'readback_at', v_readback_at);
    END IF;
    RETURN jsonb_build_object('outcome', 'conflict', 'status', v_subscription_status, 'readback_at', v_readback_at);
  END IF;

  v_tier := CASE WHEN p_subscription_status IN ('active', 'trialing') THEN 'paid' ELSE 'expired' END;
  IF p_email IS NOT NULL THEN
    INSERT INTO public.subscribers AS existing_subscriber (
      email, lang, tier, stripe_customer_id, stripe_subscription_id, signed_up_at, unsubscribed_at
    ) VALUES (
      p_email, p_lang, v_tier, p_stripe_customer_id, p_stripe_subscription_id, now(),
      CASE WHEN p_subscription_status = 'canceled' THEN now() ELSE NULL END
    ) ON CONFLICT DO UPDATE SET
      lang = EXCLUDED.lang,
      tier = EXCLUDED.tier,
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      unsubscribed_at = CASE
        WHEN p_subscription_status = 'canceled' THEN COALESCE(existing_subscriber.unsubscribed_at, now())
        WHEN p_subscription_status IN ('active', 'trialing') THEN NULL
        ELSE existing_subscriber.unsubscribed_at
      END;
  ELSE
    UPDATE public.subscribers
       SET tier = v_tier,
           unsubscribed_at = CASE
             WHEN p_subscription_status = 'canceled' THEN COALESCE(unsubscribed_at, now())
             WHEN p_subscription_status IN ('active', 'trialing') THEN NULL
             ELSE unsubscribed_at
           END
     WHERE stripe_subscription_id = p_stripe_subscription_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'letter subscriber row missing';
    END IF;
  END IF;

  UPDATE public.ebook_subscription_states
     SET subscription_status = p_subscription_status,
         readback_at = p_readback_at,
         event_id = p_event_id,
         updated_at = now()
   WHERE stripe_subscription_id = p_stripe_subscription_id;

  RETURN jsonb_build_object('outcome', 'applied', 'status', p_subscription_status, 'readback_at', p_readback_at);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_ebook_subscription_state(text, text, timestamptz, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_ebook_subscription_state(text, text, timestamptz, text, text, text, text)
  TO service_role;
