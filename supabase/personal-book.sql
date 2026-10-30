-- Portfolio libro: añade los tipos experience, education y link.
-- Ejecutar UNA vez en Supabase > SQL Editor. No borra ni modifica datos existentes.
begin;
do $$
declare r record;
begin
  for r in select conname from pg_constraint
           where conrelid = 'public.mt_personal_items'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table public.mt_personal_items drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.mt_personal_items add constraint mt_personal_items_kind_check
  check (kind in ('project','certificate','profile','experience','education','link'));
commit;
-- Comprobación: debe mostrar la nueva lista de tipos.
select conname, pg_get_constraintdef(oid) from pg_constraint
where conrelid = 'public.mt_personal_items'::regclass and conname = 'mt_personal_items_kind_check';
