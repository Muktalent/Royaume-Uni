-- MUK Talent · Equipo, documentos del empleado e informes (2026-11-02)
-- Ejecutar UNA vez en Supabase > SQL Editor, antes de desplegar el código nuevo.
-- Es idempotente: se puede volver a ejecutar sin romper nada.
-- No borra datos ni modifica funciones existentes.

begin;

-- 1. Datos nuevos del empleado (ficha completa) ----------------------------
alter table public.mt_employee_directory
  add column if not exists country_code   text,
  add column if not exists date_of_birth  date,
  add column if not exists base_salary    numeric,
  add column if not exists salary_currency text not null default 'MAD',
  add column if not exists web_visible    boolean not null default true,
  add column if not exists removed_at     timestamptz,
  add column if not exists removed_by     uuid references public.crm_staff(user_id);

do $$ begin
  alter table public.mt_employee_directory add constraint mt_employee_directory_country_code_v16
    check (country_code is null or country_code ~ '^[A-Z]{2}$');
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.mt_employee_directory add constraint mt_employee_directory_dob_v16
    check (date_of_birth is null or date_of_birth >= date '1900-01-01');
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.mt_employee_directory add constraint mt_employee_directory_salary_v16
    check (base_salary is null or (base_salary >= 0 and base_salary <= 10000000));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.mt_employee_directory add constraint mt_employee_directory_salary_currency_v16
    check (salary_currency ~ '^[A-Z]{3}$');
exception when duplicate_object then null; end $$;

-- Mantener la moneda actual de comisión como moneda de salario para no cambiar nóminas existentes.
update public.mt_employee_directory
   set salary_currency = commission_currency
 where salary_currency = 'MAD' and commission_currency is not null and commission_currency <> 'MAD';

-- Actualización de los campos nuevos (solo administradores, mismo patrón que mt_admin_directory_update).
create or replace function public.mt_admin_directory_extra(p_user uuid, p_values jsonb)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not private.crm_is_admin() then raise exception 'Administrator access required'; end if;
  if not exists (select 1 from public.crm_staff where user_id = p_user) then raise exception 'Employee not found'; end if;
  update public.mt_employee_directory set
    country_code    = nullif(p_values->>'country_code', ''),
    date_of_birth   = nullif(p_values->>'date_of_birth', '')::date,
    base_salary     = nullif(p_values->>'base_salary', '')::numeric,
    salary_currency = coalesce(nullif(p_values->>'salary_currency', ''), salary_currency),
    web_visible     = coalesce((p_values->>'web_visible')::boolean, web_visible)
  where user_id = p_user;
end $function$;
revoke all on function public.mt_admin_directory_extra(uuid, jsonb) from public, anon;
grant execute on function public.mt_admin_directory_extra(uuid, jsonb) to authenticated;

-- 2. Documentos del empleado (contratos, nóminas, documentos enviados) ------
create table if not exists public.mt_staff_documents (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.crm_staff(user_id),
  direction          text not null check (direction in ('to_employee', 'from_employee')),
  kind               text not null default 'other' check (kind in ('contract', 'payslip', 'policy', 'certificate', 'id_document', 'other')),
  title              text not null check (length(trim(title)) between 1 and 200),
  note               text not null default '' check (length(note) <= 2000),
  original_name      text not null check (length(original_name) between 1 and 200),
  mime               text not null check (mime in ('application/pdf', 'image/jpeg', 'image/png')),
  bytes              integer not null check (bytes > 0 and bytes <= 10485760),
  object_path        text not null unique,
  sha256             text,
  requires_signature boolean not null default false,
  status             text not null default 'uploading' check (status in ('uploading', 'sent', 'viewed', 'signed', 'submitted', 'approved', 'rejected')),
  viewed_at          timestamptz,
  signed_path        text unique,
  signed_sha256      text,
  signed_at          timestamptz,
  signer_name        text check (signer_name is null or length(signer_name) between 2 and 200),
  signature_method   text check (signature_method is null or signature_method in ('drawn', 'typed')),
  signer_ip          text,
  signer_user_agent  text,
  reviewed_at        timestamptz,
  reviewed_by        uuid references public.crm_staff(user_id),
  review_note        text not null default '' check (length(review_note) <= 1000),
  admin_seen_at      timestamptz,
  created_by         uuid not null references public.crm_staff(user_id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint mt_staff_documents_signature_pdf check (not requires_signature or mime = 'application/pdf')
);
create index if not exists mt_staff_documents_owner_idx on public.mt_staff_documents (owner_id, created_at desc);
create index if not exists mt_staff_documents_status_idx on public.mt_staff_documents (status);

-- Solo el servidor (clave de servicio) accede: RLS activo y sin políticas, igual que gp_* y mk_*.
alter table public.mt_staff_documents enable row level security;
revoke all on public.mt_staff_documents from anon, authenticated;

-- 3. Control de enlaces de informes (cuántas veces se ha abierto) ------------
alter table public.mt_pipeline_shares
  add column if not exists view_count     integer not null default 0,
  add column if not exists last_viewed_at timestamptz;

commit;
