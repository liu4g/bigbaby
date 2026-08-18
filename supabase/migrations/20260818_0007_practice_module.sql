alter type public.question_type add value if not exists 'multiple_choice';
alter type public.question_type add value if not exists 'fill_blank';
alter type public.question_type add value if not exists 'reading_comprehension';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'practice_sets_level_access_tier_check'
      and conrelid = 'public.practice_sets'::regclass
  ) then
    alter table public.practice_sets
      add constraint practice_sets_level_access_tier_check
      check (
        level in ('N5'::public.jlpt_level, 'N4'::public.jlpt_level, 'N3'::public.jlpt_level)
        or access_tier = 'pro'::public.access_tier
      );
  end if;
end $$;

drop index if exists public.question_options_one_correct_idx;
create index if not exists idx_question_options_question_correct
  on public.question_options (question_id, is_correct);

create index if not exists idx_questions_set_status_order
  on public.questions (practice_set_id, status, sort_order);

create index if not exists idx_questions_type_level_source
  on public.questions (question_type, difficulty, source_type);

create or replace function public.can_access_practice_set_level(
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

revoke all on function public.can_access_practice_set_level(public.jlpt_level, public.access_tier) from public;
grant execute on function public.can_access_practice_set_level(public.jlpt_level, public.access_tier)
  to anon, authenticated, service_role;

create or replace function public.can_access_practice_set(target_practice_set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.practice_sets ps
    where ps.id = target_practice_set_id
      and ps.status = 'published'
      and public.can_access_practice_set_level(ps.level, ps.access_tier)
  );
$$;

revoke all on function public.can_access_practice_set(uuid) from public;
grant execute on function public.can_access_practice_set(uuid)
  to anon, authenticated, service_role;

create or replace function public.can_access_question(target_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.questions q
    where q.id = target_question_id
      and q.status = 'published'
      and public.can_access_practice_set(q.practice_set_id)
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
  );
$$;

revoke all on function public.can_access_question(uuid) from public;
grant execute on function public.can_access_question(uuid)
  to anon, authenticated, service_role;

drop policy if exists "practice_sets_select_accessible" on public.practice_sets;
create policy "practice_sets_select_accessible"
on public.practice_sets
for select
to anon, authenticated
using (public.can_access_practice_set_level(level, access_tier) and status = 'published');

drop policy if exists "questions_select_accessible_parent" on public.questions;
create policy "questions_select_accessible_parent"
on public.questions
for select
to anon, authenticated
using (public.can_access_question(id));

drop policy if exists "question_options_select_accessible_parent" on public.question_options;
create policy "question_options_select_accessible_parent"
on public.question_options
for select
to anon, authenticated
using (
  public.can_access_question(question_id)
);

drop policy if exists "wrong_answers_own_rows" on public.wrong_answers;
drop policy if exists "wrong_answers_select_own" on public.wrong_answers;
drop policy if exists "wrong_answers_insert_accessible" on public.wrong_answers;
drop policy if exists "wrong_answers_update_accessible" on public.wrong_answers;
drop policy if exists "wrong_answers_delete_own" on public.wrong_answers;

create policy "wrong_answers_select_own"
on public.wrong_answers
for select
to authenticated
using (
  auth.uid() = user_id
  and public.can_access_question(question_id)
);

create policy "wrong_answers_insert_accessible"
on public.wrong_answers
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.can_access_question(question_id)
  and (
    selected_option_id is null
    or exists (
      select 1
      from public.question_options qo
      where qo.id = selected_option_id
        and qo.question_id = question_id
    )
  )
);

create policy "wrong_answers_update_accessible"
on public.wrong_answers
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and public.can_access_question(question_id)
  and (
    selected_option_id is null
    or exists (
      select 1
      from public.question_options qo
      where qo.id = selected_option_id
        and qo.question_id = question_id
    )
  )
);

create policy "wrong_answers_delete_own"
on public.wrong_answers
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.can_access_practice_content(
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
      public.can_access_practice_set(target_practice_set_id)
    else false
  end;
$$;

revoke all on function public.can_access_practice_content(
  public.content_target_type,
  uuid,
  uuid,
  uuid,
  uuid
) from public;

grant execute on function public.can_access_practice_content(
  public.content_target_type,
  uuid,
  uuid,
  uuid,
  uuid
) to authenticated, service_role;

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
  select public.can_access_practice_content(
    target_type,
    target_vocabulary_id,
    target_grammar_id,
    target_article_id,
    target_practice_set_id
  );
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

drop policy if exists "user_progress_own_rows" on public.user_progress;
drop policy if exists "user_progress_select_own" on public.user_progress;
drop policy if exists "user_progress_insert_accessible" on public.user_progress;
drop policy if exists "user_progress_update_accessible" on public.user_progress;
drop policy if exists "user_progress_delete_own" on public.user_progress;

create policy "user_progress_select_own"
on public.user_progress
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_progress_insert_accessible"
on public.user_progress
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.can_access_practice_content(
    content_type,
    vocabulary_id,
    grammar_id,
    article_id,
    practice_set_id
  )
);

create policy "user_progress_update_accessible"
on public.user_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and public.can_access_practice_content(
    content_type,
    vocabulary_id,
    grammar_id,
    article_id,
    practice_set_id
  )
);

create policy "user_progress_delete_own"
on public.user_progress
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "study_sessions_own_rows" on public.study_sessions;
drop policy if exists "study_sessions_select_own" on public.study_sessions;
drop policy if exists "study_sessions_insert_own" on public.study_sessions;
drop policy if exists "study_sessions_update_own" on public.study_sessions;
drop policy if exists "study_sessions_delete_own" on public.study_sessions;

create policy "study_sessions_select_own"
on public.study_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "study_sessions_insert_own"
on public.study_sessions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    practice_set_id is null
    or public.can_access_practice_set(practice_set_id)
  )
);

create policy "study_sessions_update_own"
on public.study_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    practice_set_id is null
    or public.can_access_practice_set(practice_set_id)
  )
);

create policy "study_sessions_delete_own"
on public.study_sessions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "subscriptions_own_rows" on public.subscriptions;
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

revoke insert, update, delete on table public.subscriptions from authenticated;

revoke select on table public.questions from anon, authenticated;
grant select (
  id,
  practice_set_id,
  sort_order,
  question_type,
  prompt,
  hint,
  explanation,
  difficulty,
  source_article_id,
  source_vocabulary_id,
  source_grammar_id,
  source_type,
  status,
  generation_metadata,
  created_at,
  updated_at
) on table public.questions to anon, authenticated;

revoke select on table public.question_options from anon, authenticated;
grant select (
  id,
  question_id,
  option_order,
  option_label,
  option_text,
  explanation,
  created_at,
  updated_at
) on table public.question_options to anon, authenticated;

create or replace function public.submit_practice_answers(
  target_practice_slug text,
  responses jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  target_set public.practice_sets%rowtype;
  question_row record;
  response_row jsonb;
  selected_json jsonb;
  selected_ids text[];
  selected_labels text[];
  correct_ids text[];
  correct_labels text[];
  correct_texts text[];
  selected_text text;
  selected_option uuid;
  question_result jsonb;
  question_results jsonb := '[]'::jsonb;
  total_count integer := 0;
  correct_count integer := 0;
  is_answer_correct boolean;
  accuracy numeric(5, 2);
  wrong_note text;
  recommendation text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if target_practice_slug is null or btrim(target_practice_slug) = '' then
    raise exception 'Practice set is required' using errcode = '22023';
  end if;

  select *
  into target_set
  from public.practice_sets
  where slug = btrim(target_practice_slug)
    and status = 'published';

  if not found or not public.can_access_practice_set(target_set.id) then
    raise exception 'Practice set is not accessible' using errcode = '42501';
  end if;

  if responses is null or jsonb_typeof(responses) <> 'object' then
    responses := '{}'::jsonb;
  end if;

  recommendation := case target_set.kind::text
    when 'vocabulary' then '回到单词模块复习同等级高频词。'
    when 'grammar' then '回到语法模块复习相关句型和接续。'
    when 'reading' then '回到文章模块重读原文，整理上下文线索。'
    when 'jlpt_mock' then '进入 JLPT 专项，重新练习同等级原创模拟题。'
    else '按错题类型分别复习单词、语法和文章。'
  end;

  for question_row in
    select
      q.id,
      q.question_type,
      q.prompt,
      q.explanation,
      q.answer_key,
      q.difficulty,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', qo.id,
            'label', qo.option_label,
            'text', qo.option_text,
            'isCorrect', qo.is_correct,
            'order', qo.option_order
          )
          order by qo.option_order
        ) filter (where qo.id is not null),
        '[]'::jsonb
      ) as options
    from public.questions q
    left join public.question_options qo on qo.question_id = q.id
    where q.practice_set_id = target_set.id
      and q.status = 'published'
    group by q.id
    order by q.sort_order
  loop
    total_count := total_count + 1;
    response_row := coalesce(responses -> question_row.id::text, '{}'::jsonb);
    selected_json := response_row -> 'selectedOptionIds';

    if jsonb_typeof(selected_json) is distinct from 'array' then
      selected_json := '[]'::jsonb;
    end if;

    select coalesce(array_agg(value order by value), '{}'::text[])
    into selected_ids
    from jsonb_array_elements_text(selected_json) as values(value)
    where value ~* '^[0-9a-f-]{36}$'
      and exists (
        select 1
        from public.question_options qo
        where qo.id = value::uuid
          and qo.question_id = question_row.id
      );

    select coalesce(array_agg(qo.option_label order by qo.option_order), '{}'::text[]),
           coalesce(array_agg(qo.id::text order by qo.id::text), '{}'::text[])
    into correct_labels, correct_ids
    from public.question_options qo
    where qo.question_id = question_row.id
      and qo.is_correct;

    select coalesce(array_agg(qo.option_label order by qo.option_order), '{}'::text[])
    into selected_labels
    from public.question_options qo
    where qo.question_id = question_row.id
      and qo.id::text = any(selected_ids);

    selected_text := btrim(coalesce(response_row ->> 'text', ''));
    select coalesce(array_agg(lower(btrim(value))), '{}'::text[])
    into correct_texts
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(question_row.answer_key -> 'correct_text') = 'array'
          then question_row.answer_key -> 'correct_text'
        else '[]'::jsonb
      end
    ) as texts(value);

    if question_row.question_type::text in ('fill_blank', 'text_input') then
      is_answer_correct := lower(selected_text) = any(correct_texts);
    else
      is_answer_correct := selected_ids = correct_ids;
    end if;

    if is_answer_correct then
      correct_count := correct_count + 1;
      update public.wrong_answers
      set resolved_at = now(),
          updated_at = now()
      where user_id = current_user_id
        and question_id = question_row.id
        and resolved_at is null;
    else
      selected_option := null;
      select qo.id
      into selected_option
      from public.question_options qo
      where qo.question_id = question_row.id
        and qo.id::text = any(selected_ids)
      order by qo.option_order
      limit 1;

      wrong_note := case
        when selected_text <> '' then 'text=' || selected_text
        else 'options=' || coalesce(array_to_string(selected_labels, ', '), '')
      end;

      insert into public.wrong_answers (
        user_id,
        question_id,
        selected_option_id,
        wrong_count,
        last_wrong_at,
        resolved_at,
        notes
      )
      values (
        current_user_id,
        question_row.id,
        selected_option,
        1,
        now(),
        null,
        wrong_note
      )
      on conflict (user_id, question_id)
      do update set
        selected_option_id = excluded.selected_option_id,
        wrong_count = public.wrong_answers.wrong_count + 1,
        last_wrong_at = now(),
        resolved_at = null,
        notes = excluded.notes,
        updated_at = now();
    end if;

    question_result := jsonb_build_object(
      'questionId', question_row.id,
      'question', question_row.prompt,
      'questionType', question_row.question_type,
      'difficulty', question_row.difficulty,
      'isCorrect', is_answer_correct,
      'selectedLabels', to_jsonb(selected_labels),
      'selectedText', selected_text,
      'correctLabels', to_jsonb(correct_labels),
      'correctTexts', to_jsonb(correct_texts),
      'explanation', coalesce(question_row.explanation, '请结合题干和选项重新整理判断依据。'),
      'reviewSuggestion', recommendation
    );

    question_results := question_results || jsonb_build_array(question_result);
  end loop;

  if total_count = 0 then
    raise exception 'Practice set has no published questions' using errcode = '22023';
  end if;

  accuracy := round((correct_count::numeric / total_count::numeric) * 100, 2);

  insert into public.study_sessions (
    user_id,
    practice_set_id,
    session_type,
    target_level,
    started_at,
    ended_at,
    duration_seconds,
    items_completed,
    correct_count,
    incorrect_count,
    notes,
    session_summary
  )
  values (
    current_user_id,
    target_set.id,
    'practice',
    target_set.level,
    now(),
    now(),
    0,
    total_count,
    correct_count,
    total_count - correct_count,
    target_set.title,
    jsonb_build_object(
      'accuracy', accuracy,
      'kind', target_set.kind,
      'source', 'practice_submission'
    )
  );

  insert into public.user_progress (
    user_id,
    content_type,
    practice_set_id,
    status,
    mastery_score,
    review_stage,
    last_studied_at,
    next_review_at,
    completed_at
  )
  values (
    current_user_id,
    'practice_set',
    target_set.id,
    case when accuracy = 100 then 'completed'::public.progress_status else 'in_progress'::public.progress_status end,
    accuracy,
    case when accuracy >= 80 then 2 else 1 end,
    now(),
    case when accuracy < 100 then now() + interval '2 days' else now() + interval '7 days' end,
    case when accuracy = 100 then now() else null end
  )
  on conflict (user_id, practice_set_id) where practice_set_id is not null
  do update set
    status = excluded.status,
    mastery_score = excluded.mastery_score,
    review_stage = excluded.review_stage,
    last_studied_at = excluded.last_studied_at,
    next_review_at = excluded.next_review_at,
    completed_at = excluded.completed_at,
    updated_at = now();

  return jsonb_build_object(
    'practiceSetId', target_set.id,
    'practiceSetTitle', target_set.title,
    'total', total_count,
    'correct', correct_count,
    'wrong', total_count - correct_count,
    'accuracy', accuracy,
    'recommendation', recommendation,
    'questions', question_results
  );
end;
$$;

revoke all on function public.submit_practice_answers(text, jsonb) from public;
grant execute on function public.submit_practice_answers(text, jsonb) to authenticated, service_role;
