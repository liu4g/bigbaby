do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'jlpt_exam_section_kind'
  ) then
    create type public.jlpt_exam_section_kind as enum ('vocabulary', 'grammar', 'reading', 'listening');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'jlpt_resource_delivery_type'
  ) then
    create type public.jlpt_resource_delivery_type as enum ('file_upload', 'external_link');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'jlpt_resource_status'
  ) then
    create type public.jlpt_resource_status as enum ('available', 'coming_soon', 'draft');
  end if;
end $$;

grant usage on type public.jlpt_exam_section_kind to anon, authenticated, service_role;
grant usage on type public.jlpt_resource_delivery_type to anon, authenticated, service_role;
grant usage on type public.jlpt_resource_status to anon, authenticated, service_role;

create table if not exists public.jlpt_mock_exams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (btrim(slug) <> ''),
  level public.jlpt_level not null,
  title text not null check (btrim(title) <> ''),
  description text not null check (btrim(description) <> ''),
  access_tier public.access_tier not null default 'free',
  is_original boolean not null default true,
  status public.content_status not null default 'published',
  duration_seconds integer not null check (duration_seconds > 0),
  total_score integer not null check (total_score > 0),
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text not null default 'CNY' check (btrim(currency) <> ''),
  source_type public.source_type not null default 'manual',
  generation_metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    level in ('N5'::public.jlpt_level, 'N4'::public.jlpt_level, 'N3'::public.jlpt_level)
    or access_tier = 'pro'::public.access_tier
  )
);

create table if not exists public.jlpt_mock_exam_sections (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.jlpt_mock_exams(id) on delete cascade,
  section_kind public.jlpt_exam_section_kind not null,
  title text not null check (btrim(title) <> ''),
  description text not null check (btrim(description) <> ''),
  sort_order integer not null check (sort_order > 0),
  duration_seconds integer not null check (duration_seconds > 0),
  total_score integer not null check (total_score > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, section_kind),
  unique (exam_id, sort_order)
);

create table if not exists public.jlpt_mock_exam_questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.jlpt_mock_exam_sections(id) on delete cascade,
  sort_order integer not null check (sort_order > 0),
  question_type public.question_type not null default 'single_choice',
  prompt text not null check (btrim(prompt) <> ''),
  passage text,
  audio_prompt text,
  hint text,
  explanation text,
  answer_key jsonb not null default '{}'::jsonb,
  difficulty smallint not null default 3 check (difficulty between 1 and 5),
  skill_tags text[] not null default '{}'::text[],
  source_type public.source_type not null default 'manual',
  status public.content_status not null default 'published',
  generation_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_id, sort_order)
);

create table if not exists public.jlpt_mock_exam_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.jlpt_mock_exam_questions(id) on delete cascade,
  option_order integer not null check (option_order > 0),
  option_label text not null check (btrim(option_label) <> ''),
  option_text text not null check (btrim(option_text) <> ''),
  is_correct boolean not null default false,
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, option_order),
  unique (question_id, option_label)
);

create table if not exists public.jlpt_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam_id uuid not null references public.jlpt_mock_exams(id) on delete cascade,
  started_at timestamptz not null,
  paused_seconds integer not null default 0 check (paused_seconds >= 0),
  submitted_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  score_obtained integer not null default 0 check (score_obtained >= 0),
  total_score integer not null default 0 check (total_score >= 0),
  accuracy numeric(5,2) not null default 0 check (accuracy >= 0 and accuracy <= 100),
  section_scores jsonb not null default '{}'::jsonb,
  weak_points text[] not null default '{}'::text[],
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'submitted' check (status in ('in_progress', 'paused', 'submitted', 'expired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jlpt_download_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (btrim(slug) <> ''),
  level public.jlpt_level not null,
  title text not null check (btrim(title) <> ''),
  description text not null check (btrim(description) <> ''),
  access_tier public.access_tier not null default 'free',
  delivery_type public.jlpt_resource_delivery_type not null,
  storage_bucket text,
  storage_path text,
  external_url text,
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text not null default 'CNY' check (btrim(currency) <> ''),
  status public.jlpt_resource_status not null default 'coming_soon',
  license_status text not null default 'requires_authorization' check (license_status in ('requires_authorization', 'authorized')),
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    level in ('N5'::public.jlpt_level, 'N4'::public.jlpt_level, 'N3'::public.jlpt_level)
    or access_tier = 'pro'::public.access_tier
  ),
  check (
    status <> 'available'::public.jlpt_resource_status
    or (
      delivery_type = 'file_upload'::public.jlpt_resource_delivery_type
      and storage_bucket is not null
      and storage_path is not null
    )
    or (
      delivery_type = 'external_link'::public.jlpt_resource_delivery_type
      and external_url is not null
    )
  )
);

alter table public.jlpt_mock_exams enable row level security;
alter table public.jlpt_mock_exam_sections enable row level security;
alter table public.jlpt_mock_exam_questions enable row level security;
alter table public.jlpt_mock_exam_options enable row level security;
alter table public.jlpt_exam_attempts enable row level security;
alter table public.jlpt_download_resources enable row level security;

create index if not exists idx_jlpt_mock_exams_level_status_tier
  on public.jlpt_mock_exams (level, status, access_tier, created_at desc);

create index if not exists idx_jlpt_mock_exam_sections_exam_order
  on public.jlpt_mock_exam_sections (exam_id, sort_order);

create index if not exists idx_jlpt_mock_exam_questions_section_order
  on public.jlpt_mock_exam_questions (section_id, sort_order);

create index if not exists idx_jlpt_mock_exam_questions_skill_tags
  on public.jlpt_mock_exam_questions using gin (skill_tags);

create index if not exists idx_jlpt_exam_attempts_user_exam_created
  on public.jlpt_exam_attempts (user_id, exam_id, created_at desc);

create index if not exists idx_jlpt_download_resources_level_status_tier
  on public.jlpt_download_resources (level, status, access_tier, price_cents);

create or replace function public.can_access_jlpt_level(
  target_level public.jlpt_level,
  required_tier public.access_tier
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    public.can_access_tier(required_tier)
    and (
      target_level in ('N5'::public.jlpt_level, 'N4'::public.jlpt_level, 'N3'::public.jlpt_level)
      or public.user_has_pro_access()
    );
$$;

revoke all on function public.can_access_jlpt_level(public.jlpt_level, public.access_tier) from public;
grant execute on function public.can_access_jlpt_level(public.jlpt_level, public.access_tier) to anon, authenticated, service_role;

create or replace function public.can_access_jlpt_exam(target_exam_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.jlpt_mock_exams e
    where e.id = target_exam_id
      and e.status = 'published'
      and public.can_access_jlpt_level(e.level, e.access_tier)
  );
$$;

revoke all on function public.can_access_jlpt_exam(uuid) from public;
grant execute on function public.can_access_jlpt_exam(uuid) to anon, authenticated, service_role;

drop policy if exists "jlpt_mock_exams_select_accessible" on public.jlpt_mock_exams;
create policy "jlpt_mock_exams_select_accessible"
on public.jlpt_mock_exams
for select
to anon, authenticated
using (
  status = 'published'
  and public.can_access_jlpt_level(level, access_tier)
);

drop policy if exists "jlpt_mock_exam_sections_select_accessible_parent" on public.jlpt_mock_exam_sections;
create policy "jlpt_mock_exam_sections_select_accessible_parent"
on public.jlpt_mock_exam_sections
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.jlpt_mock_exams e
    where e.id = exam_id
      and e.status = 'published'
      and public.can_access_jlpt_level(e.level, e.access_tier)
  )
);

drop policy if exists "jlpt_mock_exam_questions_select_accessible_parent" on public.jlpt_mock_exam_questions;
create policy "jlpt_mock_exam_questions_select_accessible_parent"
on public.jlpt_mock_exam_questions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.jlpt_mock_exam_sections s
    join public.jlpt_mock_exams e on e.id = s.exam_id
    where s.id = section_id
      and e.status = 'published'
      and public.can_access_jlpt_level(e.level, e.access_tier)
  )
);

drop policy if exists "jlpt_mock_exam_options_select_accessible_parent" on public.jlpt_mock_exam_options;
create policy "jlpt_mock_exam_options_select_accessible_parent"
on public.jlpt_mock_exam_options
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.jlpt_mock_exam_questions q
    join public.jlpt_mock_exam_sections s on s.id = q.section_id
    join public.jlpt_mock_exams e on e.id = s.exam_id
    where q.id = question_id
      and q.status = 'published'
      and e.status = 'published'
      and public.can_access_jlpt_level(e.level, e.access_tier)
  )
);

drop policy if exists "jlpt_exam_attempts_own_rows" on public.jlpt_exam_attempts;
drop policy if exists "jlpt_exam_attempts_select_own" on public.jlpt_exam_attempts;
drop policy if exists "jlpt_exam_attempts_insert_accessible" on public.jlpt_exam_attempts;
drop policy if exists "jlpt_exam_attempts_update_own" on public.jlpt_exam_attempts;
drop policy if exists "jlpt_exam_attempts_delete_own" on public.jlpt_exam_attempts;

create policy "jlpt_exam_attempts_select_own"
on public.jlpt_exam_attempts
for select
to authenticated
using (auth.uid() = user_id);

create policy "jlpt_exam_attempts_insert_accessible"
on public.jlpt_exam_attempts
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.can_access_jlpt_exam(exam_id)
);

create policy "jlpt_exam_attempts_update_own"
on public.jlpt_exam_attempts
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and public.can_access_jlpt_exam(exam_id)
);

create policy "jlpt_exam_attempts_delete_own"
on public.jlpt_exam_attempts
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "jlpt_download_resources_select_accessible" on public.jlpt_download_resources;
create policy "jlpt_download_resources_select_accessible"
on public.jlpt_download_resources
for select
to anon, authenticated
using (
  status = 'available'
  and license_status = 'authorized'
  and public.can_access_jlpt_level(level, access_tier)
);

revoke select on table public.jlpt_mock_exams from anon, authenticated;
grant select (
  id,
  slug,
  level,
  title,
  description,
  access_tier,
  is_original,
  status,
  duration_seconds,
  total_score,
  price_cents,
  currency,
  source_type,
  generation_metadata,
  published_at,
  created_at,
  updated_at
) on table public.jlpt_mock_exams to anon, authenticated;

revoke select on table public.jlpt_mock_exam_sections from anon, authenticated;
grant select (
  id,
  exam_id,
  section_kind,
  title,
  description,
  sort_order,
  duration_seconds,
  total_score,
  created_at,
  updated_at
) on table public.jlpt_mock_exam_sections to anon, authenticated;

revoke select on table public.jlpt_mock_exam_questions from anon, authenticated;
grant select (
  id,
  section_id,
  sort_order,
  question_type,
  prompt,
  passage,
  audio_prompt,
  hint,
  difficulty,
  skill_tags,
  source_type,
  status,
  generation_metadata,
  created_at,
  updated_at
) on table public.jlpt_mock_exam_questions to anon, authenticated;

revoke select on table public.jlpt_mock_exam_options from anon, authenticated;
grant select (
  id,
  question_id,
  option_order,
  option_label,
  option_text,
  created_at,
  updated_at
) on table public.jlpt_mock_exam_options to anon, authenticated;

revoke select on table public.jlpt_download_resources from anon, authenticated;
grant select (
  id,
  slug,
  level,
  title,
  description,
  access_tier,
  delivery_type,
  price_cents,
  currency,
  status,
  license_status,
  published_at,
  metadata,
  created_at,
  updated_at
) on table public.jlpt_download_resources to anon, authenticated;

grant select, insert, update, delete on table public.jlpt_exam_attempts to authenticated;

create trigger set_updated_at_jlpt_mock_exams
before update on public.jlpt_mock_exams
for each row execute function public.touch_updated_at();

create trigger set_updated_at_jlpt_mock_exam_sections
before update on public.jlpt_mock_exam_sections
for each row execute function public.touch_updated_at();

create trigger set_updated_at_jlpt_mock_exam_questions
before update on public.jlpt_mock_exam_questions
for each row execute function public.touch_updated_at();

create trigger set_updated_at_jlpt_mock_exam_options
before update on public.jlpt_mock_exam_options
for each row execute function public.touch_updated_at();

create trigger set_updated_at_jlpt_exam_attempts
before update on public.jlpt_exam_attempts
for each row execute function public.touch_updated_at();

create trigger set_updated_at_jlpt_download_resources
before update on public.jlpt_download_resources
for each row execute function public.touch_updated_at();
