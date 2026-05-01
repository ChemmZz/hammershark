import React, { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import {
  equipment,
  equipmentExercises,
  exercises,
  initialUserWorkouts,
  workoutTemplates,
} from '@/data/demoData';
import { getPreferredEquipmentForExercise } from '@/lib/recommendations';
import {
  Equipment,
  Exercise,
  SwapRecommendation,
  UserWorkout,
  WorkoutSetLog,
  WorkoutTemplate,
} from '@/lib/types';

type WorkoutStoreValue = {
  templates: WorkoutTemplate[];
  userWorkouts: UserWorkout[];
  activeWorkout: UserWorkout | null;
  setActiveWorkoutId: (workoutId: string) => void;
  setLogs: WorkoutSetLog[];
  assignTemplate: (templateId: string) => void;
  createManualWorkout: (exerciseId: string) => void;
  addExerciseToManualWorkout: (exerciseId: string) => void;
  swapExercise: (
    userWorkoutId: string,
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

export function HammersharkProvider({ children }: PropsWithChildren) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(workoutTemplates);
  const [userWorkouts, setUserWorkouts] = useState<UserWorkout[]>(initialUserWorkouts);
  const [activeWorkoutId, setActiveWorkoutId] = useState(initialUserWorkouts[0]?.id ?? '');
  const [setLogs, setSetLogs] = useState<WorkoutSetLog[]>([]);

  const findEquipmentForExercise = (exerciseId: string) => getPreferredEquipmentForExercise(exerciseId);
  const findExercise = (exerciseId: string) =>
    exercises.find((exercise) => exercise.id === exerciseId) ?? null;

  const assignTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    const workoutId = makeId('user-workout');
    const copiedWorkout: UserWorkout = {
      id: workoutId,
      userId: 'profile-user-demo',
      sourceTemplateId: template.id,
      assignedBy: template.createdBy,
      title: `Assigned: ${template.title}`,
      status: 'active',
      exercises: template.exercises.map((exercise) => ({
        ...exercise,
        id: makeId('user-exercise'),
      })),
    };

    setUserWorkouts((current) => [copiedWorkout, ...current]);
    setActiveWorkoutId(workoutId);
  };

  const createManualWorkout = (exerciseId: string) => {
    const selectedEquipment = findEquipmentForExercise(exerciseId);

    if (!selectedEquipment) {
      return;
    }

    const workoutId = makeId('manual-workout');
    const workout: UserWorkout = {
      id: workoutId,
      userId: 'profile-user-demo',
      sourceTemplateId: null,
      assignedBy: null,
      title: 'Manual Ratner Workout',
      status: 'draft',
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
    };

    setUserWorkouts((current) => [workout, ...current]);
    setActiveWorkoutId(workoutId);
  };

  const addExerciseToManualWorkout = (exerciseId: string) => {
    const selectedEquipment = findEquipmentForExercise(exerciseId);

    if (!selectedEquipment) {
      return;
    }

    setUserWorkouts((current) => {
      const manualWorkout = current.find((workout) => workout.id === activeWorkoutId);

      if (!manualWorkout) {
        return current;
      }

      return current.map((workout) => {
        if (workout.id !== manualWorkout.id) {
          return workout;
        }

        return {
          ...workout,
          exercises: [
            ...workout.exercises,
            {
              id: makeId('manual-exercise'),
              exerciseId,
              equipmentId: selectedEquipment.id,
              position: workout.exercises.length + 1,
              sets: 3,
              repsMin: 8,
              repsMax: 12,
              restSeconds: 90,
              notes: 'Added from catalog.',
            },
          ],
        };
      });
    });
  };

  const swapExercise = (
    userWorkoutId: string,
    workoutExerciseId: string,
    recommendation: SwapRecommendation,
  ) => {
    setUserWorkouts((current) =>
      current.map((workout) => {
        if (workout.id !== userWorkoutId) {
          return workout;
        }

        return {
          ...workout,
          exercises: workout.exercises.map((exercise) => {
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
        };
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
      description: 'Trainer-created template from the in-app admin scaffold.',
      goal: 'general_health',
      experienceLevel: 'beginner',
      visibility: 'public',
      exercises: uniqueExerciseIds.map((exerciseId, index) => {
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
    };

    setTemplates((current) => [template, ...current]);
  };

  const activeWorkout =
    userWorkouts.find((workout) => workout.id === activeWorkoutId) ?? userWorkouts[0] ?? null;

  const value = useMemo<WorkoutStoreValue>(
    () => ({
      templates,
      userWorkouts,
      activeWorkout,
      setActiveWorkoutId,
      setLogs,
      assignTemplate,
      createManualWorkout,
      addExerciseToManualWorkout,
      swapExercise,
      logSet,
      createTrainerTemplate,
      findEquipmentForExercise,
      findExercise,
    }),
    [activeWorkout, setLogs, templates, userWorkouts],
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
