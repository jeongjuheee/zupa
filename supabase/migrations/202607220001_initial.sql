-- 주파 Phase 1 · Supabase schema and RLS
create extension if not exists pgcrypto;

create type public.analysis_status as enum ('pending', 'done', 'failed', 'crisis');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text check (nickname is null or nickname ~ '^[가-힣A-Za-z0-9]{2,10}$'),
  agreed_at timestamptz,
  is_over_14 boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_date date not null,
  diary_text text not null check (char_length(diary_text) between 50 and 1000),
  template_id text not null default 'starter-3-photo',
  template_version integer not null default 1,
  editor_objects jsonb not null default '[]'::jsonb,
  result_image_path text,
  analysis_status public.analysis_status not null default 'pending',
  reanalyze_count integer not null default 0 check (reanalyze_count between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, service_date)
);

create table public.record_photos (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  order_index smallint not null check (order_index between 0 and 3),
  slot_id text,
  crop jsonb not null default '{"scale":1,"offsetX":0,"offsetY":0}'::jsonb,
  unique (record_id, order_index)
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null unique references public.records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_crisis boolean not null,
  keywords text[] not null default '{}',
  type_id smallint check (type_id between 1 and 16),
  hz integer,
  wave jsonb,
  timeline jsonb,
  report_text text not null,
  is_edited boolean not null default false,
  provider text not null,
  model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_crisis and type_id is null and hz is null and wave is null and timeline is null and cardinality(keywords) = 0) or (not is_crisis and type_id is not null and hz is not null and wave is not null and timeline is not null and cardinality(keywords) = 3))
);

create index records_user_date_idx on public.records(user_id, service_date desc);
create index record_photos_user_idx on public.record_photos(user_id);
create index analyses_user_idx on public.analyses(user_id);

alter table public.profiles enable row level security;
alter table public.records enable row level security;
alter table public.record_photos enable row level security;
alter table public.analyses enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

create policy "records_select_own" on public.records for select using (auth.uid() = user_id);
create policy "records_insert_own" on public.records for insert with check (auth.uid() = user_id);
create policy "records_update_own" on public.records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "records_delete_own" on public.records for delete using (auth.uid() = user_id);

create policy "photos_select_own" on public.record_photos for select using (auth.uid() = user_id);
create policy "photos_insert_own" on public.record_photos for insert with check (auth.uid() = user_id);
create policy "photos_update_own" on public.record_photos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "photos_delete_own" on public.record_photos for delete using (auth.uid() = user_id);

create policy "analyses_select_own" on public.analyses for select using (auth.uid() = user_id);
-- analyses writes are server-only through the service role; no client insert/update policies.

insert into storage.buckets (id, name, public)
values ('record-images', 'record-images', false)
on conflict (id) do nothing;

create policy "record_images_read_own" on storage.objects for select
using (bucket_id = 'record-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "record_images_upload_own" on storage.objects for insert
with check (bucket_id = 'record-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "record_images_update_own" on storage.objects for update
using (bucket_id = 'record-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "record_images_delete_own" on storage.objects for delete
using (bucket_id = 'record-images' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row execute procedure public.handle_new_user();
