insert into public.gyms (id, name, location)
values ('00000000-0000-0000-0000-000000000001', 'Ratner Athletics Center', 'UChicago Hyde Park')
on conflict (id) do nothing;

insert into public.muscle_groups (name)
values
  ('Chest'),
  ('Triceps'),
  ('Lats'),
  ('Upper back'),
  ('Biceps'),
  ('Quads'),
  ('Glutes'),
  ('Core')
on conflict (name) do nothing;

insert into public.equipment (
  id,
  gym_id,
  machine_number,
  name,
  brand,
  equipment_type,
  instructions
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '21',
    'Seated Chest Press',
    'Life Fitness',
    'machine',
    'Adjust the seat so handles line up with mid-chest. Keep shoulder blades set.'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '18',
    'Lat Pulldown',
    'Life Fitness',
    'machine',
    'Set thigh pad snugly. Pull elbows down and slightly back.'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '31',
    'Leg Press',
    'Cybex',
    'machine',
    'Place feet shoulder-width on the platform. Keep hips down on the pad.'
  )
on conflict (id) do nothing;

insert into public.exercises (id, name, instructions, difficulty, movement_pattern)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'Machine Chest Press',
    'Press handles forward without shrugging. Stop before elbows lock hard.',
    'beginner',
    'push'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Lat Pulldown',
    'Pull the bar to upper chest and control it back overhead.',
    'beginner',
    'pull'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Leg Press',
    'Lower until knees are comfortably bent, then press through mid-foot.',
    'beginner',
    'squat'
  )
on conflict (id) do nothing;

insert into public.equipment_exercises (equipment_id, exercise_id, setup_notes, is_preferred)
values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Seat at chest height.', true),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Use wide or neutral grip attachment.', true),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Start with sled only if new.', true)
on conflict (equipment_id, exercise_id) do nothing;
