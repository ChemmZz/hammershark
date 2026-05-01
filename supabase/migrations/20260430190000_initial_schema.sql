create extension if not exists pgcrypto;

create type public.profile_role as enum ('user', 'trainer');
create type public.experience_level as enum ('beginner', 'intermediate', 'advanced');
create type public.goal_type as enum ('strength', 'muscle', 'general_health');
create type public.equipment_preference as enum ('machines', 'dumbbells', 'barbells', 'mixed');
create type public.equipment_type as enum ('machine', 'cable', 'dumbbell', 'barbell', 'bench', 'rack');
create type public.muscle_role as enum ('primary', 'secondary');
create type public.movement_pattern as enum ('push', 'pull', 'squat', 'hinge', 'core', 'isolation', 'carry');
create type public.workout_status as enum ('draft', 'active', 'completed', 'archived');
create type public.template_visibility as enum ('public', 'private');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text,
  display_name text,
  role public.profile_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  goal public.goal_type not null default 'general_health',
  experience_level public.experience_level not null default 'beginner',
  preferred_equipment public.equipment_preference not null default 'mixed',
  onboarding_completed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  created_at timestamptz not null default now()
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  machine_number text,
  name text not null,
  brand text,
  equipment_type public.equipment_type not null,
  photo_url text,
  instructions text not null default '',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, machine_number)
);

create table public.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  instructions text not null default '',
  difficulty public.experience_level not null default 'beginner',
  movement_pattern public.movement_pattern not null,
  video_url text,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercise_muscles (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_group_id uuid not null references public.muscle_groups(id) on delete cascade,
  role public.muscle_role not null,
  primary key (exercise_id, muscle_group_id)
);

create table public.equipment_exercises (
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  setup_notes text not null default '',
  is_preferred boolean not null default false,
  primary key (equipment_id, exercise_id)
);

create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  goal public.goal_type not null default 'general_health',
  experience_level public.experience_level not null default 'beginner',
  visibility public.template_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  equipment_id uuid not null references public.equipment(id) on delete restrict,
  position integer not null,
  sets integer not null check (sets > 0),
  reps_min integer not null check (reps_min > 0),
  reps_max integer not null check (reps_max >= reps_min),
  rest_seconds integer not null default 90 check (rest_seconds >= 0),
  notes text not null default '',
  unique (template_id, position)
);

create table public.user_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_template_id uuid references public.workout_templates(id) on delete set null,
  assigned_by uuid references public.profiles(id) on delete set null,
  title text not null,
  status public.workout_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_workout_id uuid not null references public.user_workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  equipment_id uuid not null references public.equipment(id) on delete restrict,
  original_exercise_id uuid references public.exercises(id) on delete set null,
  position integer not null,
  sets integer not null check (sets > 0),
  reps_min integer not null check (reps_min > 0),
  reps_max integer not null check (reps_max >= reps_min),
  rest_seconds integer not null default 90 check (rest_seconds >= 0),
  notes text not null default '',
  unique (user_workout_id, position)
);

create table public.exercise_substitutions (
  id uuid primary key default gen_random_uuid(),
  source_exercise_id uuid not null references public.exercises(id) on delete cascade,
  replacement_exercise_id uuid not null references public.exercises(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null default '',
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  unique (source_exercise_id, replacement_exercise_id)
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_workout_id uuid references public.user_workouts(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status public.workout_status not null default 'active'
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  equipment_id uuid not null references public.equipment(id) on delete restrict,
  set_number integer not null check (set_number > 0),
  target_reps integer not null check (target_reps > 0),
  actual_reps integer check (actual_reps >= 0),
  weight numeric(7, 2) check (weight >= 0),
  completed_at timestamptz,
  unique (session_id, exercise_id, set_number)
);

create index equipment_gym_id_idx on public.equipment(gym_id);
create index exercise_muscles_muscle_group_id_idx on public.exercise_muscles(muscle_group_id);
create index equipment_exercises_exercise_id_idx on public.equipment_exercises(exercise_id);
create index workout_templates_created_by_idx on public.workout_templates(created_by);
create index user_workouts_user_id_idx on public.user_workouts(user_id);
create index user_workout_exercises_user_workout_id_idx on public.user_workout_exercises(user_workout_id);
create index workout_sessions_user_id_idx on public.workout_sessions(user_id);
create index workout_sets_session_id_idx on public.workout_sets(session_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

create trigger equipment_set_updated_at
before update on public.equipment
for each row execute function public.set_updated_at();

create trigger exercises_set_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

create trigger workout_templates_set_updated_at
before update on public.workout_templates
for each row execute function public.set_updated_at();

create trigger user_workouts_set_updated_at
before update on public.user_workouts
for each row execute function public.set_updated_at();

create or replace function public.current_clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '');
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select id
  from public.profiles
  where clerk_user_id = public.current_clerk_user_id()
  limit 1;
$$;

create or replace function public.current_profile_role()
returns public.profile_role
language sql
stable
as $$
  select role
  from public.profiles
  where clerk_user_id = public.current_clerk_user_id()
  limit 1;
$$;

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.gyms enable row level security;
alter table public.equipment enable row level security;
alter table public.muscle_groups enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_muscles enable row level security;
alter table public.equipment_exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.user_workouts enable row level security;
alter table public.user_workout_exercises enable row level security;
alter table public.exercise_substitutions enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

create policy "profiles select own"
on public.profiles for select to authenticated
using (clerk_user_id = public.current_clerk_user_id());

create policy "profiles insert own"
on public.profiles for insert to authenticated
with check (clerk_user_id = public.current_clerk_user_id());

create policy "profiles update own"
on public.profiles for update to authenticated
using (clerk_user_id = public.current_clerk_user_id())
with check (clerk_user_id = public.current_clerk_user_id());

create policy "preferences own access"
on public.user_preferences for all to authenticated
using (user_id = public.current_profile_id())
with check (user_id = public.current_profile_id());

create policy "catalog read gyms"
on public.gyms for select to authenticated
using (true);

create policy "catalog read equipment"
on public.equipment for select to authenticated
using (true);

create policy "catalog read muscle groups"
on public.muscle_groups for select to authenticated
using (true);

create policy "catalog read exercises"
on public.exercises for select to authenticated
using (true);

create policy "catalog read exercise muscles"
on public.exercise_muscles for select to authenticated
using (true);

create policy "catalog read equipment exercises"
on public.equipment_exercises for select to authenticated
using (true);

create policy "trainers manage gyms"
on public.gyms for all to authenticated
using (public.current_profile_role() = 'trainer')
with check (public.current_profile_role() = 'trainer');

create policy "trainers manage equipment"
on public.equipment for all to authenticated
using (public.current_profile_role() = 'trainer')
with check (public.current_profile_role() = 'trainer');

create policy "trainers manage muscle groups"
on public.muscle_groups for all to authenticated
using (public.current_profile_role() = 'trainer')
with check (public.current_profile_role() = 'trainer');

create policy "trainers manage exercises"
on public.exercises for all to authenticated
using (public.current_profile_role() = 'trainer')
with check (public.current_profile_role() = 'trainer');

create policy "trainers manage exercise muscles"
on public.exercise_muscles for all to authenticated
using (public.current_profile_role() = 'trainer')
with check (public.current_profile_role() = 'trainer');

create policy "trainers manage equipment exercises"
on public.equipment_exercises for all to authenticated
using (public.current_profile_role() = 'trainer')
with check (public.current_profile_role() = 'trainer');

create policy "templates visible"
on public.workout_templates for select to authenticated
using (visibility = 'public' or created_by = public.current_profile_id());

create policy "trainers create templates"
on public.workout_templates for insert to authenticated
with check (created_by = public.current_profile_id() and public.current_profile_role() = 'trainer');

create policy "trainers update own templates"
on public.workout_templates for update to authenticated
using (created_by = public.current_profile_id() and public.current_profile_role() = 'trainer')
with check (created_by = public.current_profile_id() and public.current_profile_role() = 'trainer');

create policy "template exercises visible"
on public.workout_template_exercises for select to authenticated
using (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = template_id
      and (wt.visibility = 'public' or wt.created_by = public.current_profile_id())
  )
);

create policy "trainers manage own template exercises"
on public.workout_template_exercises for all to authenticated
using (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = template_id
      and wt.created_by = public.current_profile_id()
      and public.current_profile_role() = 'trainer'
  )
)
with check (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = template_id
      and wt.created_by = public.current_profile_id()
      and public.current_profile_role() = 'trainer'
  )
);

create policy "substitutions visible"
on public.exercise_substitutions for select to authenticated
using (true);

create policy "trainers manage substitutions"
on public.exercise_substitutions for all to authenticated
using (created_by = public.current_profile_id() and public.current_profile_role() = 'trainer')
with check (created_by = public.current_profile_id() and public.current_profile_role() = 'trainer');

create policy "user workouts visible"
on public.user_workouts for select to authenticated
using (user_id = public.current_profile_id() or assigned_by = public.current_profile_id());

create policy "users and trainers create workouts"
on public.user_workouts for insert to authenticated
with check (user_id = public.current_profile_id() or public.current_profile_role() = 'trainer');

create policy "users update own workouts"
on public.user_workouts for update to authenticated
using (user_id = public.current_profile_id() or assigned_by = public.current_profile_id())
with check (user_id = public.current_profile_id() or assigned_by = public.current_profile_id());

create policy "user workout exercises visible"
on public.user_workout_exercises for select to authenticated
using (
  exists (
    select 1
    from public.user_workouts uw
    where uw.id = user_workout_id
      and (uw.user_id = public.current_profile_id() or uw.assigned_by = public.current_profile_id())
  )
);

create policy "users manage own workout exercises"
on public.user_workout_exercises for all to authenticated
using (
  exists (
    select 1
    from public.user_workouts uw
    where uw.id = user_workout_id
      and (uw.user_id = public.current_profile_id() or uw.assigned_by = public.current_profile_id())
  )
)
with check (
  exists (
    select 1
    from public.user_workouts uw
    where uw.id = user_workout_id
      and (uw.user_id = public.current_profile_id() or uw.assigned_by = public.current_profile_id())
  )
);

create policy "sessions own access"
on public.workout_sessions for all to authenticated
using (user_id = public.current_profile_id())
with check (user_id = public.current_profile_id());

create policy "sets own access"
on public.workout_sets for all to authenticated
using (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = session_id
      and ws.user_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = session_id
      and ws.user_id = public.current_profile_id()
  )
);
