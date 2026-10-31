-- muk-social-v1 · MUK Talent: chat (WhatsApp style + voice notes), notification feed,
-- Cloudinary video library and Global Passport photo.
-- Run once in Supabase → SQL Editor. Safe to run again.
-- Every table has RLS enabled and NO policies: only the server (service role) can read/write.
begin;

-- 1. Counsellor thread (gp_messages) gets voice notes.
alter table public.gp_messages add column if not exists audio_path text;
alter table public.gp_messages add column if not exists audio_ms integer check (audio_ms is null or audio_ms between 0 and 300000);

-- 2. Student passport photo + opt-out from student-to-student chat.
alter table public.gp_students add column if not exists photo_path text;
alter table public.gp_students add column if not exists chat_visible boolean not null default true;

-- 3. Conversations (student↔student, team↔team, admin↔anyone).
create table if not exists public.mk_conversations (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'direct' check (kind in ('direct','group')),
  title       text check (title is null or length(title) <= 120),
  direct_key  text unique,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create table if not exists public.mk_members (
  conversation_id uuid not null references public.mk_conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  last_read_at    timestamptz,
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists mk_members_user on public.mk_members(user_id);
create table if not exists public.mk_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.mk_conversations(id) on delete cascade,
  sender_id       uuid references auth.users(id) on delete set null,
  body            text check (body is null or length(body) between 1 and 2000),
  audio_path      text,
  audio_ms        integer check (audio_ms is null or audio_ms between 0 and 300000),
  created_at      timestamptz not null default now(),
  check (body is not null or audio_path is not null)
);
create index if not exists mk_messages_conv on public.mk_messages(conversation_id, created_at desc);

-- 4. Video library (Cloudinary uploads or external links).
create table if not exists public.mk_media (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  title       text not null check (length(title) between 1 and 140),
  url         text not null check (url ~* '^https://'),
  poster_url  text check (poster_url is null or poster_url ~* '^https://'),
  kind        text not null default 'video',
  bytes       bigint,
  duration    numeric,
  created_at  timestamptz not null default now()
);
create index if not exists mk_media_owner on public.mk_media(owner_id, created_at desc);

-- 5. Notification feed: news, scheduled lives and published videos.
create table if not exists public.mk_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references auth.users(id) on delete set null,
  kind        text not null check (kind in ('news','live','video')),
  title       text not null check (length(title) between 2 and 140),
  body        text check (body is null or length(body) <= 2000),
  media_url   text check (media_url is null or media_url ~* '^https://'),
  poster_url  text check (poster_url is null or poster_url ~* '^https://'),
  asset_id    uuid,
  media_id    uuid references public.mk_media(id) on delete set null,
  live_at     timestamptz,
  audience    text not null default 'all' check (audience in ('all','mine')),
  created_at  timestamptz not null default now()
);
create index if not exists mk_posts_created on public.mk_posts(created_at desc);
create table if not exists public.mk_post_reads (
  post_id  uuid not null references public.mk_posts(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  read_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.mk_conversations enable row level security;
alter table public.mk_members      enable row level security;
alter table public.mk_messages     enable row level security;
alter table public.mk_media        enable row level security;
alter table public.mk_posts        enable row level security;
alter table public.mk_post_reads   enable row level security;
revoke all on public.mk_conversations, public.mk_members, public.mk_messages, public.mk_media, public.mk_posts, public.mk_post_reads from anon, authenticated;

-- 6. Private bucket for voice notes (5 MB). Access only through signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mk-chat-audio', 'mk-chat-audio', false, 5242880, array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/aac'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

commit;

-- Check: should list the 6 mk_* tables with rowsecurity = true.
select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename like 'mk\_%' order by 1;
