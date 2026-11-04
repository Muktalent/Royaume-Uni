-- MUKTalent Healthcare division · v19
-- Independent data model for international healthcare & social care recruitment.
-- Every hc_* table has RLS enabled and NO policies: only the API server (service role)
-- reads or writes, after checking the caller's role (admin / healthcare consultant / candidate).
-- Nothing here touches the Education (crm_*, gp_*) data.

begin;

-- ---------- reference sequences ----------
create sequence if not exists public.hc_candidate_seq;
create sequence if not exists public.hc_enquiry_seq;
create sequence if not exists public.hc_complaint_seq;
create sequence if not exists public.hc_application_seq;

create or replace function public.hc_next_ref(p_kind text)
returns text language plpgsql security definer set search_path = public as $$
declare n bigint; prefix text;
begin
  case p_kind
    when 'candidate' then n := nextval('public.hc_candidate_seq'); prefix := 'MKH-C';
    when 'enquiry' then n := nextval('public.hc_enquiry_seq'); prefix := 'MKH-E';
    when 'complaint' then n := nextval('public.hc_complaint_seq'); prefix := 'MKH-K';
    when 'application' then n := nextval('public.hc_application_seq'); prefix := 'MKH-A';
    else raise exception 'unknown reference kind %', p_kind;
  end case;
  return prefix || to_char(now() at time zone 'Europe/London', 'YY') || '-' || lpad(n::text, 5, '0');
end $$;
revoke all on function public.hc_next_ref(text) from public, anon, authenticated;

create or replace function public.hc_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ---------- settings (singleton) ----------
create table if not exists public.hc_settings (
  id boolean primary key default true check (id),
  notify_email text not null default 'agents@muktalent.com',
  candidate_enquiries_email text not null default 'agents@muktalent.com',
  employer_enquiries_email text not null default 'agents@muktalent.com',
  complaints_email text not null default 'agents@muktalent.com',
  compliance_lead_name text,
  compliance_lead_title text default 'Ethical Recruitment & Compliance Lead',
  data_protection_lead_name text,
  complaint_ack_days int not null default 2 check (complaint_ack_days between 1 and 10),
  complaint_response_days int not null default 20 check (complaint_response_days between 5 and 60),
  retention_unsuccessful_months int not null default 12 check (retention_unsuccessful_months between 1 and 84),
  retention_placed_years int not null default 6 check (retention_placed_years between 1 and 10),
  privacy_notice_version text not null default 'HC-CPN-2026-11',
  country_list_reviewed_at date,
  country_list_source text default 'https://www.nhsemployers.org/articles/code-practice-red-and-amber-list-countries',
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.hc_settings (id) values (true) on conflict do nothing;

-- ---------- consultants (staff enabled for Healthcare) ----------
create table if not exists public.hc_consultants (
  user_id uuid primary key references public.crm_staff(user_id) on delete cascade,
  title text not null default 'Healthcare Recruitment Consultant' check (char_length(title) <= 120),
  professions text[] not null default '{}',
  languages text[] not null default '{}',
  capacity int not null default 40 check (capacity between 1 and 500),
  bio text check (char_length(bio) <= 1200),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger hc_consultants_touch before update on public.hc_consultants for each row execute function public.hc_touch();

-- ---------- country restrictions (Code of Practice red / amber / green) ----------
create table if not exists public.hc_country_rules (
  country_code char(2) primary key check (country_code ~ '^[A-Z]{2}$'),
  country_name text not null,
  status text not null check (status in ('red','amber','green')),
  agreement_note text,
  source_url text,
  reviewed_at date not null default current_date,
  reviewed_by uuid
);

-- ---------- candidates ----------
create table if not exists public.hc_candidates (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.hc_next_ref('candidate'),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 140),
  email text not null check (char_length(email) <= 320),
  phone text check (char_length(phone) <= 40),
  country_residence char(2) not null check (country_residence ~ '^[A-Z]{2}$'),
  nationality char(2) check (nationality ~ '^[A-Z]{2}$'),
  profession text not null check (char_length(profession) <= 80),
  experience_years numeric(4,1) check (experience_years between 0 and 60),
  registration_status text not null default 'not_started'
    check (registration_status in ('registered_uk','in_progress_uk','registered_home','not_started','not_applicable')),
  registration_body text check (char_length(registration_body) <= 120),
  registration_number text check (char_length(registration_number) <= 60),
  english_level text check (english_level in ('ielts_oet_passed','test_booked','preparing','native_or_exempt','not_sure')),
  employment_status text check (employment_status in ('employed','self_employed','unemployed','studying','other')),
  preferred_location text check (char_length(preferred_location) <= 120),
  right_to_work_uk boolean not null default false,
  additional_info text check (char_length(additional_info) <= 3000),
  marketing_consent boolean not null default false,
  preferred_language text not null default 'en' check (preferred_language in ('en','es','ar','fr')),
  privacy_notice_version text not null,
  privacy_ack_at timestamptz not null default now(),
  source text not null default 'website' check (source in ('website','portal','admin','referral','event')),
  stage text not null default 'new_registration' check (stage in (
    'new_registration','initial_review','awaiting_information','documentation_review','professional_verification',
    'suitable_for_matching','submitted_to_employer','interview_scheduled','interview_completed','offer_received',
    'offer_accepted','pre_employment_checks','recruitment_completed','unsuccessful','withdrawn')),
  stage_changed_at timestamptz not null default now(),
  consultant_id uuid references public.hc_consultants(user_id) on delete set null,
  country_status text not null default 'unchecked' check (country_status in ('unchecked','green','amber','red')),
  country_checked_at timestamptz,
  country_checked_by uuid,
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  next_action text check (char_length(next_action) <= 240),
  next_action_at timestamptz,
  deletion_requested_at timestamptz,
  erased_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hc_candidates_stage_idx on public.hc_candidates(stage) where archived_at is null;
create index if not exists hc_candidates_consultant_idx on public.hc_candidates(consultant_id) where archived_at is null;
create index if not exists hc_candidates_email_idx on public.hc_candidates(lower(email));
create trigger hc_candidates_touch before update on public.hc_candidates for each row execute function public.hc_touch();

create table if not exists public.hc_stage_history (
  id bigint generated always as identity primary key,
  candidate_id uuid not null references public.hc_candidates(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  changed_by uuid,
  changed_by_role text check (changed_by_role in ('admin','consultant','candidate','system')),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists hc_stage_history_candidate_idx on public.hc_stage_history(candidate_id, created_at desc);

-- ---------- employers ----------
create table if not exists public.hc_employers (
  id uuid primary key default gen_random_uuid(),
  organisation_name text not null check (char_length(organisation_name) between 2 and 160),
  organisation_type text not null check (organisation_type in ('nhs_trust','independent_hospital','care_home','home_care','gp_practice','clinic','local_authority','other')),
  contact_name text check (char_length(contact_name) <= 140),
  job_title text check (char_length(job_title) <= 120),
  email text check (char_length(email) <= 320),
  phone text check (char_length(phone) <= 40),
  location text check (char_length(location) <= 160),
  cqc_provider_id text check (char_length(cqc_provider_id) <= 40),
  sponsor_licence boolean,
  status text not null default 'prospect' check (status in ('prospect','due_diligence','active','paused','closed')),
  due_diligence_status text not null default 'not_started' check (due_diligence_status in ('not_started','in_progress','completed','failed')),
  due_diligence_notes text check (char_length(due_diligence_notes) <= 4000),
  due_diligence_completed_at timestamptz,
  terms_signed_at date,
  owner_id uuid references public.hc_consultants(user_id) on delete set null,
  notes text check (char_length(notes) <= 4000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger hc_employers_touch before update on public.hc_employers for each row execute function public.hc_touch();

-- ---------- vacancies ----------
create table if not exists public.hc_vacancies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,90}$'),
  title text not null check (char_length(title) between 3 and 160),
  employer_id uuid references public.hc_employers(id) on delete set null,
  employer_display text not null check (char_length(employer_display) between 2 and 160),
  profession text not null check (char_length(profession) <= 80),
  location text not null check (char_length(location) <= 160),
  salary_min int check (salary_min >= 0),
  salary_max int check (salary_max >= 0),
  salary_text text check (char_length(salary_text) <= 160),
  contract_type text not null check (contract_type in ('permanent','fixed_term','bank','part_time','other')),
  working_hours text not null check (char_length(working_hours) <= 160),
  qualifications text not null check (char_length(qualifications) <= 4000),
  registration_requirements text not null check (char_length(registration_requirements) <= 2000),
  description text not null check (char_length(description) <= 8000),
  conditions text not null check (char_length(conditions) <= 4000),
  visa_sponsorship text not null default 'not_stated' check (visa_sponsorship in ('available','not_available','not_stated')),
  status text not null default 'draft' check (status in ('draft','published','closed')),
  authorised_by uuid,
  authorised_at timestamptz,
  published_at timestamptz,
  closes_on date,
  consultant_id uuid references public.hc_consultants(user_id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (salary_max is null or salary_min is null or salary_max >= salary_min)
);
create index if not exists hc_vacancies_status_idx on public.hc_vacancies(status, published_at desc);
create trigger hc_vacancies_touch before update on public.hc_vacancies for each row execute function public.hc_touch();

-- ---------- applications ----------
create table if not exists public.hc_applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.hc_next_ref('application'),
  candidate_id uuid not null references public.hc_candidates(id) on delete cascade,
  vacancy_id uuid not null references public.hc_vacancies(id) on delete cascade,
  status text not null default 'applied' check (status in ('applied','under_review','shortlisted','submitted_to_employer','interview','offer','accepted','unsuccessful','withdrawn')),
  cover_note text check (char_length(cover_note) <= 3000),
  internal_note text check (char_length(internal_note) <= 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, vacancy_id)
);
create trigger hc_applications_touch before update on public.hc_applications for each row execute function public.hc_touch();

-- ---------- documents (private storage bucket healthcare-docs) ----------
create table if not exists public.hc_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.hc_candidates(id) on delete cascade,
  kind text not null check (kind in ('cv','passport','qualification','registration','english_test','reference','right_to_work','other')),
  label text not null check (char_length(label) <= 160),
  status text not null default 'requested' check (status in ('requested','uploaded','approved','rejected')),
  object_path text,
  file_name text check (char_length(file_name) <= 200),
  mime_type text,
  size_bytes int,
  note text check (char_length(note) <= 1000),
  requested_by uuid,
  reviewed_by uuid,
  uploaded_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists hc_documents_candidate_idx on public.hc_documents(candidate_id);

-- ---------- interviews ----------
create table if not exists public.hc_interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.hc_candidates(id) on delete cascade,
  application_id uuid references public.hc_applications(id) on delete set null,
  employer_id uuid references public.hc_employers(id) on delete set null,
  title text not null check (char_length(title) <= 160),
  scheduled_at timestamptz not null,
  duration_minutes int not null default 45 check (duration_minutes between 10 and 480),
  mode text not null default 'video' check (mode in ('video','in_person','phone')),
  location text check (char_length(location) <= 400),
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show')),
  outcome text check (char_length(outcome) <= 2000),
  candidate_note text check (char_length(candidate_note) <= 2000),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hc_interviews_candidate_idx on public.hc_interviews(candidate_id, scheduled_at);
create trigger hc_interviews_touch before update on public.hc_interviews for each row execute function public.hc_touch();

-- ---------- messages & notifications ----------
create table if not exists public.hc_messages (
  id bigint generated always as identity primary key,
  candidate_id uuid not null references public.hc_candidates(id) on delete cascade,
  sender_id uuid,
  sender_role text not null check (sender_role in ('candidate','consultant','admin','system')),
  body text not null check (char_length(body) between 1 and 4000),
  read_by_candidate_at timestamptz,
  read_by_team_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists hc_messages_candidate_idx on public.hc_messages(candidate_id, created_at);

create table if not exists public.hc_notifications (
  id bigint generated always as identity primary key,
  candidate_id uuid not null references public.hc_candidates(id) on delete cascade,
  title text not null check (char_length(title) <= 160),
  body text check (char_length(body) <= 1000),
  link text check (char_length(link) <= 80),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists hc_notifications_candidate_idx on public.hc_notifications(candidate_id, created_at desc);

-- ---------- tasks & internal notes ----------
create table if not exists public.hc_tasks (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.hc_candidates(id) on delete cascade,
  owner_id uuid not null,
  title text not null check (char_length(title) between 2 and 200),
  detail text check (char_length(detail) <= 2000),
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','done')),
  created_by uuid,
  created_at timestamptz not null default now(),
  done_at timestamptz
);
create index if not exists hc_tasks_owner_idx on public.hc_tasks(owner_id, status, due_at);

create table if not exists public.hc_notes (
  id bigint generated always as identity primary key,
  candidate_id uuid not null references public.hc_candidates(id) on delete cascade,
  author_id uuid not null,
  kind text not null default 'note' check (kind in ('note','call','follow_up','interview')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists hc_notes_candidate_idx on public.hc_notes(candidate_id, created_at desc);

-- ---------- enquiries (candidate / employer / general) ----------
create table if not exists public.hc_enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.hc_next_ref('enquiry'),
  route text not null check (route in ('candidate','employer','general')),
  name text not null check (char_length(name) between 2 and 140),
  email text not null check (char_length(email) <= 320),
  phone text check (char_length(phone) <= 40),
  organisation text check (char_length(organisation) <= 160),
  job_title text check (char_length(job_title) <= 120),
  subject text check (char_length(subject) <= 200),
  message text check (char_length(message) <= 4000),
  details jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','in_progress','responded','converted','closed')),
  assigned_to uuid,
  employer_id uuid references public.hc_employers(id) on delete set null,
  privacy_ack_at timestamptz not null default now(),
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hc_enquiries_status_idx on public.hc_enquiries(route, status, created_at desc);
create trigger hc_enquiries_touch before update on public.hc_enquiries for each row execute function public.hc_touch();

-- ---------- complaints register ----------
create table if not exists public.hc_complaints (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.hc_next_ref('complaint'),
  complainant_name text not null check (char_length(complainant_name) between 2 and 140),
  email text not null check (char_length(email) <= 320),
  phone text check (char_length(phone) <= 40),
  complainant_role text not null check (complainant_role in ('candidate','employer','employee','other')),
  candidate_reference text check (char_length(candidate_reference) <= 40),
  category text not null check (category in ('recruitment_process','fees','information','discrimination','data_protection','staff_conduct','employer','other')),
  subject text not null check (char_length(subject) between 3 and 200),
  details text not null check (char_length(details) between 10 and 6000),
  status text not null default 'received' check (status in ('received','acknowledged','investigating','resolved','escalated','closed')),
  severity text not null default 'standard' check (severity in ('standard','serious','safeguarding')),
  responsible_id uuid,
  acknowledged_at timestamptz,
  ack_due_at timestamptz,
  response_due_at timestamptz,
  resolution text check (char_length(resolution) <= 6000),
  escalated_to text check (char_length(escalated_to) <= 200),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger hc_complaints_touch before update on public.hc_complaints for each row execute function public.hc_touch();

-- ---------- compliance evidence register ----------
create table if not exists public.hc_compliance_items (
  key text primary key check (key ~ '^[a-z0-9_]{2,60}$'),
  category text not null check (category in ('code_of_practice','policy','data_protection','operations')),
  title text not null,
  status text not null default 'not_started' check (status in ('not_started','in_progress','in_place','needs_review')),
  owner_name text check (char_length(owner_name) <= 140),
  evidence text check (char_length(evidence) <= 4000),
  approved_at date,
  review_due date,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  sort int not null default 100
);

-- ---------- activity / audit log ----------
create table if not exists public.hc_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_role text not null check (actor_role in ('admin','consultant','candidate','public','system')),
  action text not null check (char_length(action) <= 80),
  entity text not null check (char_length(entity) <= 40),
  entity_id text,
  detail jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists hc_audit_entity_idx on public.hc_audit_log(entity, entity_id, created_at desc);
create index if not exists hc_audit_created_idx on public.hc_audit_log(created_at desc);

-- ---------- RLS: on everywhere, no policies (service role only) ----------
do $$ declare t text; begin
  foreach t in array array['hc_settings','hc_consultants','hc_country_rules','hc_candidates','hc_stage_history','hc_employers',
    'hc_vacancies','hc_applications','hc_documents','hc_interviews','hc_messages','hc_notifications','hc_tasks','hc_notes',
    'hc_enquiries','hc_complaints','hc_compliance_items','hc_audit_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke all on sequence public.hc_candidate_seq, public.hc_enquiry_seq, public.hc_complaint_seq, public.hc_application_seq from anon, authenticated;

-- ---------- private storage bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('healthcare-docs', 'healthcare-docs', false, 10485760,
  array['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ---------- seed: Code of Practice country list (NHS Employers, based on WHO SSL 2023; page updated 27 March 2025) ----------
-- Review this list whenever WHO publishes the 2026 Health Workforce Support and Safeguards List.
insert into public.hc_country_rules (country_code, country_name, status, agreement_note, source_url, reviewed_at) values
 ('AF','Afghanistan','red',null,null,'2026-11-04'),('AO','Angola','red',null,null,'2026-11-04'),('BD','Bangladesh','red',null,null,'2026-11-04'),
 ('BJ','Benin','red',null,null,'2026-11-04'),('BF','Burkina Faso','red',null,null,'2026-11-04'),('BI','Burundi','red',null,null,'2026-11-04'),
 ('CM','Cameroon','red',null,null,'2026-11-04'),('CF','Central African Republic','red',null,null,'2026-11-04'),('TD','Chad','red',null,null,'2026-11-04'),
 ('KM','Comoros','red',null,null,'2026-11-04'),('CG','Congo','red',null,null,'2026-11-04'),('CD','Congo, Democratic Republic of','red',null,null,'2026-11-04'),
 ('CI','Côte d''Ivoire','red',null,null,'2026-11-04'),('DJ','Djibouti','red',null,null,'2026-11-04'),('GQ','Equatorial Guinea','red',null,null,'2026-11-04'),
 ('ER','Eritrea','red',null,null,'2026-11-04'),('ET','Ethiopia','red',null,null,'2026-11-04'),('GA','Gabon','red',null,null,'2026-11-04'),
 ('GM','Gambia','red',null,null,'2026-11-04'),('GH','Ghana','red',null,null,'2026-11-04'),('GN','Guinea','red',null,null,'2026-11-04'),
 ('GW','Guinea-Bissau','red',null,null,'2026-11-04'),('HT','Haiti','red',null,null,'2026-11-04'),('KI','Kiribati','red',null,null,'2026-11-04'),
 ('LA','Laos','red',null,null,'2026-11-04'),('LS','Lesotho','red',null,null,'2026-11-04'),('LR','Liberia','red',null,null,'2026-11-04'),
 ('MG','Madagascar','red',null,null,'2026-11-04'),('MW','Malawi','red',null,null,'2026-11-04'),('ML','Mali','red',null,null,'2026-11-04'),
 ('MR','Mauritania','red',null,null,'2026-11-04'),('FM','Micronesia, Federated States of','red',null,null,'2026-11-04'),('MZ','Mozambique','red',null,null,'2026-11-04'),
 ('NE','Niger','red',null,null,'2026-11-04'),('NG','Nigeria','red',null,null,'2026-11-04'),('PK','Pakistan','red',null,null,'2026-11-04'),
 ('PG','Papua New Guinea','red',null,null,'2026-11-04'),('RW','Rwanda','red',null,null,'2026-11-04'),('WS','Samoa','red',null,null,'2026-11-04'),
 ('SN','Senegal','red',null,null,'2026-11-04'),('SL','Sierra Leone','red',null,null,'2026-11-04'),('SB','Solomon Islands','red',null,null,'2026-11-04'),
 ('SO','Somalia','red',null,null,'2026-11-04'),('SS','South Sudan','red',null,null,'2026-11-04'),('SD','Sudan','red',null,null,'2026-11-04'),
 ('TL','Timor-Leste','red',null,null,'2026-11-04'),('TG','Togo','red',null,null,'2026-11-04'),('TV','Tuvalu','red',null,null,'2026-11-04'),
 ('TZ','Tanzania, United Republic of','red',null,null,'2026-11-04'),('UG','Uganda','red',null,null,'2026-11-04'),('VU','Vanuatu','red',null,null,'2026-11-04'),
 ('YE','Yemen','red',null,null,'2026-11-04'),('ZM','Zambia','red',null,null,'2026-11-04'),('ZW','Zimbabwe','red',null,null,'2026-11-04'),
 ('KE','Kenya','amber','Recruitment only within the UK–Kenya bilateral agreement (pilot phase).',null,'2026-11-04'),
 ('NP','Nepal','amber','Recruitment only within the UK–Nepal MoU (single NHS trust pilot via its existing partners).',null,'2026-11-04'),
 ('PH','Philippines','green','UK–Philippines MoU in place; employers hiring more than five people need Philippine accreditation.',null,'2026-11-04'),
 ('IN','India','green','UK–India government-to-government agreement in place.',null,'2026-11-04'),
 ('MY','Malaysia','green','UK–Malaysia government-to-government agreement in place.',null,'2026-11-04'),
 ('LK','Sri Lanka','green','UK–Sri Lanka government-to-government agreement in place.',null,'2026-11-04')
on conflict (country_code) do nothing;
update public.hc_country_rules set source_url = 'https://www.nhsemployers.org/articles/code-practice-red-and-amber-list-countries' where source_url is null;
update public.hc_settings set country_list_reviewed_at = '2026-11-04' where country_list_reviewed_at is null;

-- ---------- seed: compliance evidence register (section 16 of the brief) ----------
insert into public.hc_compliance_items (key, category, title, sort) values
 ('cop_red_list','code_of_practice','No active recruitment from red-list countries (checked by residence)',10),
 ('cop_amber_list','code_of_practice','Amber-list recruitment only within government-to-government agreements',11),
 ('cop_no_fees','code_of_practice','No recruitment or work-finding fees charged to candidates (Employment Agencies Act 1973 s.6)',12),
 ('cop_subcontractors','code_of_practice','Overseas partners / subcontractors do not charge candidates',13),
 ('cop_information','code_of_practice','Candidates receive full job, contract, visa and registration information before accepting',14),
 ('cop_contracts','code_of_practice','No contract substitution; repayment clauses explained in writing before offer',15),
 ('cop_english','code_of_practice','English-language evidence verified via official online services',16),
 ('cop_registration','code_of_practice','Candidates signposted to the correct regulator (NMC, HCPC, GPhC, SWE)',17),
 ('cop_direct_applicants','code_of_practice','Direct applicants from red / amber countries signposted to jobs boards',18),
 ('cop_data_returns','code_of_practice','Recruitment activity recorded and data returns submitted when requested',19),
 ('cop_erl_application','code_of_practice','Ethical Recruiters List application and Code knowledge test completed',20),
 ('pol_manual','policy','Ethical Recruitment & Compliance Manual',30),
 ('pol_checklist','policy','International Recruitment Code of Practice Checklist',31),
 ('pol_candidate_terms','policy','Candidate Terms and Conditions',32),
 ('pol_employer_terms','policy','Employer Terms and Conditions',33),
 ('pol_complaints','policy','Candidate Complaints Procedure',34),
 ('pol_edi','policy','Equality, Diversity and Inclusion Policy',35),
 ('pol_safeguarding','policy','Safeguarding Policy',36),
 ('pol_anti_bribery','policy','Anti-Bribery Policy',37),
 ('pol_verification','policy','Recruitment Verification Procedure',38),
 ('pol_country','policy','Country Recruitment Restrictions Procedure',39),
 ('pol_employer_dd','policy','Employer Due Diligence Procedure',40),
 ('pol_training','policy','Staff Training and Compliance Records',41),
 ('dp_policy','data_protection','Data Protection Policy',50),
 ('dp_candidate_notice','data_protection','Candidate Privacy Notice',51),
 ('dp_employee_notice','data_protection','Employee Privacy Notice',52),
 ('dp_retention','data_protection','Data Retention Schedule',53),
 ('dp_disposal','data_protection','Secure Data Disposal Procedure',54),
 ('dp_breach','data_protection','Data Breach Response Procedure',55),
 ('dp_rights','data_protection','Data Subject Rights Procedure',56),
 ('dp_ico','data_protection','ICO registration (data protection fee) confirmed',57),
 ('dp_transfers','data_protection','International transfer safeguards assessed (IDTA / adequacy)',58),
 ('ops_mfa','operations','Multi-factor authentication enforced for staff accounts',70),
 ('ops_backups','operations','Encrypted backups and restore test',71),
 ('ops_access_review','operations','Quarterly access-permission review',72),
 ('ops_compliance_lead','operations','Responsible person for ethical recruitment and compliance appointed',73)
on conflict (key) do nothing;

commit;
