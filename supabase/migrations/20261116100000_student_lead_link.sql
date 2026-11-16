-- MUKTalent · v24 · Une los leads (crm_candidates) con las cuentas Global Passport (gp_students) por correo.
-- Corrige los estudiantes que ya existen. A partir de v24 el servidor mantiene la unión automáticamente.
-- Run once in Supabase → SQL Editor. Safe to run more than once.

-- 1) Lead con responsable → Global Passport sin counsellor: el responsable pasa a llevar su Global Passport.
with lead as (
  select distinct on (lower(c.email)) lower(c.email) as email, c.assigned_to
  from public.crm_candidates c
  join public.crm_staff s on s.user_id = c.assigned_to and s.active
  where c.archived_at is null and c.email is not null and c.assigned_to is not null
  order by lower(c.email), c.updated_at desc
)
update public.gp_students g
set counsellor_id = lead.assigned_to, updated_at = now()
from lead
where lower(g.email) = lead.email and g.counsellor_id is null;

-- 2) Global Passport con counsellor → lead sin responsable: el counsellor pasa a ser el responsable.
update public.crm_candidates c
set assigned_to = g.counsellor_id, updated_at = now()
from public.gp_students g
join public.crm_staff s on s.user_id = g.counsellor_id and s.active
where c.archived_at is null and c.assigned_to is null and c.email is not null and lower(c.email) = lower(g.email);

-- 3) Global Passport sin lead: se crea el lead (origen «global_passport») para que aparezca en Leads y casos.
insert into public.crm_candidates (first_name, last_name, email, residence_country_code, subject_interest, intended_intake, source, preferred_language, assigned_to, next_action)
select
  left(split_part(trim(g.full_name), ' ', 1), 150),
  left(coalesce(nullif(trim(substr(trim(g.full_name), length(split_part(trim(g.full_name), ' ', 1)) + 1)), ''), '-'), 150),
  lower(g.email),
  case when g.country_residence ~ '^[A-Z]{2}$' then g.country_residence end,
  left(g.subject, 500),
  left(g.intake, 80),
  'global_passport', 'en',
  case when exists (select 1 from public.crm_staff s where s.user_id = g.counsellor_id and s.active) then g.counsellor_id end,
  'Global Passport ' || g.reference || ' · first contact'
from public.gp_students g
where not exists (select 1 from public.crm_candidates c where c.email is not null and lower(c.email) = lower(g.email) and c.archived_at is null);

-- 4) Revisión: estudiantes cuyo counsellor en Global Passport no coincide con el responsable del lead.
--    (No se cambia nada; decide tú cuál es el correcto y cámbialo en Leads y casos o en Global Passport.)
select g.reference, g.full_name, g.email,
       (select full_name from public.crm_staff where user_id = g.counsellor_id) as counsellor_global_passport,
       (select full_name from public.crm_staff where user_id = c.assigned_to) as responsable_lead
from public.gp_students g
join public.crm_candidates c on lower(c.email) = lower(g.email) and c.archived_at is null
where c.assigned_to is not null and g.counsellor_id is not null and c.assigned_to <> g.counsellor_id;
