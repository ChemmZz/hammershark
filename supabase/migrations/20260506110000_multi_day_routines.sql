create table public.workout_template_days (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  title text not null default '',
  focus text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, day_number)
);

create table public.user_workout_days (
  id uuid primary key default gen_random_uuid(),
  user_workout_id uuid not null references public.user_workouts(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  title text not null default '',
  focus text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_workout_id, day_number)
);

alter table public.workout_template_exercises
add column template_day_id uuid references public.workout_template_days(id) on delete cascade;

alter table public.user_workout_exercises
add column user_workout_day_id uuid references public.user_workout_days(id) on delete cascade;

insert into public.workout_template_days (template_id, day_number, title, focus)
select wt.id, 1, 'Day 1', 'Full routine'
from public.workout_templates wt
where not exists (
  select 1
  from public.workout_template_days wtd
  where wtd.template_id = wt.id
);

insert into public.user_workout_days (user_workout_id, day_number, title, focus)
select uw.id, 1, 'Day 1', 'Full routine'
from public.user_workouts uw
where not exists (
  select 1
  from public.user_workout_days uwd
  where uwd.user_workout_id = uw.id
);

update public.workout_template_exercises wte
set template_day_id = wtd.id
from public.workout_template_days wtd
where wte.template_id = wtd.template_id
  and wtd.day_number = 1
  and wte.template_day_id is null;

update public.user_workout_exercises uwe
set user_workout_day_id = uwd.id
from public.user_workout_days uwd
where uwe.user_workout_id = uwd.user_workout_id
  and uwd.day_number = 1
  and uwe.user_workout_day_id is null;

alter table public.workout_template_exercises
alter column template_day_id set not null;

alter table public.user_workout_exercises
alter column user_workout_day_id set not null;

alter table public.workout_template_exercises
drop constraint if exists workout_template_exercises_template_id_position_key;

alter table public.user_workout_exercises
drop constraint if exists user_workout_exercises_user_workout_id_position_key;

alter table public.workout_template_exercises
add constraint workout_template_exercises_template_day_position_key unique (template_day_id, position);

alter table public.user_workout_exercises
add constraint user_workout_exercises_day_position_key unique (user_workout_day_id, position);

create index workout_template_days_template_id_idx
on public.workout_template_days(template_id);

create index user_workout_days_user_workout_id_idx
on public.user_workout_days(user_workout_id);

create index workout_template_exercises_template_day_id_idx
on public.workout_template_exercises(template_day_id);

create index user_workout_exercises_user_workout_day_id_idx
on public.user_workout_exercises(user_workout_day_id);

create trigger workout_template_days_set_updated_at
before update on public.workout_template_days
for each row execute function public.set_updated_at();

create trigger user_workout_days_set_updated_at
before update on public.user_workout_days
for each row execute function public.set_updated_at();

alter table public.workout_template_days enable row level security;
alter table public.user_workout_days enable row level security;

create policy "template days visible"
on public.workout_template_days for select to authenticated
using (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_days.template_id
      and (wt.visibility = 'public' or wt.created_by = public.current_profile_id())
  )
);

create policy "trainers manage own template days"
on public.workout_template_days for all to authenticated
using (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_days.template_id
      and wt.created_by = public.current_profile_id()
      and public.current_profile_role() = 'trainer'
  )
)
with check (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_days.template_id
      and wt.created_by = public.current_profile_id()
      and public.current_profile_role() = 'trainer'
  )
);

create policy "user workout days visible"
on public.user_workout_days for select to authenticated
using (
  exists (
    select 1
    from public.user_workouts uw
    where uw.id = user_workout_days.user_workout_id
      and (uw.user_id = public.current_profile_id() or uw.assigned_by = public.current_profile_id())
  )
);

create policy "users manage own workout days"
on public.user_workout_days for all to authenticated
using (
  exists (
    select 1
    from public.user_workouts uw
    where uw.id = user_workout_days.user_workout_id
      and (uw.user_id = public.current_profile_id() or uw.assigned_by = public.current_profile_id())
  )
)
with check (
  exists (
    select 1
    from public.user_workouts uw
    where uw.id = user_workout_days.user_workout_id
      and (uw.user_id = public.current_profile_id() or uw.assigned_by = public.current_profile_id())
  )
);
