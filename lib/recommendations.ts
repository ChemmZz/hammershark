import {
  equipment,
  equipmentExercises,
  exerciseMuscles,
  exercises,
  exerciseSubstitutions,
  muscleGroups,
} from '@/data/demoData';
import { Equipment, Exercise, SwapRecommendation } from '@/lib/types';

export function getExercise(exerciseId: string): Exercise {
  const exercise = exercises.find((item) => item.id === exerciseId);

  if (!exercise) {
    throw new Error(`Missing exercise: ${exerciseId}`);
  }

  return exercise;
}

export function getEquipment(equipmentId: string): Equipment {
  const item = equipment.find((candidate) => candidate.id === equipmentId);

  if (!item) {
    throw new Error(`Missing equipment: ${equipmentId}`);
  }

  return item;
}

export function getPrimaryMuscleNames(exerciseId: string): string[] {
  return exerciseMuscles
    .filter((item) => item.exerciseId === exerciseId && item.role === 'primary')
    .map((item) => muscleGroups.find((muscle) => muscle.id === item.muscleGroupId)?.name)
    .filter((name): name is string => Boolean(name));
}

export function getPreferredEquipmentForExercise(exerciseId: string): Equipment | null {
  const link =
    equipmentExercises.find((item) => item.exerciseId === exerciseId && item.isPreferred) ??
    equipmentExercises.find((item) => item.exerciseId === exerciseId);

  if (!link) {
    return null;
  }

  return equipment.find((item) => item.id === link.equipmentId && item.isAvailable) ?? null;
}

export function getAvailableExercisesForEquipment(equipmentId: string): Exercise[] {
  const exerciseIds = equipmentExercises
    .filter((item) => item.equipmentId === equipmentId)
    .map((item) => item.exerciseId);

  return exercises.filter((exercise) => exerciseIds.includes(exercise.id));
}

export function getSwapRecommendations(sourceExerciseId: string): SwapRecommendation[] {
  const sourceExercise = getExercise(sourceExerciseId);
  const sourcePrimaryMuscles = exerciseMuscles
    .filter((item) => item.exerciseId === sourceExerciseId && item.role === 'primary')
    .map((item) => item.muscleGroupId);

  const approved = exerciseSubstitutions
    .filter((item) => item.sourceExerciseId === sourceExerciseId)
    .sort((left, right) => left.priority - right.priority)
    .map<SwapRecommendation | null>((substitution) => {
      const replacement = exercises.find((item) => item.id === substitution.replacementExerciseId);
      const replacementEquipment = replacement ? getPreferredEquipmentForExercise(replacement.id) : null;

      if (!replacement || !replacementEquipment) {
        return null;
      }

      return {
        exercise: replacement,
        equipment: replacementEquipment,
        source: 'trainer_approved',
        reason: substitution.reason,
      };
    })
    .filter((item): item is SwapRecommendation => Boolean(item));

  const approvedIds = new Set(approved.map((item) => item.exercise.id));

  const catalogMatches = exercises
    .filter((candidate) => candidate.id !== sourceExerciseId)
    .filter((candidate) => !approvedIds.has(candidate.id))
    .filter((candidate) => {
      const candidatePrimary = exerciseMuscles
        .filter((item) => item.exerciseId === candidate.id && item.role === 'primary')
        .map((item) => item.muscleGroupId);

      const sharesPrimaryMuscle = candidatePrimary.some((muscleId) =>
        sourcePrimaryMuscles.includes(muscleId),
      );
      const samePattern = candidate.movementPattern === sourceExercise.movementPattern;
      const beginnerSafe =
        sourceExercise.difficulty === 'beginner' ? candidate.difficulty === 'beginner' : true;

      return (sharesPrimaryMuscle || samePattern) && beginnerSafe;
    })
    .map<SwapRecommendation | null>((candidate) => {
      const replacementEquipment = getPreferredEquipmentForExercise(candidate.id);

      if (!replacementEquipment) {
        return null;
      }

      return {
        exercise: candidate,
        equipment: replacementEquipment,
        source: 'catalog_match',
        reason: 'Matches the target muscle or movement pattern and uses available Ratner equipment.',
      };
    })
    .filter((item): item is SwapRecommendation => Boolean(item));

  return [...approved, ...catalogMatches];
}
