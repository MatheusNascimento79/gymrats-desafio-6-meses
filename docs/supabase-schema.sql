create extension if not exists pgcrypto;

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
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

create index if not exists activities_activity_date_idx on public.activities (activity_date);
create index if not exists activities_participant_idx on public.activities (participant);

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
