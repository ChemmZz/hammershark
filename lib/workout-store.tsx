import React, { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import {
  equipment,
  equipmentExercises,
  exercises,
  initialUserRoutines,
  workoutTemplates,
} from '@/data/demoData';
import { getPreferredEquipmentForExercise } from '@/lib/recommendations';
import {
  Equipment,
  Exercise,
  ExperienceLevel,
  Goal,
  RoutineDay,
  SwapRecommendation,
  UserRoutine,
  WorkoutExercise,
  WorkoutSetLog,
  WorkoutTemplate,
} from '@/lib/types';

type CoachRequest = {
  id: string;
  goal: Goal;
  experienceLevel: ExperienceLevel;
  createdAt: string;
};

type WorkoutStoreValue = {
  templates: WorkoutTemplate[];
  userRoutines: UserRoutine[];
  userWorkouts: UserRoutine[];
  activeRoutine: UserRoutine | null;
  activeRoutineDay: RoutineDay | null;
  activeRoutineDayIndex: number;
  activeWorkout: UserRoutine | null;
  completedExerciseIds: string[];
  coachRequests: CoachRequest[];
  setActiveRoutineId: (routineId: string) => void;
  setActiveRoutineDayId: (dayId: string) => void;
  setActiveWorkoutId: (routineId: string) => void;
  setLogs: WorkoutSetLog[];
  assignTemplate: (templateId: string) => void;
  createRecommendedRoutine: (goal: Goal, experienceLevel: ExperienceLevel) => void;
  createManualRoutine: (exerciseId: string) => void;
  createManualWorkout: (exerciseId: string) => void;
  addExerciseToActiveDay: (exerciseId: string) => void;
  addExerciseToManualWorkout: (exerciseId: string) => void;
  requestCoachSession: (goal: Goal, experienceLevel: ExperienceLevel) => void;
  toggleExerciseComplete: (workoutExerciseId: string) => void;
  swapExercise: (
    userRoutineId: string,
    routineDayId: string,
    workoutExerciseId: string,
    recommendation: SwapRecommendation,
  ) => void;
  logSet: (
    workoutExerciseId: string,
    exerciseId: string,
    equipmentId: string,
    setNumber: number,
    targetReps: number,
    actualReps: number,
    weight: number,
  ) => void;
  createTrainerTemplate: (title: string, exerciseIds: string[]) => void;
  findEquipmentForExercise: (exerciseId: string) => Equipment | null;
  findExercise: (exerciseId: string) => Exercise | null;
};

const WorkoutStoreContext = createContext<WorkoutStoreValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function copyTemplateDays(template: WorkoutTemplate, idPrefix: string): RoutineDay[] {
  return template.days.map((day) => ({
    ...day,
    id: makeId(`${idPrefix}-day`),
    exercises: day.exercises.map((exercise) => ({
      ...exercise,
      id: makeId(`${idPrefix}-exercise`),
    })),
  }));
}

function getTemplateExerciseCount(template: WorkoutTemplate) {
  return template.days.reduce((total, day) => total + day.exercises.length, 0);
}

function updateRoutineDay(
  routine: UserRoutine,
  routineDayId: string,
  update: (day: RoutineDay) => RoutineDay,
) {
  return {
    ...routine,
    days: routine.days.map((day) => (day.id === routineDayId ? update(day) : day)),
  };
}

export function HammersharkProvider({ children }: PropsWithChildren) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(workoutTemplates);
  const [userRoutines, setUserRoutines] = useState<UserRoutine[]>(initialUserRoutines);
  const [activeRoutineId, setActiveRoutineIdState] = useState(initialUserRoutines[0]?.id ?? '');
  const [activeRoutineDayId, setActiveRoutineDayIdState] = useState(
    initialUserRoutines[0]?.days[0]?.id ?? '',
  );
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);
  const [coachRequests, setCoachRequests] = useState<CoachRequest[]>([]);
  const [setLogs, setSetLogs] = useState<WorkoutSetLog[]>([]);

  const activeRoutine =
    userRoutines.find((routine) => routine.id === activeRoutineId) ?? userRoutines[0] ?? null;
  const activeRoutineDay =
    activeRoutine?.days.find((day) => day.id === activeRoutineDayId) ??
    activeRoutine?.days[0] ??
    null;
  const activeRoutineDayIndex = activeRoutine && activeRoutineDay
    ? activeRoutine.days.findIndex((day) => day.id === activeRoutineDay.id)
    : -1;

  const findEquipmentForExercise = (exerciseId: string) => getPreferredEquipmentForExercise(exerciseId);
  const findExercise = (exerciseId: string) =>
    exercises.find((exercise) => exercise.id === exerciseId) ?? null;

  const setActiveRoutineId = (routineId: string) => {
    const routine = userRoutines.find((item) => item.id === routineId);

    setActiveRoutineIdState(routineId);
    setActiveRoutineDayIdState(routine?.days[0]?.id ?? '');
  };

  const setActiveRoutineDayId = (dayId: string) => {
    setActiveRoutineDayIdState(dayId);
  };

  const assignTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    const routineId = makeId('routine');
    const copiedRoutine: UserRoutine = {
      id: routineId,
      userId: 'profile-user-demo',
      sourceTemplateId: template.id,
      assignedBy: template.createdBy,
      title: template.title,
      status: 'active',
      days: copyTemplateDays(template, 'routine'),
    };

    setUserRoutines((current) => [copiedRoutine, ...current]);
    setActiveRoutineIdState(routineId);
    setActiveRoutineDayIdState(copiedRoutine.days[0]?.id ?? '');
  };

  const createRecommendedRoutine = (goal: Goal, experienceLevel: ExperienceLevel) => {
    const template =
      templates.find((item) => item.goal === goal && item.experienceLevel === experienceLevel) ??
      templates.find((item) => item.goal === goal) ??
      templates[0];

    if (!template) {
      return;
    }

    const routineId = makeId('recommended-routine');
    const routine: UserRoutine = {
      id: routineId,
      userId: 'profile-user-demo',
      sourceTemplateId: template.id,
      assignedBy: null,
      title: `Recommended: ${template.title}`,
      status: 'active',
      days: copyTemplateDays(template, 'recommended'),
    };

    setUserRoutines((current) => [routine, ...current]);
    setActiveRoutineIdState(routineId);
    setActiveRoutineDayIdState(routine.days[0]?.id ?? '');
  };

  const createManualRoutine = (exerciseId: string) => {
    const selectedEquipment = findEquipmentForExercise(exerciseId);

    if (!selectedEquipment) {
      return;
    }

    const routineId = makeId('manual-routine');
    const dayId = makeId('manual-day');
    const routine: UserRoutine = {
      id: routineId,
      userId: 'profile-user-demo',
      sourceTemplateId: null,
      assignedBy: null,
      title: 'Manual Ratner Routine',
      status: 'draft',
      days: [
        {
          id: dayId,
          dayNumber: 1,
          title: 'Custom Day',
          focus: 'Self-selected exercises',
          exercises: [
            {
              id: makeId('manual-exercise'),
              exerciseId,
              equipmentId: selectedEquipment.id,
              position: 1,
              sets: 3,
              repsMin: 8,
              repsMax: 12,
              restSeconds: 90,
              notes: 'Self-selected exercise.',
            },
          ],
        },
      ],
    };

    setUserRoutines((current) => [routine, ...current]);
    setActiveRoutineIdState(routineId);
    setActiveRoutineDayIdState(dayId);
  };

  const addExerciseToActiveDay = (exerciseId: string) => {
    const selectedEquipment = findEquipmentForExercise(exerciseId);

    if (!selectedEquipment) {
      return;
    }

    if (!activeRoutine || !activeRoutineDay) {
      createManualRoutine(exerciseId);
      return;
    }

    setUserRoutines((current) =>
      current.map((routine) => {
        if (routine.id !== activeRoutine.id) {
          return routine;
        }

        return updateRoutineDay(routine, activeRoutineDay.id, (day) => ({
          ...day,
          exercises: [
            ...day.exercises,
            {
              id: makeId('manual-exercise'),
              exerciseId,
              equipmentId: selectedEquipment.id,
              position: day.exercises.length + 1,
              sets: 3,
              repsMin: 8,
              repsMax: 12,
              restSeconds: 90,
              notes: 'Added from catalog.',
            },
          ],
        }));
      }),
    );
  };

  const requestCoachSession = (goal: Goal, experienceLevel: ExperienceLevel) => {
    setCoachRequests((current) => [
      {
        id: makeId('coach-request'),
        goal,
        experienceLevel,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  };

  const toggleExerciseComplete = (workoutExerciseId: string) => {
    setCompletedExerciseIds((current) =>
      current.includes(workoutExerciseId)
        ? current.filter((item) => item !== workoutExerciseId)
        : [...current, workoutExerciseId],
    );
  };

  const swapExercise = (
    userRoutineId: string,
    routineDayId: string,
    workoutExerciseId: string,
    recommendation: SwapRecommendation,
  ) => {
    setUserRoutines((current) =>
      current.map((routine) => {
        if (routine.id !== userRoutineId) {
          return routine;
        }

        return updateRoutineDay(routine, routineDayId, (day) => ({
          ...day,
          exercises: day.exercises.map((exercise) => {
            if (exercise.id !== workoutExerciseId) {
              return exercise;
            }

            return {
              ...exercise,
              exerciseId: recommendation.exercise.id,
              equipmentId: recommendation.equipment.id,
              originalExerciseId: exercise.originalExerciseId ?? exercise.exerciseId,
              notes:
                recommendation.source === 'trainer_approved'
                  ? `Trainer-approved swap: ${recommendation.reason}`
                  : recommendation.reason,
            };
          }),
        }));
      }),
    );
  };

  const logSet: WorkoutStoreValue['logSet'] = (
    workoutExerciseId,
    exerciseId,
    equipmentId,
    setNumber,
    targetReps,
    actualReps,
    weight,
  ) => {
    const log: WorkoutSetLog = {
      id: makeId('set-log'),
      routineId: activeRoutine?.id,
      routineDayId: activeRoutineDay?.id,
      workoutExerciseId,
      exerciseId,
      equipmentId,
      setNumber,
      targetReps,
      actualReps,
      weight,
      completedAt: new Date().toISOString(),
    };

    setSetLogs((current) => [
      log,
      ...current.filter(
        (item) => !(item.workoutExerciseId === workoutExerciseId && item.setNumber === setNumber),
      ),
    ]);
  };

  const createTrainerTemplate = (title: string, exerciseIds: string[]) => {
    const uniqueExerciseIds = Array.from(new Set(exerciseIds)).filter(Boolean);

    if (!title.trim() || uniqueExerciseIds.length === 0) {
      return;
    }

    const template: WorkoutTemplate = {
      id: makeId('template'),
      createdBy: 'profile-trainer-demo',
      title: title.trim(),
      description: 'Trainer-created template from the in-app coach tools.',
      goal: 'general_health',
      experienceLevel: 'beginner',
      visibility: 'public',
      days: [
        {
          id: makeId('template-day'),
          dayNumber: 1,
          title: 'Coach Day',
          focus: 'Trainer-selected exercises',
          exercises: uniqueExerciseIds.map<WorkoutExercise>((exerciseId, index) => {
            const selectedEquipment = findEquipmentForExercise(exerciseId) ?? equipment[0];

            return {
              id: makeId('template-exercise'),
              exerciseId,
              equipmentId: selectedEquipment.id,
              position: index + 1,
              sets: 3,
              repsMin: 8,
              repsMax: 12,
              restSeconds: 90,
              notes: 'Trainer default prescription.',
            };
          }),
        },
      ],
    };

    setTemplates((current) => [template, ...current]);
  };

  const value = useMemo<WorkoutStoreValue>(
    () => ({
      templates,
      userRoutines,
      userWorkouts: userRoutines,
      activeRoutine,
      activeRoutineDay,
      activeRoutineDayIndex,
      activeWorkout: activeRoutine,
      completedExerciseIds,
      coachRequests,
      setActiveRoutineId,
      setActiveRoutineDayId,
      setActiveWorkoutId: setActiveRoutineId,
      setLogs,
      assignTemplate,
      createRecommendedRoutine,
      createManualRoutine,
      createManualWorkout: createManualRoutine,
      addExerciseToActiveDay,
      addExerciseToManualWorkout: addExerciseToActiveDay,
      requestCoachSession,
      toggleExerciseComplete,
      swapExercise,
      logSet,
      createTrainerTemplate,
      findEquipmentForExercise,
      findExercise,
    }),
    [
      activeRoutine,
      activeRoutineDay,
      activeRoutineDayIndex,
      coachRequests,
      completedExerciseIds,
      setLogs,
      templates,
      userRoutines,
    ],
  );

  return <WorkoutStoreContext.Provider value={value}>{children}</WorkoutStoreContext.Provider>;
}

export function useWorkoutStore() {
  const context = useContext(WorkoutStoreContext);

  if (!context) {
    throw new Error('useWorkoutStore must be used inside HammersharkProvider.');
  }

  return context;
}

export function getExercisesForEquipment(equipmentId: string) {
  const exerciseIds = equipmentExercises
    .filter((item) => item.equipmentId === equipmentId)
    .map((item) => item.exerciseId);

  return exercises.filter((exercise) => exerciseIds.includes(exercise.id));
}

export { getTemplateExerciseCount };
