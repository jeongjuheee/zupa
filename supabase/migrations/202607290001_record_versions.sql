-- One representative record per Asia/Seoul service date; edits retain the record id.
alter table public.records
  add column if not exists emotion_selections jsonb not null default '[]'::jsonb,
  add column if not exists current_report_version integer not null default 0;

alter table public.records
  drop constraint if exists records_diary_text_check;

alter table public.records
  add constraint records_diary_text_check
  check (char_length(diary_text) between 120 and 1000);

alter table public.analyses
  drop constraint if exists analyses_record_id_key;

alter table public.analyses
  add column if not exists version integer not null default 1;

create unique index if not exists analyses_record_version_idx
  on public.analyses (record_id, version);

create table if not exists public.decorated_images (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_report_version integer not null,
  image_url text not null,
  is_current_version boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists decorated_images_record_idx
  on public.decorated_images(record_id, created_at desc);

alter table public.decorated_images enable row level security;

create policy "decorated_images_select_own" on public.decorated_images
  for select using (auth.uid() = user_id);
create policy "decorated_images_insert_own" on public.decorated_images
  for insert with check (auth.uid() = user_id);
create policy "decorated_images_update_own" on public.decorated_images
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
