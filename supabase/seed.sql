insert into public.gyms (id, name, location)
values ('00000000-0000-0000-0000-000000000001', 'Ratner Athletics Center', 'UChicago Hyde Park')
on conflict (id) do nothing;

insert into public.muscle_groups (name)
values
  ('Chest'),
  ('Shoulders'),
  ('Triceps'),
  ('Lats'),
  ('Upper back'),
  ('Biceps'),
  ('Quads'),
  ('Hamstrings'),
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
    'A24',
    'Seated Chest Press',
    'Life Fitness',
    'machine',
    'Adjust the seat so handles line up with mid-chest. Keep shoulder blades set.'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'A21',
    'Lat Pulldown',
    'Life Fitness',
    'machine',
    'Set thigh pad snugly. Pull elbows down and slightly back.'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'B13',
    'Leg Press',
    'Cybex',
    'machine',
    'Place feet shoulder-width on the platform. Keep hips down on the pad.'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'A22',
    'Seated Cable Row',
    'Life Fitness',
    'machine',
    'Brace through the torso and row handles toward the lower ribs.'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'A23',
    'Assisted Pull-up',
    'Life Fitness',
    'machine',
    'Choose assistance that lets you control the full range of motion.'
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'A25',
    'Seated Shoulder Press',
    'Life Fitness',
    'machine',
    'Set the seat so handles start near shoulder height. Press without arching.'
  ),
  (
    '10000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'B11',
    'Leg Extension',
    'Cybex',
    'machine',
    'Line knees with the machine pivot and control the pad back down.'
  ),
  (
    '10000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    'B12',
    'Seated Leg Curl',
    'Cybex',
    'machine',
    'Set the pad behind the ankles and curl without lifting the hips.'
  ),
  (
    '10000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000001',
    'A26',
    'Dual Cable Tower',
    'Precor',
    'cable',
    'Set both pulleys to the needed height and clip on the correct handle.'
  ),
  (
    '10000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'C01',
    'Dumbbell Rack',
    null,
    'dumbbell',
    'Choose a pair you can control for the full rep range.'
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
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'Seated Cable Row',
    'Keep ribs down and row to the lower chest without leaning back hard.',
    'beginner',
    'pull'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    'Machine Shoulder Press',
    'Press handles overhead while keeping ribs stacked and shoulders down.',
    'beginner',
    'push'
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    'Leg Extension',
    'Extend knees smoothly, squeeze the quads, then lower with control.',
    'beginner',
    'isolation'
  ),
  (
    '20000000-0000-0000-0000-000000000007',
    'Seated Leg Curl',
    'Curl the pad toward you without bouncing. Control the return.',
    'beginner',
    'isolation'
  ),
  (
    '20000000-0000-0000-0000-000000000008',
    'Assisted Pull-up',
    'Start from straight arms, pull chest toward handles, and lower slowly.',
    'beginner',
    'pull'
  ),
  (
    '20000000-0000-0000-0000-000000000009',
    'Cable Chest Fly',
    'Use a light load. Sweep hands together while keeping elbows softly bent.',
    'intermediate',
    'isolation'
  ),
  (
    '20000000-0000-0000-0000-000000000010',
    'Dumbbell Bench Press',
    'Lower dumbbells under control, then press up over the chest.',
    'intermediate',
    'push'
  )
on conflict (id) do nothing;

insert into public.equipment_exercises (equipment_id, exercise_id, setup_notes, is_preferred)
values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Seat at chest height.', true),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Use wide or neutral grip attachment.', true),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Start with sled only if new.', true),
  ('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'Use close neutral handles.', true),
  ('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000008', 'Select the pad weight that allows a full range of motion.', true),
  ('10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000005', 'Set the seat before loading the movement.', true),
  ('10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000006', 'Line the knee joint up with the machine pivot.', true),
  ('10000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000007', 'Keep the hips pinned down through the full rep.', true),
  ('10000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000009', 'Set pulleys just below shoulder height.', true),
  ('10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000010', 'Use a flat bench near the rack.', true)
on conflict (equipment_id, exercise_id) do nothing;
