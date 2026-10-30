begin;
create table if not exists public.mt_personal_owner (
 singleton boolean primary key default true check(singleton),
 user_id uuid not null unique references auth.users(id) on delete cascade
);
alter table public.mt_personal_owner enable row level security;
revoke all on public.mt_personal_owner from anon, authenticated;
grant select on public.mt_personal_owner to authenticated;
drop policy if exists owner_self on public.mt_personal_owner;
create policy owner_self on public.mt_personal_owner for select to authenticated using(user_id=(select auth.uid()));
create table if not exists public.mt_personal_items (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('project','certificate','profile')),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check(length(title) between 1 and 200),
 subtitle text not null default '' check(length(subtitle)<=500),
 category text not null default '' check(length(category)<=80),
 body text not null default '' check(length(body)<=16000),
 tags text not null default '' check(length(tags)<=600),
 issuer text not null default '' check(length(issuer)<=200),
 issued_on date, expires_on date,
 website_url text not null default '' check(website_url='' or website_url ~ '^https://[^[:space:]]+$'),
 repository_url text not null default '' check(repository_url='' or repository_url ~ '^https://[^[:space:]]+$'),
 verification_url text not null default '' check(verification_url='' or verification_url ~ '^https://[^[:space:]]+$'),
 cover_path text not null default '' check(length(cover_path)<=300),
 document_path text not null default '' check(length(document_path)<=300),
 gallery_paths text not null default '' check(length(gallery_paths)<=4000),
 published boolean not null default false,
 sort_order integer not null default 0 check(sort_order between 0 and 100000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(expires_on is null or issued_on is null or expires_on>=issued_on)
);
create or replace function public.mt_personal_touch() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=clock_timestamp(); return new; end $$;
drop trigger if exists mt_personal_touch on public.mt_personal_items;
create trigger mt_personal_touch before update on public.mt_personal_items for each row execute function public.mt_personal_touch();
alter table public.mt_personal_items enable row level security;
revoke all on public.mt_personal_items from anon, authenticated;
grant select on public.mt_personal_items to anon, authenticated;
grant insert,update,delete on public.mt_personal_items to authenticated;
drop policy if exists published_read on public.mt_personal_items;
create policy published_read on public.mt_personal_items for select to anon,authenticated using(published);
drop policy if exists personal_owner on public.mt_personal_items;
create policy personal_owner on public.mt_personal_items for all to authenticated
using(exists(select 1 from public.mt_personal_owner where user_id=(select auth.uid())))
with check(exists(select 1 from public.mt_personal_owner where user_id=(select auth.uid())));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('mt-personal','mt-personal',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do nothing;
drop policy if exists mt_personal_storage_owner on storage.objects;
create policy mt_personal_storage_owner on storage.objects for all to authenticated
using(bucket_id='mt-personal' and exists(select 1 from public.mt_personal_owner where user_id=(select auth.uid())))
with check(bucket_id='mt-personal' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.mt_personal_owner where user_id=(select auth.uid())));
drop policy if exists mt_personal_storage_published on storage.objects;
create policy mt_personal_storage_published on storage.objects for select to anon,authenticated
using(bucket_id='mt-personal' and exists(
 select 1 from public.mt_personal_items i where i.published and
 (name=i.cover_path or name=i.document_path or name=any(string_to_array(i.gallery_paths,E'\n')))
));
commit;
-- OWNER ASSIGNMENT: run separately after replacing the email.
-- insert into public.mt_personal_owner(singleton,user_id)
-- select true,id from auth.users where lower(email)=lower('YOUR_EXISTING_LOGIN_EMAIL');
-- select user_id from public.mt_personal_owner; -- must return exactly one row
