alter table public.profiles
  add column if not exists nickname text,
  add column if not exists jlpt_level public.jlpt_level not null default 'N5',
  add column if not exists target_jlpt_level public.jlpt_level not null default 'N3',
  add column if not exists daily_study_goal integer not null default 30,
  add column if not exists timezone text not null default 'Asia/Tokyo';

update public.profiles
set
  nickname = coalesce(nullif(btrim(nickname), ''), display_name),
  target_jlpt_level = target_level,
  daily_study_goal = study_goal_minutes
where nickname is null
   or target_jlpt_level is distinct from target_level
   or daily_study_goal is distinct from study_goal_minutes;

alter table public.profiles
  alter column nickname set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_nickname_not_blank'
  ) then
    alter table public.profiles
      add constraint profiles_nickname_not_blank check (btrim(nickname) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_daily_study_goal_range'
  ) then
    alter table public.profiles
      add constraint profiles_daily_study_goal_range check (daily_study_goal between 5 and 480);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_timezone_not_blank'
  ) then
    alter table public.profiles
      add constraint profiles_timezone_not_blank check (btrim(timezone) <> '');
  end if;
end;
$$;

create index if not exists profiles_target_jlpt_level_idx
on public.profiles(target_jlpt_level);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  derived_name text;
  current_level public.jlpt_level;
  target_level_value public.jlpt_level;
  goal_minutes integer;
  profile_timezone text;
begin
  derived_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Learner'
  );

  current_level := case
    when new.raw_user_meta_data ->> 'jlpt_level' in ('N5', 'N4', 'N3', 'N2', 'N1')
      then (new.raw_user_meta_data ->> 'jlpt_level')::public.jlpt_level
    else 'N5'::public.jlpt_level
  end;

  target_level_value := case
    when new.raw_user_meta_data ->> 'target_jlpt_level' in ('N5', 'N4', 'N3', 'N2', 'N1')
      then (new.raw_user_meta_data ->> 'target_jlpt_level')::public.jlpt_level
    when new.raw_user_meta_data ->> 'target_level' in ('N5', 'N4', 'N3', 'N2', 'N1')
      then (new.raw_user_meta_data ->> 'target_level')::public.jlpt_level
    else 'N3'::public.jlpt_level
  end;

  goal_minutes := case
    when coalesce(new.raw_user_meta_data ->> 'daily_study_goal', '') ~ '^[0-9]+$'
      then least(greatest((new.raw_user_meta_data ->> 'daily_study_goal')::integer, 5), 480)
    when coalesce(new.raw_user_meta_data ->> 'study_goal_minutes', '') ~ '^[0-9]+$'
      then least(greatest((new.raw_user_meta_data ->> 'study_goal_minutes')::integer, 5), 480)
    else 30
  end;

  profile_timezone := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'timezone'), ''),
    'Asia/Tokyo'
  );

  insert into public.profiles (
    id,
    display_name,
    nickname,
    role,
    jlpt_level,
    target_level,
    target_jlpt_level,
    native_language,
    locale,
    study_goal_minutes,
    daily_study_goal,
    timezone
  )
  values (
    new.id,
    derived_name,
    derived_name,
    'student',
    current_level,
    target_level_value,
    target_level_value,
    'zh',
    'zh-CN',
    goal_minutes,
    goal_minutes,
    profile_timezone
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
