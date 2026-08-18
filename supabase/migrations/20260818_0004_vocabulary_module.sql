alter table public.vocabulary
  add column if not exists reading text,
  add column if not exists pitch_accent text,
  add column if not exists category text not null default 'general',
  add column if not exists synonyms text[] not null default '{}'::text[],
  add column if not exists antonyms text[] not null default '{}'::text[];

update public.vocabulary
set reading = kana
where reading is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vocabulary_reading_not_blank'
      and conrelid = 'public.vocabulary'::regclass
  ) then
    alter table public.vocabulary
      add constraint vocabulary_reading_not_blank
      check (reading is null or btrim(reading) <> '');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'vocabulary_category_not_blank'
      and conrelid = 'public.vocabulary'::regclass
  ) then
    alter table public.vocabulary
      add constraint vocabulary_category_not_blank
      check (btrim(category) <> '');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'vocabulary_level_access_tier_check'
      and conrelid = 'public.vocabulary'::regclass
  ) then
    alter table public.vocabulary
      add constraint vocabulary_level_access_tier_check
      check (
        level in ('N5'::public.jlpt_level, 'N4'::public.jlpt_level, 'N3'::public.jlpt_level)
        or access_tier = 'pro'::public.access_tier
      );
  end if;
end $$;

create index if not exists idx_vocabulary_level_category_status_tier
  on public.vocabulary (level, category, status, access_tier);

create index if not exists idx_vocabulary_category_status
  on public.vocabulary (category, status);

create index if not exists idx_vocabulary_word_lower
  on public.vocabulary (lower(word));

create index if not exists idx_vocabulary_reading_lower
  on public.vocabulary (lower(coalesce(reading, kana)));

create index if not exists idx_vocabulary_search_simple
  on public.vocabulary
  using gin (
    to_tsvector(
      'simple',
      coalesce(word, '') || ' ' ||
      coalesce(reading, '') || ' ' ||
      coalesce(kana, '') || ' ' ||
      coalesce(meaning, '') || ' ' ||
      coalesce(part_of_speech, '') || ' ' ||
      coalesce(category, '')
    )
  );

create index if not exists idx_vocabulary_synonyms_gin
  on public.vocabulary using gin (synonyms);

create index if not exists idx_vocabulary_antonyms_gin
  on public.vocabulary using gin (antonyms);

create or replace function public.can_access_vocabulary_level(
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

revoke all on function public.can_access_vocabulary_level(public.jlpt_level, public.access_tier) from public;
grant execute on function public.can_access_vocabulary_level(public.jlpt_level, public.access_tier) to anon, authenticated, service_role;

create or replace function public.can_access_vocabulary(target_vocabulary_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.vocabulary v
    where v.id = target_vocabulary_id
      and v.status = 'published'
      and public.can_access_vocabulary_level(v.level, v.access_tier)
  );
$$;

revoke all on function public.can_access_vocabulary(uuid) from public;
grant execute on function public.can_access_vocabulary(uuid) to anon, authenticated, service_role;

drop policy if exists "vocabulary_select_accessible" on public.vocabulary;
create policy "vocabulary_select_accessible"
on public.vocabulary
for select
to anon, authenticated
using (
  status = 'published'
  and public.can_access_vocabulary_level(level, access_tier)
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
      and public.can_access_vocabulary_level(v.level, v.access_tier)
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
  and public.can_access_vocabulary(vocabulary_id)
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
        or public.can_access_vocabulary(q.source_vocabulary_id)
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
drop policy if exists "user_vocabulary_select_own" on public.user_vocabulary;
drop policy if exists "user_vocabulary_insert_accessible" on public.user_vocabulary;
drop policy if exists "user_vocabulary_update_accessible" on public.user_vocabulary;
drop policy if exists "user_vocabulary_delete_own" on public.user_vocabulary;

create policy "user_vocabulary_select_own"
on public.user_vocabulary
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_vocabulary_insert_accessible"
on public.user_vocabulary
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.can_access_vocabulary(vocabulary_id)
);

create policy "user_vocabulary_update_accessible"
on public.user_vocabulary
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and public.can_access_vocabulary(vocabulary_id)
);

create policy "user_vocabulary_delete_own"
on public.user_vocabulary
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
      exists (
        select 1
        from public.vocabulary v
        where v.id = target_vocabulary_id
          and v.status = 'published'
          and public.can_access_vocabulary_level(v.level, v.access_tier)
      )
    when target_type = 'grammar'::public.content_target_type then
      exists (
        select 1
        from public.grammar g
        where g.id = target_grammar_id
          and g.status = 'published'
          and public.can_access_tier(g.access_tier)
      )
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

drop policy if exists "user_bookmarks_own_rows" on public.user_bookmarks;
drop policy if exists "user_bookmarks_select_own" on public.user_bookmarks;
drop policy if exists "user_bookmarks_insert_accessible" on public.user_bookmarks;
drop policy if exists "user_bookmarks_update_accessible" on public.user_bookmarks;
drop policy if exists "user_bookmarks_delete_own" on public.user_bookmarks;

create policy "user_bookmarks_select_own"
on public.user_bookmarks
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_bookmarks_insert_accessible"
on public.user_bookmarks
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.can_bookmark_target(content_type, vocabulary_id, grammar_id, article_id, practice_set_id)
);

create policy "user_bookmarks_update_accessible"
on public.user_bookmarks
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and public.can_bookmark_target(content_type, vocabulary_id, grammar_id, article_id, practice_set_id)
);

create policy "user_bookmarks_delete_own"
on public.user_bookmarks
for delete
to authenticated
using (auth.uid() = user_id);
