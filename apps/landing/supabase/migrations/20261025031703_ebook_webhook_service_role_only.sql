-- Remove Supabase's default table grants and keep webhook storage service-role-only.
BEGIN;

REVOKE ALL PRIVILEGES ON TABLE public.ebook_webhook_receipts, public.ebook_subscription_states
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.ebook_webhook_receipts, public.ebook_subscription_states
  TO service_role;

COMMIT;
