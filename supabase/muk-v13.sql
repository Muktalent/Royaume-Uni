-- MUK Talent v13 · family / assistant enquiries + counsellor region for the "Our Team" carousel.
-- Run once in Supabase → SQL Editor. Safe to run again.

-- 1) Optional region override on the public card (otherwise detected from the assigned city).
alter table public.mt_public_cards add column if not exists region text;
alter table public.mt_public_cards drop constraint if exists mt_public_cards_region_check;
alter table public.mt_public_cards add constraint mt_public_cards_region_check
  check (region is null or region in ('maghreb','asia','latam'));

-- 2) Enquiries from "For Parents" (Speak to Our Team) and the website assistant.
create table if not exists public.mk_inquiries (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,
  source          text not null default 'parents' check (source in ('parents','assistant','home')),
  relation        text not null default 'parent' check (relation in ('parent','student','other')),
  name            text not null check (length(name) between 2 and 120),
  email           text not null check (length(email) <= 160),
  phone           text not null check (length(phone) <= 40),
  country         text not null check (length(country) <= 80),
  region          text check (region is null or region in ('maghreb','asia','latam')),
  priorities      text[] not null default '{}',
  message         text check (message is null or length(message) <= 1500),
  transcript      jsonb,
  lang            text not null default 'fr',
  page            text,
  conversation_id uuid references public.mk_conversations(id) on delete set null,
  assigned_to     uuid[] not null default '{}',
  status          text not null default 'new' check (status in ('new','in_progress','closed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists mk_inquiries_created_idx on public.mk_inquiries (created_at desc);
create index if not exists mk_inquiries_status_idx on public.mk_inquiries (status, created_at desc);

-- Server-only table: RLS on, no policies, no direct access from the browser.
alter table public.mk_inquiries enable row level security;
revoke all on public.mk_inquiries from anon, authenticated;

-- 3) Group conversations created by the website have no human sender.
alter table public.mk_messages alter column sender_id drop not null;

-- Example: force a counsellor into a region (optional)
-- update public.mt_public_cards set region = 'asia' where display_name = 'Name Surname';
