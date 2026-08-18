begin;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'articles_level_access_tier_check'
      and conrelid = 'public.articles'::regclass
  ) then
    alter table public.articles
      add constraint articles_level_access_tier_check
      check (
        level in ('N5'::public.jlpt_level, 'N4'::public.jlpt_level, 'N3'::public.jlpt_level)
        or access_tier = 'pro'::public.access_tier
      );
  end if;
end $$;

create or replace view public.subscription_access
with (security_invoker = true)
as
select
  s.user_id,
  s.tier as subscription,
  s.status as subscription_status,
  coalesce(s.current_period_start, s.started_at) as subscription_start,
  s.current_period_end as subscription_end,
  s.provider,
  s.provider_customer_id,
  s.provider_subscription_id,
  s.cancel_at_period_end,
  s.started_at,
  s.created_at,
  s.updated_at
from public.subscriptions s;

grant select on public.subscription_access to authenticated, service_role;

create or replace function public.user_has_pro_access()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.subscription_access s
    where s.user_id = auth.uid()
      and s.subscription = 'pro'
      and s.subscription_status in ('active', 'trialing')
      and (s.subscription_end is null or s.subscription_end >= now())
  );
$$;

revoke all on function public.user_has_pro_access() from public;
grant execute on function public.user_has_pro_access() to anon, authenticated, service_role;

create or replace function public.can_access_feature(feature_name text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when feature_name in ('wrong_answers', 'learning_records', 'study_plan') then public.user_has_pro_access()
    else false
  end;
$$;

revoke all on function public.can_access_feature(text) from public;
grant execute on function public.can_access_feature(text) to anon, authenticated, service_role;

create or replace function public.can_access_resource(
  resource_kind text,
  resource_level public.jlpt_level default null,
  required_tier public.access_tier default 'free',
  feature_name text default null
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when resource_kind = 'feature' then public.can_access_feature(feature_name)
    when resource_kind = 'content' then
      case
        when required_tier = 'pro' then public.user_has_pro_access()
        when resource_level in ('N5'::public.jlpt_level, 'N4'::public.jlpt_level, 'N3'::public.jlpt_level) then true
        else public.user_has_pro_access()
      end
    when resource_kind = 'subscription' then auth.uid() is not null
    else false
  end;
$$;

revoke all on function public.can_access_resource(text, public.jlpt_level, public.access_tier, text) from public;
grant execute on function public.can_access_resource(text, public.jlpt_level, public.access_tier, text) to anon, authenticated, service_role;

create or replace function public.can_access_tier(required_tier public.access_tier)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select required_tier = 'free'::public.access_tier or public.user_has_pro_access();
$$;

revoke all on function public.can_access_tier(public.access_tier) from public;
grant execute on function public.can_access_tier(public.access_tier) to anon, authenticated, service_role;

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
  select public.can_access_resource('content', target_level, required_tier, null);
$$;

revoke all on function public.can_access_vocabulary_level(public.jlpt_level, public.access_tier) from public;
grant execute on function public.can_access_vocabulary_level(public.jlpt_level, public.access_tier) to anon, authenticated, service_role;

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
  select public.can_access_resource('content', target_level, required_tier, null);
$$;

revoke all on function public.can_access_grammar_level(public.jlpt_level, public.access_tier) from public;
grant execute on function public.can_access_grammar_level(public.jlpt_level, public.access_tier) to anon, authenticated, service_role;

create or replace function public.can_access_article_level(
  target_level public.jlpt_level,
  required_tier public.access_tier
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.can_access_resource('content', target_level, required_tier, null);
$$;

revoke all on function public.can_access_article_level(public.jlpt_level, public.access_tier) from public;
grant execute on function public.can_access_article_level(public.jlpt_level, public.access_tier) to anon, authenticated, service_role;

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
  select public.can_access_resource('content', target_level, required_tier, null);
$$;

revoke all on function public.can_access_practice_set_level(public.jlpt_level, public.access_tier) from public;
grant execute on function public.can_access_practice_set_level(public.jlpt_level, public.access_tier) to anon, authenticated, service_role;

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
  select public.can_access_resource('content', target_level, required_tier, null);
$$;

revoke all on function public.can_access_jlpt_level(public.jlpt_level, public.access_tier) from public;
grant execute on function public.can_access_jlpt_level(public.jlpt_level, public.access_tier) to anon, authenticated, service_role;

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
            and public.can_access_article_level(a.level, a.access_tier)
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
grant execute on function public.can_access_question(uuid) to anon, authenticated, service_role;

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
          and public.can_access_article_level(a.level, a.access_tier)
      )
    when target_type = 'practice_set'::public.content_target_type then
      public.can_access_practice_set(target_practice_set_id)
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

drop policy if exists "articles_select_accessible" on public.articles;
create policy "articles_select_accessible"
on public.articles
for select
to anon, authenticated
using (
  status = 'published'
  and public.can_access_article_level(level, access_tier)
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
      and public.can_access_article_level(a.level, a.access_tier)
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
      and public.can_access_article_level(a.level, a.access_tier)
  )
  and exists (
    select 1
    from public.vocabulary v
    where v.id = vocabulary_id
      and v.status = 'published'
      and public.can_access_vocabulary_level(v.level, v.access_tier)
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
      and public.can_access_article_level(a.level, a.access_tier)
  )
  and exists (
    select 1
    from public.grammar g
    where g.id = grammar_id
      and g.status = 'published'
      and public.can_access_grammar_level(g.level, g.access_tier)
  )
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
using (auth.uid() = user_id and public.can_access_feature('wrong_answers'));

create policy "wrong_answers_insert_accessible"
on public.wrong_answers
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.can_access_feature('wrong_answers')
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
using (auth.uid() = user_id and public.can_access_feature('wrong_answers'))
with check (
  auth.uid() = user_id
  and public.can_access_feature('wrong_answers')
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
using (auth.uid() = user_id and public.can_access_feature('wrong_answers'));

drop policy if exists "study_sessions_own_rows" on public.study_sessions;
drop policy if exists "study_sessions_select_own" on public.study_sessions;
drop policy if exists "study_sessions_insert_own" on public.study_sessions;
drop policy if exists "study_sessions_update_own" on public.study_sessions;
drop policy if exists "study_sessions_delete_own" on public.study_sessions;

create policy "study_sessions_select_own"
on public.study_sessions
for select
to authenticated
using (auth.uid() = user_id and public.can_access_feature('learning_records'));

create policy "study_sessions_insert_own"
on public.study_sessions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.can_access_feature('learning_records')
  and (
    practice_set_id is null
    or public.can_access_practice_set(practice_set_id)
  )
  and (
    study_plan_id is null
    or exists (
      select 1
      from public.study_plans sp
      where sp.id = study_plan_id
        and sp.user_id = auth.uid()
    )
  )
);

create policy "study_sessions_update_own"
on public.study_sessions
for update
to authenticated
using (auth.uid() = user_id and public.can_access_feature('learning_records'))
with check (
  auth.uid() = user_id
  and public.can_access_feature('learning_records')
  and (
    practice_set_id is null
    or public.can_access_practice_set(practice_set_id)
  )
  and (
    study_plan_id is null
    or exists (
      select 1
      from public.study_plans sp
      where sp.id = study_plan_id
        and sp.user_id = auth.uid()
    )
  )
);

create policy "study_sessions_delete_own"
on public.study_sessions
for delete
to authenticated
using (auth.uid() = user_id and public.can_access_feature('learning_records'));

drop policy if exists "study_plans_own_rows" on public.study_plans;
drop policy if exists "study_plans_select_own" on public.study_plans;
drop policy if exists "study_plans_insert_own" on public.study_plans;
drop policy if exists "study_plans_update_own" on public.study_plans;
drop policy if exists "study_plans_delete_own" on public.study_plans;

create policy "study_plans_select_own"
on public.study_plans
for select
to authenticated
using (auth.uid() = user_id and public.can_access_feature('study_plan'));

create policy "study_plans_insert_own"
on public.study_plans
for insert
to authenticated
with check (auth.uid() = user_id and public.can_access_feature('study_plan'));

create policy "study_plans_update_own"
on public.study_plans
for update
to authenticated
using (auth.uid() = user_id and public.can_access_feature('study_plan'))
with check (auth.uid() = user_id and public.can_access_feature('study_plan'));

create policy "study_plans_delete_own"
on public.study_plans
for delete
to authenticated
using (auth.uid() = user_id and public.can_access_feature('study_plan'));

drop policy if exists "daily_study_tasks_own_rows" on public.daily_study_tasks;
drop policy if exists "daily_study_tasks_select_own" on public.daily_study_tasks;
drop policy if exists "daily_study_tasks_insert_own" on public.daily_study_tasks;
drop policy if exists "daily_study_tasks_update_own" on public.daily_study_tasks;
drop policy if exists "daily_study_tasks_delete_own" on public.daily_study_tasks;

create policy "daily_study_tasks_select_own"
on public.daily_study_tasks
for select
to authenticated
using (auth.uid() = user_id and public.can_access_feature('study_plan'));

create policy "daily_study_tasks_insert_own"
on public.daily_study_tasks
for insert
to authenticated
with check (auth.uid() = user_id and public.can_access_feature('study_plan'));

create policy "daily_study_tasks_update_own"
on public.daily_study_tasks
for update
to authenticated
using (auth.uid() = user_id and public.can_access_feature('study_plan'))
with check (auth.uid() = user_id and public.can_access_feature('study_plan'));

create policy "daily_study_tasks_delete_own"
on public.daily_study_tasks
for delete
to authenticated
using (auth.uid() = user_id and public.can_access_feature('study_plan'));

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
  allow_wrong_answers boolean := public.can_access_feature('wrong_answers');
  allow_learning_records boolean := public.can_access_feature('learning_records');
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

      if allow_wrong_answers then
        update public.wrong_answers
        set resolved_at = now(),
            updated_at = now()
        where user_id = current_user_id
          and question_id = question_row.id
          and resolved_at is null;
      end if;
    elsif allow_wrong_answers then
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

  if allow_learning_records then
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
  end if;

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

commit;
