-- FarmPulse PostgreSQL schema
-- Supabase is used for PostgreSQL + Storage only. Supabase Auth is NOT required.
-- Django owns authentication and application-level authorization.

create extension if not exists pgcrypto;

create table if not exists public.accounts_customuser (
  id uuid primary key default gen_random_uuid(),
  password varchar(128) not null,
  last_login timestamptz,
  is_superuser boolean not null default false,
  email varchar(255) not null unique,
  is_active boolean not null default true,
  is_staff boolean not null default false,
  date_joined timestamptz not null default now()
);

create table if not exists public.accounts_profile (
  user_id uuid primary key references public.accounts_customuser(id) on delete cascade,
  username varchar(40),
  display_name varchar(60),
  avatar_path varchar(500),
  pest_alerts boolean not null default true,
  weekly_digest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts_userrole (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts_customuser(id) on delete cascade,
  role varchar(32) not null default 'user',
  unique(user_id, role)
);

create table if not exists public.accounts_otpcode (
  id bigserial primary key,
  user_id uuid references public.accounts_customuser(id) on delete cascade,
  email varchar(255) not null,
  hashed_code varchar(255) not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  used boolean not null default false
);

create table if not exists public.accounts_passwordresettoken (
  id bigserial primary key,
  user_id uuid not null references public.accounts_customuser(id) on delete cascade,
  hashed_token varchar(255) not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

create table if not exists public.accounts_zone (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts_customuser(id) on delete cascade,
  name varchar(100) not null,
  region varchar(160) not null default '',
  lat double precision not null,
  lon double precision not null,
  hectares numeric(10,2) not null default 1,
  crop varchar(40) not null default 'maize',
  created_at timestamptz not null default now()
);

create table if not exists public.accounts_notification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts_customuser(id) on delete cascade,
  title varchar(160) not null,
  body text not null,
  kind varchar(20) not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.soil_cache (
  id varchar(100) primary key,
  lat double precision not null,
  lon double precision not null,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

create index if not exists accounts_zone_user_idx on public.accounts_zone(user_id);
create index if not exists accounts_notification_user_read_idx on public.accounts_notification(user_id, read, created_at desc);
create index if not exists accounts_otp_email_idx on public.accounts_otpcode(email, used, created_at desc);
create index if not exists accounts_reset_user_idx on public.accounts_passwordresettoken(user_id, used, created_at desc);

-- Supabase Storage bucket. Actual object access is performed by Django's
-- service-role client, so no Supabase Auth policies are required.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- Django is the only service that should write application rows.
-- Do not add auth.uid()-based RLS policies: there is intentionally no
-- Supabase Auth session in this architecture.
