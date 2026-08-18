-- Run this after applying migrations and seed data.
-- It audits the main foreign keys, indexes, and RLS policies.

select
  conrelid::regclass as table_name,
  conname as constraint_name,
  confrelid::regclass as references_table,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where contype = 'f'
  and connamespace = 'public'::regnamespace
order by table_name::text, constraint_name;

select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and (
    tablename like 'user_%'
    or tablename in (
      'profiles',
      'vocabulary',
      'grammar',
      'articles',
      'practice_sets',
      'questions',
      'wrong_answers',
      'subscriptions',
      'daily_study_tasks',
      'study_sessions',
      'study_plans'
    )
  )
order by tablename, indexname;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select
  relname as table_name,
  relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
order by relname;

select
  schemaname,
  viewname,
  definition
from pg_views
where schemaname = 'public'
  and viewname = 'subscription_access';

select
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as returns
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'can_access_resource',
    'can_access_feature',
    'can_access_tier',
    'can_access_vocabulary_level',
    'can_access_grammar_level',
    'can_access_article_level',
    'can_access_practice_set_level',
    'can_access_jlpt_level',
    'can_access_question',
    'user_has_pro_access'
  )
order by proname;
