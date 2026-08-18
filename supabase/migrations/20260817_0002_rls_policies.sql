begin;

grant usage on schema public to anon, authenticated, service_role;

grant usage on type
  public.user_role,
  public.jlpt_level,
  public.access_tier,
  public.content_status,
  public.source_type,
  public.practice_kind,
  public.question_type,
  public.session_type,
  public.plan_tier,
  public.subscription_status,
  public.study_plan_kind,
  public.study_plan_status,
  public.progress_status,
  public.content_target_type
to anon, authenticated, service_role;

revoke all on function public.touch_updated_at() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.user_has_pro_access() from public;
revoke all on function public.can_access_tier(public.access_tier) from public;

grant execute on function public.user_has_pro_access() to anon, authenticated, service_role;
grant execute on function public.can_access_tier(public.access_tier) to anon, authenticated, service_role;

grant select on table
  public.vocabulary,
  public.vocabulary_examples,
  public.grammar,
  public.grammar_examples,
  public.articles,
  public.article_sentences,
  public.article_vocabulary,
  public.article_grammar,
  public.practice_sets,
  public.questions,
  public.question_options
to anon, authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.wrong_answers,
  public.user_vocabulary,
  public.user_grammar,
  public.user_bookmarks,
  public.study_sessions,
  public.user_progress,
  public.study_plans,
  public.subscriptions
to authenticated;

grant all privileges on table
  public.profiles,
  public.vocabulary,
  public.vocabulary_examples,
  public.grammar,
  public.grammar_examples,
  public.articles,
  public.article_sentences,
  public.article_vocabulary,
  public.article_grammar,
  public.practice_sets,
  public.questions,
  public.question_options,
  public.wrong_answers,
  public.user_vocabulary,
  public.user_grammar,
  public.user_bookmarks,
  public.study_sessions,
  public.user_progress,
  public.study_plans,
  public.subscriptions
to service_role;

alter table public.profiles enable row level security;
alter table public.vocabulary enable row level security;
alter table public.vocabulary_examples enable row level security;
alter table public.grammar enable row level security;
alter table public.grammar_examples enable row level security;
alter table public.articles enable row level security;
alter table public.article_sentences enable row level security;
alter table public.article_vocabulary enable row level security;
alter table public.article_grammar enable row level security;
alter table public.practice_sets enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.wrong_answers enable row level security;
alter table public.user_vocabulary enable row level security;
alter table public.user_grammar enable row level security;
alter table public.user_bookmarks enable row level security;
alter table public.study_sessions enable row level security;
alter table public.user_progress enable row level security;
alter table public.study_plans enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "profiles_own_rows" on public.profiles;
create policy "profiles_own_rows"
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "vocabulary_select_accessible" on public.vocabulary;
create policy "vocabulary_select_accessible"
on public.vocabulary
for select
to anon, authenticated
using (
  status = 'published'
  and public.can_access_tier(access_tier)
);

drop policy if exists "vocabulary_examples_select_accessible_parent" on public.vocabulary_examples;
create policy "vocabulary_examples_select_accessible_parent"
on public.vocabulary_examples
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.vocabulary v
    where v.id = vocabulary_id
      and v.status = 'published'
      and public.can_access_tier(v.access_tier)
  )
);

drop policy if exists "grammar_select_accessible" on public.grammar;
create policy "grammar_select_accessible"
on public.grammar
for select
to anon, authenticated
using (
  status = 'published'
  and public.can_access_tier(access_tier)
);

drop policy if exists "grammar_examples_select_accessible_parent" on public.grammar_examples;
create policy "grammar_examples_select_accessible_parent"
on public.grammar_examples
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.grammar g
    where g.id = grammar_id
      and g.status = 'published'
      and public.can_access_tier(g.access_tier)
  )
);

drop policy if exists "articles_select_accessible" on public.articles;
create policy "articles_select_accessible"
on public.articles
for select
to anon, authenticated
using (
  status = 'published'
  and public.can_access_tier(access_tier)
);

drop policy if exists "article_sentences_select_accessible_parent" on public.article_sentences;
create policy "article_sentences_select_accessible_parent"
on public.article_sentences
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.articles a
    where a.id = article_id
      and a.status = 'published'
      and public.can_access_tier(a.access_tier)
  )
);

drop policy if exists "article_vocabulary_select_accessible_parents" on public.article_vocabulary;
create policy "article_vocabulary_select_accessible_parents"
on public.article_vocabulary
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.articles a
    where a.id = article_id
      and a.status = 'published'
      and public.can_access_tier(a.access_tier)
  )
  and exists (
    select 1
    from public.vocabulary v
    where v.id = vocabulary_id
      and v.status = 'published'
      and public.can_access_tier(v.access_tier)
  )
);

drop policy if exists "article_grammar_select_accessible_parents" on public.article_grammar;
create policy "article_grammar_select_accessible_parents"
on public.article_grammar
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.articles a
    where a.id = article_id
      and a.status = 'published'
      and public.can_access_tier(a.access_tier)
  )
  and exists (
    select 1
    from public.grammar g
    where g.id = grammar_id
      and g.status = 'published'
      and public.can_access_tier(g.access_tier)
  )
);

drop policy if exists "practice_sets_select_accessible" on public.practice_sets;
create policy "practice_sets_select_accessible"
on public.practice_sets
for select
to anon, authenticated
using (
  status = 'published'
  and public.can_access_tier(access_tier)
);

drop policy if exists "questions_select_accessible_parent" on public.questions;
create policy "questions_select_accessible_parent"
on public.questions
for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.practice_sets ps
    where ps.id = practice_set_id
      and ps.status = 'published'
      and public.can_access_tier(ps.access_tier)
  )
  and (
    source_article_id is null
    or exists (
      select 1
      from public.articles a
      where a.id = source_article_id
        and a.status = 'published'
        and public.can_access_tier(a.access_tier)
    )
  )
  and (
    source_vocabulary_id is null
    or exists (
      select 1
      from public.vocabulary v
      where v.id = source_vocabulary_id
        and v.status = 'published'
        and public.can_access_tier(v.access_tier)
    )
  )
  and (
    source_grammar_id is null
    or exists (
      select 1
      from public.grammar g
      where g.id = source_grammar_id
        and g.status = 'published'
        and public.can_access_tier(g.access_tier)
    )
  )
);

drop policy if exists "question_options_select_accessible_parent" on public.question_options;
create policy "question_options_select_accessible_parent"
on public.question_options
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.questions q
    join public.practice_sets ps on ps.id = q.practice_set_id
    where q.id = question_id
      and q.status = 'published'
      and ps.status = 'published'
      and public.can_access_tier(ps.access_tier)
      and (
        q.source_article_id is null
        or exists (
          select 1
          from public.articles a
          where a.id = q.source_article_id
            and a.status = 'published'
            and public.can_access_tier(a.access_tier)
        )
      )
      and (
        q.source_vocabulary_id is null
        or exists (
          select 1
          from public.vocabulary v
          where v.id = q.source_vocabulary_id
            and v.status = 'published'
            and public.can_access_tier(v.access_tier)
        )
      )
      and (
        q.source_grammar_id is null
        or exists (
          select 1
          from public.grammar g
          where g.id = q.source_grammar_id
            and g.status = 'published'
            and public.can_access_tier(g.access_tier)
        )
      )
  )
);

drop policy if exists "user_vocabulary_own_rows" on public.user_vocabulary;
drop policy if exists "wrong_answers_own_rows" on public.wrong_answers;
create policy "wrong_answers_own_rows"
on public.wrong_answers
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_vocabulary_own_rows"
on public.user_vocabulary
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_grammar_own_rows" on public.user_grammar;
create policy "user_grammar_own_rows"
on public.user_grammar
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_bookmarks_own_rows" on public.user_bookmarks;
create policy "user_bookmarks_own_rows"
on public.user_bookmarks
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "study_sessions_own_rows" on public.study_sessions;
create policy "study_sessions_own_rows"
on public.study_sessions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_progress_own_rows" on public.user_progress;
create policy "user_progress_own_rows"
on public.user_progress
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "study_plans_own_rows" on public.study_plans;
create policy "study_plans_own_rows"
on public.study_plans
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "subscriptions_own_rows" on public.subscriptions;
create policy "subscriptions_own_rows"
on public.subscriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
