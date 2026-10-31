-- MUK Talent v11 · Studio gallery: allow photos, PDFs and videos (up to 50 MB) in the team media library.
-- Run once in Supabase > SQL Editor. Safe to run again.

-- 1) Private bucket limits (50 MB is the per-file maximum on the Supabase Free plan).
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp','application/pdf',
      'video/mp4','video/quicktime','video/webm'
    ]
where id = 'mt-employee-private';

-- 2) Table checks: remove any old mime/size checks and add the new ones.
do $$
declare c record;
begin
  if to_regclass('public.mt_employee_assets') is null then
    raise notice 'Table public.mt_employee_assets not found, nothing to change.';
    return;
  end if;
  for c in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.mt_employee_assets'::regclass
      and con.contype = 'c'
      and (pg_get_constraintdef(con.oid) ilike '%mime%' or pg_get_constraintdef(con.oid) ilike '%bytes%')
  loop
    execute format('alter table public.mt_employee_assets drop constraint %I', c.conname);
  end loop;

  alter table public.mt_employee_assets
    add constraint mt_employee_assets_mime_v11 check (mime in (
      'image/jpeg','image/png','image/webp','application/pdf',
      'video/mp4','video/quicktime','video/webm'));
  alter table public.mt_employee_assets
    add constraint mt_employee_assets_bytes_v11 check (bytes > 0 and bytes <= 52428800);
end $$;

-- Check
select id, file_size_limit, allowed_mime_types from storage.buckets where id = 'mt-employee-private';
