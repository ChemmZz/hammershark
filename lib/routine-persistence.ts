import { createHammersharkSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { UserPreferences, UserRoutine, WorkoutSetLog } from '@/lib/types';

export type PersistenceResult =
  | { mode: 'local'; ok: true; reason: string }
  | { mode: 'supabase'; ok: true }
  | { mode: 'supabase'; ok: false; reason: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined) {
  return Boolean(value && uuidPattern.test(value));
}

export async function savePreferences(
  preferences: UserPreferences,
  getAccessToken?: () => Promise<string | null>,
): Promise<PersistenceResult> {
  const supabase = createHammersharkSupabaseClient(getAccessToken);

  if (!supabase || !isSupabaseConfigured()) {
    return { mode: 'local', ok: true, reason: 'Supabase is not configured.' };
  }

  if (!isUuid(preferences.userId)) {
    return { mode: 'local', ok: true, reason: 'Local demo profile is not a Supabase UUID.' };
  }

  const { error } = await supabase.from('user_preferences').upsert({
    user_id: preferences.userId,
    goal: preferences.goal,
    experience_level: preferences.experienceLevel,
    preferred_equipment: preferences.preferredEquipment,
    days_per_week: preferences.daysPerWeek,
    session_length_minutes: preferences.sessionLengthMinutes,
    comfort_level: preferences.comfortLevel,
    onboarding_completed: preferences.onboardingCompleted,
  });

  return error
    ? { mode: 'supabase', ok: false, reason: error.message }
    : { mode: 'supabase', ok: true };
}

export async function saveRoutine(
  routine: UserRoutine,
  getAccessToken?: () => Promise<string | null>,
): Promise<PersistenceResult> {
  const supabase = createHammersharkSupabaseClient(getAccessToken);

  if (!supabase || !isSupabaseConfigured()) {
    return { mode: 'local', ok: true, reason: 'Supabase is not configured.' };
  }

  if (!isUuid(routine.id) || !isUuid(routine.userId)) {
    return { mode: 'local', ok: true, reason: 'Local routine IDs are not Supabase UUIDs.' };
  }

  const { error: routineError } = await supabase.from('user_workouts').upsert({
    id: routine.id,
    user_id: routine.userId,
    source_template_id: isUuid(routine.sourceTemplateId) ? routine.sourceTemplateId : null,
    assigned_by: isUuid(routine.assignedBy) ? routine.assignedBy : null,
    title: routine.title,
    status: routine.status,
    generation_source: routine.generationSource,
    generated_at: routine.generatedAt,
    prompt_version: routine.promptVersion,
    active_day_id: null,
  });

  if (routineError) {
    return { mode: 'supabase', ok: false, reason: routineError.message };
  }

  for (const day of routine.days) {
    if (!isUuid(day.id)) {
      return { mode: 'local', ok: true, reason: 'Local routine day IDs are not Supabase UUIDs.' };
    }

    const { error: dayError } = await supabase.from('user_workout_days').upsert({
      id: day.id,
      user_workout_id: routine.id,
      day_number: day.dayNumber,
      title: day.title,
      focus: day.focus,
    });

    if (dayError) {
      return { mode: 'supabase', ok: false, reason: dayError.message };
    }

    const { error: exerciseError } = await supabase.from('user_workout_exercises').upsert(
      day.exercises.map((exercise) => ({
        id: exercise.id,
        user_workout_id: routine.id,
        user_workout_day_id: day.id,
        exercise_id: exercise.exerciseId,
        equipment_id: exercise.equipmentId,
        original_exercise_id: exercise.originalExerciseId ?? null,
        position: exercise.position,
        sets: exercise.sets,
        reps_min: exercise.repsMin,
        reps_max: exercise.repsMax,
        rest_seconds: exercise.restSeconds,
        notes: exercise.notes,
      })),
    );

    if (exerciseError) {
      return { mode: 'supabase', ok: false, reason: exerciseError.message };
    }
  }

  const { error: activeDayError } = await supabase
    .from('user_workouts')
    .update({ active_day_id: routine.days[0]?.id ?? null })
    .eq('id', routine.id);

  if (activeDayError) {
    return { mode: 'supabase', ok: false, reason: activeDayError.message };
  }

  return { mode: 'supabase', ok: true };
}

export async function saveSetLog(
  log: WorkoutSetLog,
  getAccessToken?: () => Promise<string | null>,
): Promise<PersistenceResult> {
  const supabase = createHammersharkSupabaseClient(getAccessToken);

  if (!supabase || !isSupabaseConfigured()) {
    return { mode: 'local', ok: true, reason: 'Supabase is not configured.' };
  }

  if (!isUuid(log.id) || !isUuid(log.workoutExerciseId)) {
    return { mode: 'local', ok: true, reason: 'Local set log IDs are not Supabase UUIDs.' };
  }

  const { error } = await supabase.from('workout_sets').upsert({
    id: log.id,
    user_workout_exercise_id: log.workoutExerciseId,
    exercise_id: log.exerciseId,
    equipment_id: log.equipmentId,
    set_number: log.setNumber,
    target_reps: log.targetReps,
    actual_reps: log.actualReps,
    weight: log.weight,
    completed_at: log.completedAt,
  });

  return error
    ? { mode: 'supabase', ok: false, reason: error.message }
    : { mode: 'supabase', ok: true };
}
