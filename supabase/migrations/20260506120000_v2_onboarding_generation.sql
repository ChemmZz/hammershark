create type public.comfort_level as enum ('new_to_gym', 'some_experience', 'confident');
create type public.catalog_status as enum ('verified', 'placeholder', 'needs_verification');
create type public.routine_generation_source as enum ('ai', 'fallback', 'coach_template', 'manual');

alter table public.user_preferences
add column days_per_week integer not null default 3 check (days_per_week between 1 and 7),
add column session_length_minutes integer not null default 45 check (session_length_minutes between 15 and 180),
add column comfort_level public.comfort_level not null default 'new_to_gym';

alter table public.equipment
add column catalog_status public.catalog_status not null default 'needs_verification';

alter table public.exercises
add column catalog_status public.catalog_status not null default 'needs_verification';

alter table public.user_workouts
add column generation_source public.routine_generation_source,
add column generated_at timestamptz,
add column prompt_version text,
add column active_day_id uuid references public.user_workout_days(id) on delete set null;

alter table public.workout_sessions
add column user_workout_day_id uuid references public.user_workout_days(id) on delete set null;

alter table public.workout_sets
add column user_workout_exercise_id uuid references public.user_workout_exercises(id) on delete set null;

alter table public.workout_sets
alter column session_id drop not null;

create index user_workouts_active_day_id_idx
on public.user_workouts(active_day_id);

create index workout_sessions_user_workout_day_id_idx
on public.workout_sessions(user_workout_day_id);

create index workout_sets_user_workout_exercise_id_idx
on public.workout_sets(user_workout_exercise_id);

create policy "sets routine day access"
on public.workout_sets for all to authenticated
using (
  exists (
    select 1
    from public.user_workout_exercises uwe
    join public.user_workouts uw on uw.id = uwe.user_workout_id
    where uwe.id = workout_sets.user_workout_exercise_id
      and uw.user_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.user_workout_exercises uwe
    join public.user_workouts uw on uw.id = uwe.user_workout_id
    where uwe.id = workout_sets.user_workout_exercise_id
      and uw.user_id = public.current_profile_id()
  )
);
