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
