-- MUK Talent · Short business-card links (muktalent.com/laura) and employee social profiles.
-- Run once in Supabase → SQL Editor. Safe to re-run. Service role only: no anon/authenticated access.
begin;

-- 1. Short links. A person keeps every handle they have used, so printed QR codes never break
--    and nobody else can later claim an old link to impersonate them.
create table if not exists public.mt_card_handles (
  handle      text primary key
              check (length(handle) between 3 and 30 and handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  is_primary  boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists mt_card_handles_one_primary on public.mt_card_handles(owner_id) where is_primary;
create index if not exists mt_card_handles_owner on public.mt_card_handles(owner_id);
alter table public.mt_card_handles enable row level security;
revoke all on public.mt_card_handles from anon, authenticated;

-- Atomic claim: prevents two people taking the same handle at the same time.
create or replace function public.mt_claim_card_handle(p_owner uuid, p_handle text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  holder uuid;
  total  integer;
begin
  if p_handle !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_handle) not between 3 and 30 then
    raise exception 'handle_invalid';
  end if;
  perform pg_advisory_xact_lock(hashtext('mt_card_handle:' || p_handle));
  select owner_id into holder from public.mt_card_handles where handle = p_handle;
  if holder is not null and holder <> p_owner then raise exception 'handle_taken'; end if;
  if holder is null then
    select count(*) into total from public.mt_card_handles where owner_id = p_owner;
    if total >= 5 then raise exception 'handle_limit'; end if;
  end if;
  update public.mt_card_handles set is_primary = false where owner_id = p_owner and is_primary and handle <> p_handle;
  insert into public.mt_card_handles(handle, owner_id, is_primary) values (p_handle, p_owner, true)
  on conflict (handle) do update set is_primary = true where public.mt_card_handles.owner_id = p_owner;
  return p_handle;
end $$;
revoke all on function public.mt_claim_card_handle(uuid, text) from public, anon, authenticated;
grant execute on function public.mt_claim_card_handle(uuid, text) to service_role;

-- 2. Social profiles shown on the public card (already normalised and validated by the server).
create table if not exists public.mt_employee_socials (
  owner_id      uuid primary key references auth.users(id) on delete cascade,
  links         jsonb not null default '{}'::jsonb
                check (jsonb_typeof(links) = 'object' and pg_column_size(links) < 8192),
  show_on_card  boolean not null default true,
  updated_at    timestamptz not null default now()
);
alter table public.mt_employee_socials enable row level security;
revoke all on public.mt_employee_socials from anon, authenticated;

commit;

-- Optional check after running:
-- select handle, owner_id, is_primary from public.mt_card_handles order by created_at desc;
