-- marketing_click_receipts — minimal click receipts written by /go/<token> (netlify/functions/_lib/marketing-go.js)
-- and /api/marketing-entry (netlify/functions/_lib/marketing-entry.js). No IP / UA / referrer is stored.
-- The CHECK constraints must admit every token/product those handlers write: the original constraints
-- only allowed ai|ho|ej|ee, so hl_ (Hook Lab), af_ (ElevenLabs affiliate) and entry_x inserts failed (HTTP 400)
-- and /go/af_* returned 503. Placement pattern mirrors netlify/functions/_lib/affiliate-placement.js.
create table if not exists public.marketing_click_receipts (
  receipt_id uuid primary key,
  schema_version smallint not null check (schema_version = 1),
  campaign_token text not null,
  product_id text not null,
  clicked_at timestamptz not null
);
alter table public.marketing_click_receipts enable row level security;

alter table public.marketing_click_receipts
  drop constraint if exists marketing_click_receipts_campaign_token_check,
  drop constraint if exists marketing_click_receipts_product_id_check;
alter table public.marketing_click_receipts
  add constraint marketing_click_receipts_campaign_token_check check (
    campaign_token ~ '^(ai|ho|ej|ee|hl)_[a-z2-7]{20}$'
    or (campaign_token ~ '^af_elevenlabs-discovered-[a-z0-9][a-z0-9-]*-en(-experiment-[a-f0-9]{12})?-1$'
        and length(campaign_token) <= 83)
    or campaign_token = 'entry_x'
  ),
  add constraint marketing_click_receipts_product_id_check check (
    product_id in ('aniccaios', 'honne', 'ebook-ja', 'ebook-en', 'hook-lab')
    or (product_id ~ '^(entry:)?elevenlabs-discovered-[a-z0-9][a-z0-9-]*-en(-experiment-[a-f0-9]{12})?-1$'
        and length(product_id) <= 86)
  );
