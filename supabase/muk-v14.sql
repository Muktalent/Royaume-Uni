-- MUK Talent v14 · Studio Productions + website videos.
-- Run once in Supabase > SQL Editor (safe to run again).

-- 1. Productions can hold files from the Media library (no public URL needed).
alter table public.mk_media add column if not exists asset_id uuid references public.mt_employee_assets(id) on delete cascade;
alter table public.mk_media alter column url drop not null;
do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.mk_media'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) ilike '%url%' and pg_get_constraintdef(oid) not ilike '%poster_url%'
  loop execute format('alter table public.mk_media drop constraint %I', c.conname); end loop;
end $$;
alter table public.mk_media add constraint mk_media_url_v14
  check ((url is null or url ~* '^https://') and (url is not null or asset_id is not null));
create unique index if not exists mk_media_owner_asset_uq on public.mk_media(owner_id, asset_id) where asset_id is not null;

-- 2. New audience "web": published on the public website (home page "Our latest videos").
do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.mk_posts'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%audience%'
  loop execute format('alter table public.mk_posts drop constraint %I', c.conname); end loop;
end $$;
alter table public.mk_posts add constraint mk_posts_audience_v14 check (audience in ('all','mine','web'));
create index if not exists mk_posts_web_idx on public.mk_posts(created_at desc) where audience = 'web';
create index if not exists mk_posts_media_idx on public.mk_posts(media_id);

notify pgrst, 'reload schema';
