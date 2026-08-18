create type public.dictionary_import_status as enum (
  'new',
  'parsed',
  'fused',
  'needs_review',
  'approved',
  'rejected',
  'imported'
);

create type public.dictionary_source_kind as enum (
  'mdx',
  'mdd',
  'css',
  'png',
  'jpg',
  'jpeg',
  'ttf',
  'otf',
  'csv',
  'json',
  'manual',
  'other'
);

create table if not exists public.dictionary_import_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  file_path text not null check (btrim(file_path) <> ''),
  file_size_bytes bigint not null default 0 check (file_size_bytes >= 0),
  file_hash text,
  source_kind public.dictionary_source_kind not null default 'mdx',
  language_pair text,
  title text,
  description text,
  encoding text,
  copyright_note text,
  license_status text not null default 'unknown' check (license_status in ('unknown', 'allowed', 'restricted', 'internal_reference_only')),
  parser_status public.dictionary_import_status not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (file_path)
);

create table if not exists public.dictionary_import_entries (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.dictionary_import_sources(id) on delete cascade,
  source_entry_key text not null check (btrim(source_entry_key) <> ''),
  headword text not null check (btrim(headword) <> ''),
  reading text,
  pitch_accent text,
  part_of_speech text,
  jlpt_level public.jlpt_level,
  meaning_keywords text[] not null default '{}'::text[],
  raw_definition text,
  raw_examples jsonb not null default '[]'::jsonb,
  normalized jsonb not null default '{}'::jsonb,
  source_hash text not null,
  import_status public.dictionary_import_status not null default 'new',
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, source_entry_key)
);

create table if not exists public.vocabulary_fusion_candidates (
  id uuid primary key default gen_random_uuid(),
  fusion_key text not null unique check (btrim(fusion_key) <> ''),
  word text not null check (btrim(word) <> ''),
  reading text,
  pitch_accent text,
  part_of_speech text,
  jlpt_level public.jlpt_level,
  category text not null default 'general' check (btrim(category) <> ''),
  meaning_keywords text[] not null default '{}'::text[],
  rewritten_meaning text,
  original_examples jsonb not null default '[]'::jsonb,
  synonyms text[] not null default '{}'::text[],
  antonyms text[] not null default '{}'::text[],
  source_entry_ids uuid[] not null default '{}'::uuid[],
  source_summary jsonb not null default '{}'::jsonb,
  confidence_score numeric(5,2) not null default 0 check (confidence_score >= 0 and confidence_score <= 100),
  editorial_status public.dictionary_import_status not null default 'needs_review',
  editorial_notes text,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  imported_vocabulary_id uuid references public.vocabulary(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (approved_at is null or editorial_status in ('approved', 'imported'))
);

create index if not exists idx_dictionary_import_sources_kind_status
  on public.dictionary_import_sources (source_kind, parser_status);

create index if not exists idx_dictionary_import_entries_headword
  on public.dictionary_import_entries (headword);

create index if not exists idx_dictionary_import_entries_reading
  on public.dictionary_import_entries (reading);

create index if not exists idx_dictionary_import_entries_source_status
  on public.dictionary_import_entries (source_id, import_status);

create index if not exists idx_dictionary_import_entries_keywords_gin
  on public.dictionary_import_entries using gin (meaning_keywords);

create index if not exists idx_vocabulary_fusion_candidates_status_level
  on public.vocabulary_fusion_candidates (editorial_status, jlpt_level);

create index if not exists idx_vocabulary_fusion_candidates_word_reading
  on public.vocabulary_fusion_candidates (word, reading);

create index if not exists idx_vocabulary_fusion_candidates_keywords_gin
  on public.vocabulary_fusion_candidates using gin (meaning_keywords);

create or replace function public.is_content_editor()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('editor'::public.user_role, 'admin'::public.user_role)
  );
$$;

revoke all on function public.is_content_editor() from public;
grant execute on function public.is_content_editor() to authenticated, service_role;

alter table public.dictionary_import_sources enable row level security;
alter table public.dictionary_import_entries enable row level security;
alter table public.vocabulary_fusion_candidates enable row level security;

drop policy if exists "dictionary_import_sources_editor_rows" on public.dictionary_import_sources;
create policy "dictionary_import_sources_editor_rows"
on public.dictionary_import_sources
for all
to authenticated
using (public.is_content_editor())
with check (public.is_content_editor());

drop policy if exists "dictionary_import_entries_editor_rows" on public.dictionary_import_entries;
create policy "dictionary_import_entries_editor_rows"
on public.dictionary_import_entries
for all
to authenticated
using (public.is_content_editor())
with check (public.is_content_editor());

drop policy if exists "vocabulary_fusion_candidates_editor_rows" on public.vocabulary_fusion_candidates;
create policy "vocabulary_fusion_candidates_editor_rows"
on public.vocabulary_fusion_candidates
for all
to authenticated
using (public.is_content_editor())
with check (public.is_content_editor());

create trigger set_updated_at_dictionary_import_sources
before update on public.dictionary_import_sources
for each row execute function public.touch_updated_at();

create trigger set_updated_at_dictionary_import_entries
before update on public.dictionary_import_entries
for each row execute function public.touch_updated_at();

create trigger set_updated_at_vocabulary_fusion_candidates
before update on public.vocabulary_fusion_candidates
for each row execute function public.touch_updated_at();
