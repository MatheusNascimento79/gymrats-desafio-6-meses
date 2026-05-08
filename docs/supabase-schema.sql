create extension if not exists pgcrypto;

create table if not exists public.participants (
  gymrats_id text primary key,
  uuid text,
  role text not null default 'member',
  full_name text not null,
  profile_picture_url text,
  password_hash text,
  password_salt text,
  password_created_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists participants_full_name_idx on public.participants (full_name);

create table if not exists public.auth_sessions (
  token text primary key,
  participant_gymrats_id text not null references public.participants(gymrats_id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  gymrats_check_in_id text,
  participant_gymrats_id text references public.participants(gymrats_id) on delete set null,
  participant text not null,
  activity_date date not null,
  activity_type text not null default 'Atividade',
  duration_minutes numeric,
  points numeric,
  calories numeric,
  distance numeric,
  team text,
  dedup_key text not null unique,
  created_at timestamptz not null default now()
);

alter table public.activities add column if not exists gymrats_check_in_id text;
alter table public.activities add column if not exists participant_gymrats_id text;

create index if not exists activities_activity_date_idx on public.activities (activity_date);
create index if not exists activities_participant_idx on public.activities (participant);
create unique index if not exists activities_gymrats_check_in_id_idx
  on public.activities (gymrats_check_in_id)
  where gymrats_check_in_id is not null;

create table if not exists public.alcohol_records (
  id uuid primary key default gen_random_uuid(),
  participant text not null,
  week_key date not null,
  status text not null check (status in ('ok', 'broke', 'unknown')),
  updated_at timestamptz not null default now(),
  unique (participant, week_key)
);

create index if not exists alcohol_records_week_key_idx on public.alcohol_records (week_key);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('replace', 'merge')),
  received_records integer not null default 0,
  saved_records integer not null default 0,
  duplicate_records integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.import_batches add column if not exists mode text;
alter table public.import_batches add column if not exists received_records integer not null default 0;
alter table public.import_batches add column if not exists saved_records integer not null default 0;
alter table public.import_batches add column if not exists duplicate_records integer not null default 0;
