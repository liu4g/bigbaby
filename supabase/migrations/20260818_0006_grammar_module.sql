alter table public.grammar
  add column if not exists similar_grammar text[] not null default '{}'::text[];

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'grammar_level_access_tier_check'
      and conrelid = 'public.grammar'::regclass
  ) then
    alter table public.grammar
      add constraint grammar_level_access_tier_check
      check (
        level in ('N5'::public.jlpt_level, 'N4'::public.jlpt_level, 'N3'::public.jlpt_level)
        or access_tier = 'pro'::public.access_tier
      );
  end if;
end $$;

create index if not exists idx_grammar_level_status_tier_title
  on public.grammar (level, status, access_tier, title);

create index if not exists idx_grammar_title_lower
  on public.grammar (lower(title));

create index if not exists idx_grammar_pattern_lower
  on public.grammar (lower(pattern));

create index if not exists idx_grammar_search_simple
  on public.grammar
  using gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(pattern, '') || ' ' ||
      coalesce(meaning, '') || ' ' ||
      coalesce(usage_notes, '') || ' ' ||
      coalesce(notes, '')
    )
  );

create index if not exists idx_grammar_similar_gin
  on public.grammar using gin (similar_grammar);

create or replace function public.can_access_grammar_level(
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

revoke all on function public.can_access_grammar_level(public.jlpt_level, public.access_tier) from public;
grant execute on function public.can_access_grammar_level(public.jlpt_level, public.access_tier) to anon, authenticated, service_role;

create or replace function public.can_access_grammar(target_grammar_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.grammar g
    where g.id = target_grammar_id
      and g.status = 'published'
      and public.can_access_grammar_level(g.level, g.access_tier)
  );
$$;

revoke all on function public.can_access_grammar(uuid) from public;
grant execute on function public.can_access_grammar(uuid) to anon, authenticated, service_role;

drop policy if exists "grammar_select_accessible" on public.grammar;
create policy "grammar_select_accessible"
on public.grammar
for select
to anon, authenticated
using (
  status = 'published'
  and public.can_access_grammar_level(level, access_tier)
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
      and public.can_access_grammar_level(g.level, g.access_tier)
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
  and public.can_access_grammar(grammar_id)
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
    or public.can_access_vocabulary(source_vocabulary_id)
  )
  and (
    source_grammar_id is null
    or public.can_access_grammar(source_grammar_id)
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
        or public.can_access_vocabulary(q.source_vocabulary_id)
      )
      and (
        q.source_grammar_id is null
        or public.can_access_grammar(q.source_grammar_id)
      )
  )
);

drop policy if exists "user_grammar_own_rows" on public.user_grammar;
drop policy if exists "user_grammar_select_own" on public.user_grammar;
drop policy if exists "user_grammar_insert_accessible" on public.user_grammar;
drop policy if exists "user_grammar_update_accessible" on public.user_grammar;
drop policy if exists "user_grammar_delete_own" on public.user_grammar;

create policy "user_grammar_select_own"
on public.user_grammar
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_grammar_insert_accessible"
on public.user_grammar
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.can_access_grammar(grammar_id)
);

create policy "user_grammar_update_accessible"
on public.user_grammar
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and public.can_access_grammar(grammar_id)
);

create policy "user_grammar_delete_own"
on public.user_grammar
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.can_bookmark_target(
  target_type public.content_target_type,
  target_vocabulary_id uuid,
  target_grammar_id uuid,
  target_article_id uuid,
  target_practice_set_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when target_type = 'vocabulary'::public.content_target_type then
      public.can_access_vocabulary(target_vocabulary_id)
    when target_type = 'grammar'::public.content_target_type then
      public.can_access_grammar(target_grammar_id)
    when target_type = 'article'::public.content_target_type then
      exists (
        select 1
        from public.articles a
        where a.id = target_article_id
          and a.status = 'published'
          and public.can_access_tier(a.access_tier)
      )
    when target_type = 'practice_set'::public.content_target_type then
      exists (
        select 1
        from public.practice_sets ps
        where ps.id = target_practice_set_id
          and ps.status = 'published'
          and public.can_access_tier(ps.access_tier)
      )
    else false
  end;
$$;

revoke all on function public.can_bookmark_target(
  public.content_target_type,
  uuid,
  uuid,
  uuid,
  uuid
) from public;

grant execute on function public.can_bookmark_target(
  public.content_target_type,
  uuid,
  uuid,
  uuid,
  uuid
) to authenticated, service_role;
