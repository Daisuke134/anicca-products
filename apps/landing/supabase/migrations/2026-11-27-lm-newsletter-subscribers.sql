-- Life Manager daily gig newsletter — subscribers.
-- Applied to the same Supabase project the landing pages already use
-- (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are read by the Netlify function
-- netlify/functions/lm-newsletter-signup.js).
--
-- The function also writes every signup to Netlify Blobs, so a missing table never
-- loses a subscriber; with the table in place the rows are queryable in SQL and a
-- later send pipeline can read segments (lang / interests / device) directly.
--
-- Holds only what the onboarding form asks for: email, language, interests, device.

create table if not exists public.lm_newsletter_subscribers (
  email        text primary key,
  lang         text not null check (lang in ('ja', 'en', 'es')),
  interests    jsonb not null default '[]'::jsonb,
  device       text not null check (device in ('phone', 'both')),
  source       text,
  receipt      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists lm_newsletter_subscribers_lang_idx
  on public.lm_newsletter_subscribers (lang);

-- Keep updated_at current on the merge-duplicates upsert the function sends.
create or replace function public.lm_newsletter_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lm_newsletter_subscribers_touch on public.lm_newsletter_subscribers;
create trigger lm_newsletter_subscribers_touch
  before update on public.lm_newsletter_subscribers
  for each row execute function public.lm_newsletter_touch_updated_at();

-- Server-side only: the service role key writes; no anonymous read or write.
alter table public.lm_newsletter_subscribers enable row level security;
revoke all on public.lm_newsletter_subscribers from anon, authenticated;
