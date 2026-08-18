do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'daily_task_type'
  ) then
    create type public.daily_task_type as enum ('vocabulary', 'grammar', 'reading', 'practice', 'jlpt', 'review');
  end if;
end $$;

grant usage on type public.daily_task_type to authenticated, service_role;

create table if not exists public.daily_study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_date date not null,
  task_type public.daily_task_type not null,
  title text not null check (btrim(title) <> ''),
  description text,
  target_level public.jlpt_level,
  target_count integer not null default 1 check (target_count > 0),
  completed_count integer not null default 0 check (completed_count >= 0),
  target_minutes integer not null default 5 check (target_minutes > 0),
  completed_minutes integer not null default 0 check (completed_minutes >= 0),
  status public.progress_status not null default 'not_started',
  accuracy numeric(5,2) check (accuracy is null or (accuracy >= 0 and accuracy <= 100)),
  href text,
  source_type public.source_type not null default 'manual',
  generation_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_count <= target_count),
  unique (user_id, task_date, task_type)
);

create index if not exists idx_daily_study_tasks_user_date
  on public.daily_study_tasks (user_id, task_date desc);

create index if not exists idx_daily_study_tasks_user_status_date
  on public.daily_study_tasks (user_id, status, task_date desc);

alter table public.daily_study_tasks enable row level security;

grant select, insert, update, delete on table public.daily_study_tasks to authenticated;

drop policy if exists "daily_study_tasks_select_own" on public.daily_study_tasks;
drop policy if exists "daily_study_tasks_insert_own" on public.daily_study_tasks;
drop policy if exists "daily_study_tasks_update_own" on public.daily_study_tasks;
drop policy if exists "daily_study_tasks_delete_own" on public.daily_study_tasks;

create policy "daily_study_tasks_select_own"
on public.daily_study_tasks
for select
to authenticated
using (auth.uid() = user_id);

create policy "daily_study_tasks_insert_own"
on public.daily_study_tasks
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "daily_study_tasks_update_own"
on public.daily_study_tasks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "daily_study_tasks_delete_own"
on public.daily_study_tasks
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists set_updated_at_daily_study_tasks on public.daily_study_tasks;
create trigger set_updated_at_daily_study_tasks
before update on public.daily_study_tasks
for each row execute function public.touch_updated_at();
