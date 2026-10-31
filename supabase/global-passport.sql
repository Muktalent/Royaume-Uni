-- MUK Talent · GLOBAL PASSPORT (student portal + Counsellor Control Centre)
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- Security model: every table is private (RLS on, no anon/authenticated grants).
-- Only the server (service role) reads and writes, after checking who the user is.
begin;

create sequence if not exists public.gp_reference_seq start 1001;

-- 1. Student file (one per student account).
create table if not exists public.gp_students (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  reference          text not null unique default ('GP-' || lpad(nextval('public.gp_reference_seq')::text, 6, '0')),
  email              text not null check (length(email) between 3 and 320),
  full_name          text not null check (length(full_name) between 2 and 120),
  phone              text check (phone is null or length(phone) <= 32),
  country_residence  char(2) not null check (country_residence ~ '^[A-Z]{2}$'),
  nationality        char(2) not null check (nationality ~ '^[A-Z]{2}$'),
  date_of_birth      date,
  destination        text not null default 'UK' check (destination in ('UK','CA','US')),
  study_level        text check (study_level is null or length(study_level) <= 60),
  subject            text check (subject is null or length(subject) <= 120),
  intake             text check (intake is null or length(intake) <= 40),
  english_test       text check (english_test is null or length(english_test) <= 80),
  university         text check (university is null or length(university) <= 160),
  programme          text check (programme is null or length(programme) <= 160),
  counsellor_id      uuid references auth.users(id) on delete set null,
  application_status text not null default 'profile'
                     check (application_status in ('profile','preparing','submitted','awaiting','offer','visa','travel','enrolled','on_hold','withdrawn')),
  urgent             boolean not null default false,
  student_seen_at    timestamptz,
  counsellor_seen_at timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists gp_students_counsellor on public.gp_students(counsellor_id);

-- 2. Journey map: 8 stages per student.
create table if not exists public.gp_stages (
  student_id uuid not null references public.gp_students(user_id) on delete cascade,
  stage_key  text not null check (stage_key in ('registration','university','documents','application','offer','visa','travel','arrival')),
  position   smallint not null check (position between 1 and 8),
  status     text not null default 'pending' check (status in ('done','in_progress','pending')),
  updated_at timestamptz not null default now(),
  primary key (student_id, stage_key)
);

-- 3. Tasks assigned by the counsellor (or seeded on registration).
create table if not exists public.gp_tasks (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.gp_students(user_id) on delete cascade,
  stage_key  text not null check (stage_key in ('registration','university','documents','application','offer','visa','travel','arrival')),
  title      text not null check (length(title) between 2 and 160),
  detail     text check (detail is null or length(detail) <= 2000),
  due_date   date,
  status     text not null default 'open' check (status in ('open','done')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  done_at    timestamptz
);
create index if not exists gp_tasks_student on public.gp_tasks(student_id, status);

-- 4. Documents: checklist + private files in the passport-docs bucket.
create table if not exists public.gp_documents (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.gp_students(user_id) on delete cascade,
  stage_key    text not null default 'documents' check (stage_key in ('registration','university','documents','application','offer','visa','travel','arrival')),
  doc_type     text not null check (length(doc_type) between 2 and 40),
  label        text not null check (length(label) between 2 and 160),
  required     boolean not null default true,
  status       text not null default 'requested' check (status in ('requested','uploaded','approved','rejected')),
  object_path  text check (object_path is null or length(object_path) <= 400),
  file_name    text check (file_name is null or length(file_name) <= 160),
  mime         text,
  size_bytes   integer check (size_bytes is null or size_bytes between 1 and 10485760),
  review_note  text check (review_note is null or length(review_note) <= 1000),
  requested_by uuid references auth.users(id) on delete set null,
  reviewed_by  uuid references auth.users(id) on delete set null,
  uploaded_at  timestamptz,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists gp_documents_student on public.gp_documents(student_id, status);

-- 5. Conversation between student and counsellor (messages, progress updates, system notes).
create table if not exists public.gp_messages (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.gp_students(user_id) on delete cascade,
  sender_id   uuid references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('student','counsellor','system')),
  kind        text not null default 'message' check (kind in ('message','update','system')),
  body        text not null check (length(body) between 1 and 2000),
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists gp_messages_student on public.gp_messages(student_id, created_at desc);

-- 6. Private counsellor notes (never shown to the student).
create table if not exists public.gp_notes (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.gp_students(user_id) on delete cascade,
  author_id  uuid references auth.users(id) on delete set null,
  body       text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists gp_notes_student on public.gp_notes(student_id, created_at desc);

-- 7. Important dates (deadlines, meetings, intake, visa appointment...).
create table if not exists public.gp_events (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.gp_students(user_id) on delete cascade,
  title      text not null check (length(title) between 2 and 160),
  starts_on  date not null,
  kind       text not null default 'deadline' check (kind in ('deadline','meeting','intake','visa','travel','other')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists gp_events_student on public.gp_events(student_id, starts_on);

-- 8. Counsellor availability for automatic assignment.
create table if not exists public.gp_counsellor_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  accepting  boolean not null default true,
  capacity   integer not null default 60 check (capacity between 0 and 1000),
  updated_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['gp_students','gp_stages','gp_tasks','gp_documents','gp_messages','gp_notes','gp_events','gp_counsellor_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
revoke all on sequence public.gp_reference_seq from anon, authenticated;
grant usage, select on sequence public.gp_reference_seq to service_role;

-- Automatic assignment: the active team member with the lowest caseload who accepts students.
-- Serialised with an advisory lock so two sign-ups never overload the same counsellor.
create or replace function public.gp_assign_counsellor(p_student uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare chosen uuid; current_one uuid;
begin
  perform pg_advisory_xact_lock(hashtext('gp_assign_counsellor'));
  select counsellor_id into current_one from public.gp_students where user_id = p_student for update;
  if not found then raise exception 'student_not_found'; end if;
  if current_one is not null then return current_one; end if;
  select s.user_id into chosen
  from public.crm_staff s
  left join public.gp_counsellor_settings c on c.user_id = s.user_id
  left join lateral (
    select count(*)::int as load from public.gp_students g
    where g.counsellor_id = s.user_id and g.application_status not in ('enrolled','withdrawn')
  ) l on true
  where s.active and coalesce(c.accepting, true) and l.load < coalesce(c.capacity, 60)
  order by (s.role = 'collaborator') desc, l.load asc, random()
  limit 1;
  if chosen is not null then
    update public.gp_students set counsellor_id = chosen, updated_at = now() where user_id = p_student;
  end if;
  return chosen;
end $$;
revoke all on function public.gp_assign_counsellor(uuid) from public, anon, authenticated;
grant execute on function public.gp_assign_counsellor(uuid) to service_role;

-- Private bucket for student documents (10 MB, PDF and images). Access only through signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('passport-docs', 'passport-docs', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

commit;

-- Safety check (read-only). Student accounts are normal "authenticated" users.
-- Lists any policy that grants access to every signed-in user without checking staff membership.
-- If this returns rows on crm_* / mt_* tables, send me the result before enabling public sign-up.
select schemaname, tablename, policyname, cmd, qual
from pg_policies
where schemaname in ('public','storage')
  and 'authenticated' = any(roles)
  and coalesce(qual,'') !~* '(crm_staff|is_staff|staff|auth\.uid\(\)\s*=|=\s*\(?\s*select\s+auth\.uid|owner|user_id)'
order by 1, 2;
