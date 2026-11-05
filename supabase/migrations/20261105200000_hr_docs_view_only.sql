-- MUKTalent · v23 · Documentos del empleado: solo lectura, confirmación de lectura, caducidad,
-- envío a varios empleados y registro de accesos (Admin → Equipo → Documentos).
-- Run once in Supabase → SQL Editor. Safe to run more than once.

alter table public.mt_staff_documents add column if not exists view_only boolean not null default false;
alter table public.mt_staff_documents add column if not exists requires_ack boolean not null default false;
alter table public.mt_staff_documents add column if not exists acknowledged_at timestamptz;
alter table public.mt_staff_documents add column if not exists expires_at timestamptz;
alter table public.mt_staff_documents add column if not exists batch_id uuid;
alter table public.mt_staff_documents add column if not exists view_count integer not null default 0;
alter table public.mt_staff_documents add column if not exists last_viewed_at timestamptz;

comment on column public.mt_staff_documents.view_only is 'v23 · Read-only: the employee can read it in the platform but gets no download, print or open-in-tab.';
comment on column public.mt_staff_documents.requires_ack is 'v23 · The employee must confirm "I have read and understood".';
comment on column public.mt_staff_documents.expires_at is 'v23 · After this moment the employee no longer sees the document.';
comment on column public.mt_staff_documents.batch_id is 'v23 · Same id for copies sent to several employees at once.';

create index if not exists mt_staff_documents_batch on public.mt_staff_documents (batch_id) where batch_id is not null;

-- Registro de accesos: una fila cada vez que el empleado abre el documento.
create table if not exists public.mt_staff_document_views (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.mt_staff_documents(id) on delete cascade,
  viewer_id uuid not null references public.crm_staff(user_id),
  viewed_at timestamptz not null default now(),
  device text not null default '' check (length(device) <= 300)
);
create index if not exists mt_staff_document_views_doc on public.mt_staff_document_views (document_id, viewed_at desc);

-- Solo el servidor (service role) lee y escribe; sin políticas = sin acceso desde el navegador.
alter table public.mt_staff_document_views enable row level security;
revoke all on public.mt_staff_document_views from anon, authenticated;
