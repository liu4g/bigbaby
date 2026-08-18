begin;

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('student', 'editor', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.jlpt_level as enum ('N5', 'N4', 'N3', 'N2', 'N1');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.access_tier as enum ('free', 'pro');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.source_type as enum ('manual', 'ai_generated', 'imported');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.practice_kind as enum ('vocabulary', 'grammar', 'reading', 'mixed', 'jlpt_mock');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.question_type as enum ('single_choice', 'text_input');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.session_type as enum ('study', 'review', 'practice', 'jlpt_mock');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.plan_tier as enum ('free', 'pro');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'expired', 'inactive');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.study_plan_kind as enum ('custom', 'jlpt', 'review', 'ai_generated');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.study_plan_status as enum ('active', 'paused', 'completed', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.progress_status as enum ('not_started', 'in_progress', 'completed', 'suspended');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_target_type as enum ('vocabulary', 'grammar', 'article', 'practice_set');
exception
  when duplicate_object then null;
end $$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (btrim(display_name) <> ''),
  avatar_url text,
  role public.user_role not null default 'student',
  target_level public.jlpt_level not null default 'N3',
  native_language text not null default 'zh' check (btrim(native_language) <> ''),
  locale text not null default 'zh-CN' check (btrim(locale) <> ''),
  study_goal_minutes integer not null default 30 check (study_goal_minutes > 0),
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (btrim(slug) <> ''),
  level public.jlpt_level not null,
  word text not null check (btrim(word) <> ''),
  kana text not null check (btrim(kana) <> ''),
  romaji text,
  meaning text not null check (btrim(meaning) <> ''),
  part_of_speech text,
  notes text,
  access_tier public.access_tier not null default 'free',
  source_type public.source_type not null default 'manual',
  status public.content_status not null default 'published',
  generation_metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocabulary_examples (
  id uuid primary key default gen_random_uuid(),
  vocabulary_id uuid not null references public.vocabulary(id) on delete cascade,
  example_order integer not null check (example_order > 0),
  japanese_text text not null check (btrim(japanese_text) <> ''),
  translation text not null check (btrim(translation) <> ''),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vocabulary_id, example_order)
);

create table if not exists public.grammar (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (btrim(slug) <> ''),
  level public.jlpt_level not null,
  title text not null check (btrim(title) <> ''),
  pattern text not null check (btrim(pattern) <> ''),
  meaning text not null check (btrim(meaning) <> ''),
  usage_notes text,
  notes text,
  access_tier public.access_tier not null default 'free',
  source_type public.source_type not null default 'manual',
  status public.content_status not null default 'published',
  generation_metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grammar_examples (
  id uuid primary key default gen_random_uuid(),
  grammar_id uuid not null references public.grammar(id) on delete cascade,
  example_order integer not null check (example_order > 0),
  japanese_text text not null check (btrim(japanese_text) <> ''),
  translation text not null check (btrim(translation) <> ''),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grammar_id, example_order)
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (btrim(slug) <> ''),
  level public.jlpt_level not null,
  title text not null check (btrim(title) <> ''),
  summary text not null check (btrim(summary) <> ''),
  body_markdown text not null check (btrim(body_markdown) <> ''),
  estimated_read_time_minutes integer not null default 5 check (estimated_read_time_minutes > 0),
  word_count integer not null default 0 check (word_count >= 0),
  access_tier public.access_tier not null default 'free',
  source_type public.source_type not null default 'manual',
  status public.content_status not null default 'published',
  generation_metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_sentences (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  sentence_order integer not null check (sentence_order > 0),
  japanese_text text not null check (btrim(japanese_text) <> ''),
  translation text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, sentence_order)
);

create table if not exists public.article_vocabulary (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary(id) on delete cascade,
  sort_order integer not null default 1 check (sort_order > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, vocabulary_id)
);

create table if not exists public.article_grammar (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  grammar_id uuid not null references public.grammar(id) on delete cascade,
  sort_order integer not null default 1 check (sort_order > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, grammar_id)
);

create table if not exists public.practice_sets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (btrim(slug) <> ''),
  level public.jlpt_level not null,
  title text not null check (btrim(title) <> ''),
  description text not null check (btrim(description) <> ''),
  kind public.practice_kind not null default 'mixed',
  is_jlpt_style boolean not null default false,
  access_tier public.access_tier not null default 'free',
  source_type public.source_type not null default 'manual',
  status public.content_status not null default 'published',
  generation_metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  practice_set_id uuid not null references public.practice_sets(id) on delete cascade,
  sort_order integer not null check (sort_order > 0),
  question_type public.question_type not null default 'single_choice',
  prompt text not null check (btrim(prompt) <> ''),
  hint text,
  explanation text,
  answer_key jsonb not null default '{}'::jsonb,
  difficulty smallint not null default 3 check (difficulty between 1 and 5),
  source_article_id uuid references public.articles(id) on delete set null,
  source_vocabulary_id uuid references public.vocabulary(id) on delete set null,
  source_grammar_id uuid references public.grammar(id) on delete set null,
  source_type public.source_type not null default 'manual',
  status public.content_status not null default 'published',
  generation_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practice_set_id, sort_order),
  check (num_nonnulls(source_article_id, source_vocabulary_id, source_grammar_id) <= 1)
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
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

create unique index if not exists question_options_one_correct_idx
  on public.question_options (question_id)
  where is_correct;

create table if not exists public.wrong_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_id uuid references public.question_options(id) on delete set null,
  wrong_count integer not null default 1 check (wrong_count > 0),
  last_wrong_at timestamptz not null default now(),
  resolved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id),
  check (resolved_at is null or resolved_at >= last_wrong_at)
);

create table if not exists public.user_vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary(id) on delete cascade,
  status public.progress_status not null default 'not_started',
  srs_level smallint not null default 0 check (srs_level >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  mastery_score numeric(5,2) not null default 0 check (mastery_score >= 0 and mastery_score <= 100),
  last_studied_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, vocabulary_id)
);

create table if not exists public.user_grammar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  grammar_id uuid not null references public.grammar(id) on delete cascade,
  status public.progress_status not null default 'not_started',
  srs_level smallint not null default 0 check (srs_level >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  mastery_score numeric(5,2) not null default 0 check (mastery_score >= 0 and mastery_score <= 100),
  last_studied_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, grammar_id)
);

create table if not exists public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_type public.content_target_type not null,
  vocabulary_id uuid references public.vocabulary(id) on delete cascade,
  grammar_id uuid references public.grammar(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  practice_set_id uuid references public.practice_sets(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (
      content_type = 'vocabulary'
      and vocabulary_id is not null
      and grammar_id is null
      and article_id is null
      and practice_set_id is null
    )
    or (
      content_type = 'grammar'
      and vocabulary_id is null
      and grammar_id is not null
      and article_id is null
      and practice_set_id is null
    )
    or (
      content_type = 'article'
      and vocabulary_id is null
      and grammar_id is null
      and article_id is not null
      and practice_set_id is null
    )
    or (
      content_type = 'practice_set'
      and vocabulary_id is null
      and grammar_id is null
      and article_id is null
      and practice_set_id is not null
    )
  )
);

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (btrim(title) <> ''),
  target_level public.jlpt_level not null,
  kind public.study_plan_kind not null default 'custom',
  daily_target_minutes integer not null default 30 check (daily_target_minutes > 0),
  days_per_week smallint not null default 7 check (days_per_week between 1 and 7),
  start_date date,
  target_date date,
  status public.study_plan_status not null default 'active',
  source_type public.source_type not null default 'manual',
  generation_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (target_date is null or start_date is null or target_date >= start_date)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  tier public.plan_tier not null default 'free',
  status public.subscription_status not null default 'inactive',
  provider text not null default 'manual' check (btrim(provider) <> ''),
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_period_end is null or current_period_start is null or current_period_end >= current_period_start)
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  study_plan_id uuid references public.study_plans(id) on delete set null,
  practice_set_id uuid references public.practice_sets(id) on delete set null,
  session_type public.session_type not null,
  target_level public.jlpt_level,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  items_completed integer not null default 0 check (items_completed >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  notes text,
  session_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_type public.content_target_type not null,
  vocabulary_id uuid references public.vocabulary(id) on delete cascade,
  grammar_id uuid references public.grammar(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  practice_set_id uuid references public.practice_sets(id) on delete cascade,
  status public.progress_status not null default 'not_started',
  mastery_score numeric(5,2) not null default 0 check (mastery_score >= 0 and mastery_score <= 100),
  review_stage smallint not null default 0 check (review_stage >= 0),
  last_studied_at timestamptz,
  next_review_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (
      content_type = 'vocabulary'
      and vocabulary_id is not null
      and grammar_id is null
      and article_id is null
      and practice_set_id is null
    )
    or (
      content_type = 'grammar'
      and vocabulary_id is null
      and grammar_id is not null
      and article_id is null
      and practice_set_id is null
    )
    or (
      content_type = 'article'
      and vocabulary_id is null
      and grammar_id is null
      and article_id is not null
      and practice_set_id is null
    )
    or (
      content_type = 'practice_set'
      and vocabulary_id is null
      and grammar_id is null
      and article_id is null
      and practice_set_id is not null
    )
  )
);

create or replace function public.user_has_pro_access()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = auth.uid()
      and s.tier = 'pro'
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end >= now())
  );
$$;

create or replace function public.can_access_tier(required_tier public.access_tier)
returns boolean
language sql
stable
set search_path = public, auth
as $$
  select required_tier = 'free'::public.access_tier or public.user_has_pro_access();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  derived_name text;
begin
  derived_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    split_part(coalesce(new.email, ''), '@', 1),
    'Learner'
  );

  insert into public.profiles (
    id,
    display_name,
    role,
    target_level,
    native_language,
    locale,
    study_goal_minutes
  )
  values (
    new.id,
    derived_name,
    'student',
    'N3',
    'zh',
    'zh-CN',
    30
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (
    user_id,
    tier,
    status,
    provider,
    started_at
  )
  values (
    new.id,
    'free',
    'active',
    'manual',
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create index if not exists idx_vocabulary_level_status_tier
  on public.vocabulary (level, status, access_tier);

create index if not exists idx_grammar_level_status_tier
  on public.grammar (level, status, access_tier);

create index if not exists idx_articles_level_status_tier
  on public.articles (level, status, access_tier);

create index if not exists idx_practice_sets_level_status_tier
  on public.practice_sets (level, status, access_tier);

create index if not exists idx_vocabulary_examples_vocabulary_order
  on public.vocabulary_examples (vocabulary_id, example_order);

create index if not exists idx_grammar_examples_grammar_order
  on public.grammar_examples (grammar_id, example_order);

create index if not exists idx_article_sentences_article_order
  on public.article_sentences (article_id, sentence_order);

create index if not exists idx_article_vocabulary_article_id
  on public.article_vocabulary (article_id);

create index if not exists idx_article_vocabulary_vocabulary_id
  on public.article_vocabulary (vocabulary_id);

create index if not exists idx_article_grammar_article_id
  on public.article_grammar (article_id);

create index if not exists idx_article_grammar_grammar_id
  on public.article_grammar (grammar_id);

create index if not exists idx_questions_practice_set_order
  on public.questions (practice_set_id, sort_order);

create index if not exists idx_questions_source_article_id
  on public.questions (source_article_id);

create index if not exists idx_questions_source_vocabulary_id
  on public.questions (source_vocabulary_id);

create index if not exists idx_questions_source_grammar_id
  on public.questions (source_grammar_id);

create index if not exists idx_question_options_question_order
  on public.question_options (question_id, option_order);

create index if not exists idx_wrong_answers_user_last_wrong
  on public.wrong_answers (user_id, last_wrong_at desc);

create index if not exists idx_wrong_answers_question_id
  on public.wrong_answers (question_id);

create index if not exists idx_user_vocabulary_user_next_review
  on public.user_vocabulary (user_id, next_review_at);

create index if not exists idx_user_grammar_user_next_review
  on public.user_grammar (user_id, next_review_at);

create index if not exists idx_user_bookmarks_user_created
  on public.user_bookmarks (user_id, created_at desc);

create index if not exists idx_user_progress_user_created
  on public.user_progress (user_id, created_at desc);

create index if not exists idx_study_plans_user_status_level
  on public.study_plans (user_id, status, target_level);

create index if not exists idx_study_sessions_user_started
  on public.study_sessions (user_id, started_at desc);

create index if not exists idx_study_sessions_plan_started
  on public.study_sessions (study_plan_id, started_at desc);

create index if not exists idx_subscriptions_user_tier_status
  on public.subscriptions (user_id, tier, status);

create unique index if not exists idx_subscriptions_provider_subscription_id
  on public.subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;

create unique index if not exists idx_user_bookmarks_user_vocabulary
  on public.user_bookmarks (user_id, vocabulary_id)
  where vocabulary_id is not null;

create unique index if not exists idx_user_bookmarks_user_grammar
  on public.user_bookmarks (user_id, grammar_id)
  where grammar_id is not null;

create unique index if not exists idx_user_bookmarks_user_article
  on public.user_bookmarks (user_id, article_id)
  where article_id is not null;

create unique index if not exists idx_user_bookmarks_user_practice_set
  on public.user_bookmarks (user_id, practice_set_id)
  where practice_set_id is not null;

create unique index if not exists idx_user_progress_user_vocabulary
  on public.user_progress (user_id, vocabulary_id)
  where vocabulary_id is not null;

create unique index if not exists idx_user_progress_user_grammar
  on public.user_progress (user_id, grammar_id)
  where grammar_id is not null;

create unique index if not exists idx_user_progress_user_article
  on public.user_progress (user_id, article_id)
  where article_id is not null;

create unique index if not exists idx_user_progress_user_practice_set
  on public.user_progress (user_id, practice_set_id)
  where practice_set_id is not null;

create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger set_updated_at_vocabulary
before update on public.vocabulary
for each row execute function public.touch_updated_at();

create trigger set_updated_at_vocabulary_examples
before update on public.vocabulary_examples
for each row execute function public.touch_updated_at();

create trigger set_updated_at_grammar
before update on public.grammar
for each row execute function public.touch_updated_at();

create trigger set_updated_at_grammar_examples
before update on public.grammar_examples
for each row execute function public.touch_updated_at();

create trigger set_updated_at_articles
before update on public.articles
for each row execute function public.touch_updated_at();

create trigger set_updated_at_article_sentences
before update on public.article_sentences
for each row execute function public.touch_updated_at();

create trigger set_updated_at_article_vocabulary
before update on public.article_vocabulary
for each row execute function public.touch_updated_at();

create trigger set_updated_at_article_grammar
before update on public.article_grammar
for each row execute function public.touch_updated_at();

create trigger set_updated_at_practice_sets
before update on public.practice_sets
for each row execute function public.touch_updated_at();

create trigger set_updated_at_questions
before update on public.questions
for each row execute function public.touch_updated_at();

create trigger set_updated_at_question_options
before update on public.question_options
for each row execute function public.touch_updated_at();

create trigger set_updated_at_wrong_answers
before update on public.wrong_answers
for each row execute function public.touch_updated_at();

create trigger set_updated_at_user_vocabulary
before update on public.user_vocabulary
for each row execute function public.touch_updated_at();

create trigger set_updated_at_user_grammar
before update on public.user_grammar
for each row execute function public.touch_updated_at();

create trigger set_updated_at_user_bookmarks
before update on public.user_bookmarks
for each row execute function public.touch_updated_at();

create trigger set_updated_at_study_plans
before update on public.study_plans
for each row execute function public.touch_updated_at();

create trigger set_updated_at_subscriptions
before update on public.subscriptions
for each row execute function public.touch_updated_at();

create trigger set_updated_at_study_sessions
before update on public.study_sessions
for each row execute function public.touch_updated_at();

create trigger set_updated_at_user_progress
before update on public.user_progress
for each row execute function public.touch_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

commit;
