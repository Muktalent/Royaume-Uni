-- MUK Talent · v22 · Fecha de inicio de contrato (Admin → Equipo → Empleados)
-- Run once in Supabase → SQL Editor. Safe to run more than once.
-- Payroll uses it: no base salary before this date and the first month is prorated by working days (Mon–Fri).
alter table public.mt_employee_directory add column if not exists contract_start date;
comment on column public.mt_employee_directory.contract_start is 'v22 · Contract start date. Payroll starts on this day (first month prorated).';
