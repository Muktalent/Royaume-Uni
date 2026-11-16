-- MUKTalent · v24 · Global Passport: documentos para firmar.
-- El admin o el counsellor envía un PDF; el estudiante lo firma a mano en la plataforma; el PDF firmado vuelve al equipo.
-- Archivos en el bucket privado «passport-docs» (ya existe). Run once in Supabase → SQL Editor. Safe to run more than once.

create table if not exists public.gp_sign_requests (
  id uuid primary key,
  student_id uuid not null references public.gp_students(user_id) on delete cascade,
  title text not null check (length(title) between 2 and 200),
  note text not null default '' check (length(note) <= 1000),
  original_name text not null check (length(original_name) between 1 and 200),
  bytes integer not null check (bytes between 1 and 10485760),
  object_path text not null,
  sha256 text,
  status text not null default 'uploading' check (status in ('uploading','sent','viewed','signed','cancelled')),
  sent_by uuid references public.crm_staff(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  viewed_at timestamptz,
  signed_at timestamptz,
  signer_name text check (signer_name is null or length(signer_name) <= 200),
  signer_ip text,
  signer_user_agent text,
  signed_path text,
  signed_sha256 text,
  staff_seen_at timestamptz
);
create index if not exists gp_sign_requests_student on public.gp_sign_requests (student_id, created_at desc);
create index if not exists gp_sign_requests_open on public.gp_sign_requests (status) where status in ('sent','viewed');

-- Solo el servidor (service role) accede; sin políticas = sin acceso directo desde el navegador.
alter table public.gp_sign_requests enable row level security;
revoke all on public.gp_sign_requests from anon, authenticated;
