import { getPreferredEquipmentForExercise } from '@/lib/recommendations';
import {
  EquipmentPreference,
  ExperienceLevel,
  Goal,
  RoutineDay,
  RoutineGenerationSource,
  UserPreferences,
  UserRoutine,
  WorkoutExercise,
  WorkoutTemplate,
} from '@/lib/types';

export type RoutineGenerationResult = {
  routine: UserRoutine;
  source: RoutineGenerationSource;
  summary: string;
};

type GenerateRoutineParams = {
  makeId: (prefix: string) => string;
  preferences: UserPreferences;
  templates: WorkoutTemplate[];
  userId: string;
};

const promptVersion = 'v2-fallback-2026-05-06';

const focusByGoal: Record<Goal, string[]> = {
  strength: ['Squat and press', 'Pull strength', 'Full-body repeat', 'Accessory control'],
  muscle: ['Lower body volume', 'Push volume', 'Pull volume', 'Arms and core'],
  general_health: ['Full-body foundation', 'Control and core', 'Machine confidence', 'Repeat day'],
};

const exercisePlanByGoal: Record<Goal, string[][]> = {
  strength: [
    ['ex-leg-press', 'ex-chest-press', 'ex-lat-pulldown'],
    ['ex-assisted-pullup', 'ex-seated-row', 'ex-db-row'],
    ['ex-goblet-squat', 'ex-shoulder-press', 'ex-plank'],
    ['ex-leg-extension', 'ex-leg-curl', 'ex-triceps-pushdown'],
  ],
  muscle: [
    ['ex-leg-press', 'ex-leg-extension', 'ex-leg-curl'],
    ['ex-chest-press', 'ex-shoulder-press', 'ex-triceps-pushdown'],
    ['ex-lat-pulldown', 'ex-seated-row', 'ex-db-row'],
    ['ex-cable-fly', 'ex-goblet-squat', 'ex-plank'],
  ],
  general_health: [
    ['ex-leg-press', 'ex-chest-press', 'ex-lat-pulldown'],
    ['ex-goblet-squat', 'ex-seated-row', 'ex-plank'],
    ['ex-leg-extension', 'ex-shoulder-press', 'ex-assisted-pullup'],
    ['ex-leg-curl', 'ex-cable-fly', 'ex-triceps-pushdown'],
  ],
};

function clampDays(daysPerWeek: number) {
  return Math.max(2, Math.min(4, Math.round(daysPerWeek || 3)));
}

function prescriptionFor(
  goal: Goal,
  experienceLevel: ExperienceLevel,
  sessionLengthMinutes: number,
): Pick<WorkoutExercise, 'sets' | 'repsMin' | 'repsMax' | 'restSeconds'> {
  const shorterSession = sessionLengthMinutes <= 35;

  if (goal === 'strength') {
    return {
      sets: shorterSession ? 3 : 4,
      repsMin: experienceLevel === 'beginner' ? 6 : 4,
      repsMax: experienceLevel === 'beginner' ? 8 : 6,
      restSeconds: experienceLevel === 'beginner' ? 105 : 150,
    };
  }

  if (goal === 'muscle') {
    return {
      sets: shorterSession ? 3 : 4,
      repsMin: 8,
      repsMax: 12,
      restSeconds: 90,
    };
  }

  return {
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 75,
  };
}

function filterForEquipmentPreference(exerciseIds: string[], preference: EquipmentPreference) {
  if (preference === 'mixed') {
    return exerciseIds;
  }

  return exerciseIds.filter((exerciseId) => {
    const equipment = getPreferredEquipmentForExercise(exerciseId);

    if (!equipment) {
      return false;
    }

    if (preference === 'machines') {
      return equipment.equipmentType === 'machine' || equipment.equipmentType === 'cable';
    }

    if (preference === 'dumbbells') {
      return equipment.equipmentType === 'dumbbell';
    }

    if (preference === 'barbells') {
      return equipment.equipmentType === 'barbell';
    }

    return false;
  });
}

export function generateRoutineFromPreferences({
  makeId,
  preferences,
  templates,
  userId,
}: GenerateRoutineParams): RoutineGenerationResult {
  const daysPerWeek = clampDays(preferences.daysPerWeek);
  const sourcePlan = exercisePlanByGoal[preferences.goal];
  const focusLabels = focusByGoal[preferences.goal];
  const prescription = prescriptionFor(
    preferences.goal,
    preferences.experienceLevel,
    preferences.sessionLengthMinutes,
  );

  const days: RoutineDay[] = Array.from({ length: daysPerWeek }).map((_, dayIndex) => {
    const fallbackIds = sourcePlan[dayIndex] ?? sourcePlan[0];
    const preferredIds = filterForEquipmentPreference(fallbackIds, preferences.preferredEquipment);
    const exerciseIds = preferredIds.length >= 2 ? preferredIds : fallbackIds;
    const exercises = exerciseIds
      .map<WorkoutExercise | null>((exerciseId, index) => {
        const selectedEquipment = getPreferredEquipmentForExercise(exerciseId);

        if (!selectedEquipment) {
          return null;
        }

        return {
          id: makeId('generated-exercise'),
          exerciseId,
          equipmentId: selectedEquipment.id,
          position: index + 1,
          ...prescription,
          notes:
            preferences.experienceLevel === 'beginner'
              ? 'Start conservative and leave two reps in reserve.'
              : 'Use a controlled load and track reps honestly.',
        };
      })
      .filter((exercise): exercise is WorkoutExercise => Boolean(exercise));

    return {
      id: makeId('generated-day'),
      dayNumber: dayIndex + 1,
      title: focusLabels[dayIndex] ?? `Training Day ${dayIndex + 1}`,
      focus: focusLabels[dayIndex] ?? 'Full-body routine',
      exercises,
    };
  });

  const matchedTemplate =
    templates.find(
      (template) =>
        template.goal === preferences.goal &&
        template.experienceLevel === preferences.experienceLevel &&
        template.days.length === daysPerWeek,
    ) ?? templates.find((template) => template.goal === preferences.goal);

  const titlePrefix = matchedTemplate ? matchedTemplate.title.replace(/^Ratner\s+/i, '') : 'Ratner';
  const routine: UserRoutine = {
    id: makeId('generated-routine'),
    userId,
    sourceTemplateId: matchedTemplate?.id ?? null,
    assignedBy: null,
    title: `${titlePrefix} ${daysPerWeek}-Day Routine`,
    status: 'active',
    days,
    generationSource: 'fallback',
    generatedAt: new Date().toISOString(),
    promptVersion,
  };

  return {
    routine,
    source: 'fallback',
    summary:
      'Generated locally from the Ratner catalog because AI services are not configured in this build.',
  };
}
