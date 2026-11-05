-- MUK Talent · v20 · Online status of the team (Admin → Equipo)
-- Run once in Supabase → SQL Editor. Safe to run more than once.
-- Only the server (service role key) reads and writes this table: RLS is on and there are no policies,
-- so the anon and authenticated roles cannot see who is online.

create table if not exists public.mt_staff_presence (
  user_id      uuid primary key references public.crm_staff(user_id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  state        text not null default 'active' check (state in ('active', 'away')),
  updated_at   timestamptz not null default now()
);

comment on table public.mt_staff_presence is 'v20 · Last heartbeat of each staff member (online / away / offline is computed by the API).';

create index if not exists mt_staff_presence_seen_idx on public.mt_staff_presence (last_seen_at desc);

alter table public.mt_staff_presence enable row level security;

revoke all on public.mt_staff_presence from anon, authenticated;
grant select, insert, update, delete on public.mt_staff_presence to service_role;
