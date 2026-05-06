export type ProfileRole = 'user' | 'trainer';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Goal = 'strength' | 'muscle' | 'general_health';
export type EquipmentPreference = 'machines' | 'dumbbells' | 'barbells' | 'mixed';
export type EquipmentType = 'machine' | 'cable' | 'dumbbell' | 'barbell' | 'bench' | 'rack';
export type MuscleRole = 'primary' | 'secondary';
export type MovementPattern =
  | 'push'
  | 'pull'
  | 'squat'
  | 'hinge'
  | 'core'
  | 'isolation'
  | 'carry';
export type WorkoutStatus = 'draft' | 'active' | 'completed' | 'archived';
export type SwapSource = 'trainer_approved' | 'catalog_match';

export type Profile = {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string;
  role: ProfileRole;
};

export type UserPreferences = {
  userId: string;
  goal: Goal;
  experienceLevel: ExperienceLevel;
  preferredEquipment: EquipmentPreference;
  onboardingCompleted: boolean;
};

export type Gym = {
  id: string;
  name: string;
  location: string;
};

export type Equipment = {
  id: string;
  gymId: string;
  machineNumber: string | null;
  name: string;
  brand: string | null;
  equipmentType: EquipmentType;
  photoUrl: string | null;
  instructions: string;
  isAvailable: boolean;
};

export type MuscleGroup = {
  id: string;
  name: string;
};

export type Exercise = {
  id: string;
  name: string;
  instructions: string;
  difficulty: ExperienceLevel;
  movementPattern: MovementPattern;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
};

export type ExerciseMuscle = {
  exerciseId: string;
  muscleGroupId: string;
  role: MuscleRole;
};

export type EquipmentExercise = {
  equipmentId: string;
  exerciseId: string;
  setupNotes: string;
  isPreferred: boolean;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  equipmentId: string;
  position: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  notes: string;
  originalExerciseId?: string;
};

export type RoutineDay = {
  id: string;
  dayNumber: number;
  title: string;
  focus: string;
  exercises: WorkoutExercise[];
};

export type WorkoutTemplate = {
  id: string;
  createdBy: string;
  title: string;
  description: string;
  goal: Goal;
  experienceLevel: ExperienceLevel;
  visibility: 'public' | 'private';
  days: RoutineDay[];
};

export type UserRoutine = {
  id: string;
  userId: string;
  sourceTemplateId: string | null;
  assignedBy: string | null;
  title: string;
  status: WorkoutStatus;
  days: RoutineDay[];
};

export type UserWorkout = UserRoutine;

export type ExerciseSubstitution = {
  id: string;
  sourceExerciseId: string;
  replacementExerciseId: string;
  createdBy: string;
  reason: string;
  priority: number;
};

export type WorkoutSetLog = {
  id: string;
  routineId?: string;
  routineDayId?: string;
  workoutExerciseId: string;
  exerciseId: string;
  equipmentId: string;
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weight: number;
  completedAt: string;
};

export type SwapRecommendation = {
  exercise: Exercise;
  equipment: Equipment;
  source: SwapSource;
  reason: string;
};
