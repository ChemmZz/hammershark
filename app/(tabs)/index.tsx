import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  AppText,
  Card,
  Eyebrow,
  Pill,
  PrimaryButton,
  Screen,
  Title,
  colors,
} from '@/components/ui';
import { useHammersharkAuth } from '@/lib/auth';
import {
  getEquipment,
  getExercise,
  getPrimaryMuscleNames,
  getSwapRecommendations,
} from '@/lib/recommendations';
import { getTemplateExerciseCount, useWorkoutStore } from '@/lib/workout-store';
import {
  ComfortLevel,
  EquipmentPreference,
  ExperienceLevel,
  Goal,
  RoutineDay,
  SwapRecommendation,
  UserPreferences,
  UserRoutine,
  WorkoutExercise,
  WorkoutSetLog,
} from '@/lib/types';

const goalOptions: { label: string; value: Goal }[] = [
  { label: 'Strength', value: 'strength' },
  { label: 'Muscle', value: 'muscle' },
  { label: 'General', value: 'general_health' },
];

const experienceOptions: { label: string; value: ExperienceLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const equipmentPreferenceOptions: { label: string; value: EquipmentPreference }[] = [
  { label: 'Mixed', value: 'mixed' },
  { label: 'Machines', value: 'machines' },
  { label: 'Dumbbells', value: 'dumbbells' },
  { label: 'Barbells', value: 'barbells' },
];

const comfortOptions: { label: string; value: ComfortLevel }[] = [
  { label: 'New', value: 'new_to_gym' },
  { label: 'Some reps', value: 'some_experience' },
  { label: 'Confident', value: 'confident' },
];

const dayOptions = [2, 3, 4];
const sessionLengthOptions = [30, 45, 60];

export default function TodayScreen() {
  const { authMode, profile, signOut } = useHammersharkAuth();
  const {
    activeRoutine,
    activeRoutineDay,
    activeRoutineDayIndex,
    assignTemplate,
    coachRequests,
    completedExerciseIds,
    completedRoutineDayIds,
    finishRoutineDay,
    generateRoutine,
    generationState,
    getLastSetLog,
    logSet,
    persistenceMode,
    requestCoachSession,
    savePreferences,
    setActiveRoutineDayId,
    templates,
    toggleExerciseComplete,
    userPreferences,
    userRoutines,
  } = useWorkoutStore();
  const firstName = profile?.displayName?.split(' ')[0] ?? 'Student';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.headerCopy}>
            <Eyebrow>Hammershark</Eyebrow>
            <Title>Today</Title>
          </View>
          <PrimaryButton icon="sign-out" onPress={signOut} variant="ghost">
            Out
          </PrimaryButton>
        </View>

        {activeRoutine && activeRoutineDay ? (
          <>
            <View style={styles.statusStrip}>
              <View style={styles.statusCell}>
                <AppText style={styles.statusValue}>Day {activeRoutineDay.dayNumber}</AppText>
                <AppText style={styles.statusLabel}>{activeRoutineDay.focus}</AppText>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.statusCell}>
                <AppText style={styles.statusValue}>{activeRoutine.days.length}</AppText>
                <AppText style={styles.statusLabel}>routine days</AppText>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.statusCell}>
                <AppText style={styles.statusValue}>{persistenceMode === 'local' ? 'Local' : 'Sync'}</AppText>
                <AppText style={styles.statusLabel}>{authMode === 'demo' ? firstName : 'saved'}</AppText>
              </View>
            </View>

            <Card style={styles.routineHeader}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <Eyebrow>Current routine</Eyebrow>
                  <AppText style={styles.heroTitle}>{activeRoutine.title}</AppText>
                  <AppText style={styles.muted}>{activeRoutineDay.title}</AppText>
                </View>
                <Pill tone="gold">{activeRoutine.status}</Pill>
              </View>
              <DaySelector
                activeDayId={activeRoutineDay.id}
                days={activeRoutine.days}
                onSelect={setActiveRoutineDayId}
              />
            </Card>

            <RoutineDayPlayer
              completedExerciseIds={completedExerciseIds}
              completedRoutineDayIds={completedRoutineDayIds}
              day={activeRoutineDay}
              dayIndex={activeRoutineDayIndex}
              finishRoutineDay={finishRoutineDay}
              getLastSetLog={getLastSetLog}
              logSet={logSet}
              onToggleComplete={toggleExerciseComplete}
              routine={activeRoutine}
            />

            <View style={styles.secondarySection}>
              <View style={styles.sectionHeader}>
                <Eyebrow>Secondary</Eyebrow>
                <AppText style={styles.muted}>Change plans only when needed.</AppText>
              </View>
              {templates.map((template) => (
                <Card key={template.id} style={styles.planCard}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flex}>
                      <AppText style={styles.cardTitle}>{template.title}</AppText>
                      <AppText style={styles.muted}>
                        {template.days.length} days · {getTemplateExerciseCount(template)} moves
                      </AppText>
                    </View>
                    <Pill>{template.experienceLevel}</Pill>
                  </View>
                  <PrimaryButton icon="plus" onPress={() => assignTemplate(template.id)} variant="ghost">
                    Add routine
                  </PrimaryButton>
                </Card>
              ))}
            </View>
          </>
        ) : (
          <NoRoutineStart
            coachRequestCount={coachRequests.length}
            generateRoutine={generateRoutine}
            generationState={generationState}
            onAssignTemplate={assignTemplate}
            requestCoachSession={requestCoachSession}
            savePreferences={savePreferences}
            templates={templates}
            userPreferences={userPreferences}
            userRoutineCount={userRoutines.length}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

function DaySelector({
  activeDayId,
  days,
  onSelect,
}: {
  activeDayId: string;
  days: RoutineDay[];
  onSelect: (dayId: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.daySelector}>
        {days.map((day) => (
          <Pressable
            accessibilityRole="button"
            key={day.id}
            onPress={() => onSelect(day.id)}
            style={[styles.dayChip, day.id === activeDayId && styles.dayChipActive]}>
            <AppText style={[styles.dayChipTitle, day.id === activeDayId && styles.dayChipTitleActive]}>
              Day {day.dayNumber}
            </AppText>
            <AppText
              numberOfLines={1}
              style={[styles.dayChipMeta, day.id === activeDayId && styles.dayChipMetaActive]}>
              {day.focus}
            </AppText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function RoutineDayPlayer({
  completedExerciseIds,
  completedRoutineDayIds,
  day,
  dayIndex,
  finishRoutineDay,
  getLastSetLog,
  logSet,
  onToggleComplete,
  routine,
}: {
  completedExerciseIds: string[];
  completedRoutineDayIds: string[];
  day: RoutineDay;
  dayIndex: number;
  finishRoutineDay: (routineDayId: string) => void;
  getLastSetLog: (workoutExerciseId: string, setNumber?: number) => WorkoutSetLog | null;
  logSet: (
    workoutExerciseId: string,
    exerciseId: string,
    equipmentId: string,
    setNumber: number,
    targetReps: number,
    actualReps: number,
    weight: number,
  ) => void;
  onToggleComplete: (workoutExerciseId: string) => void;
  routine: UserRoutine;
}) {
  const { width } = useWindowDimensions();
  const { swapExercise } = useWorkoutStore();
  const [swapTarget, setSwapTarget] = useState<WorkoutExercise | null>(null);
  const cardWidth = Math.min(width - 32, 440);
  const completedCount = day.exercises.filter((exercise) =>
    completedExerciseIds.includes(exercise.id),
  ).length;
  const dayFinished = completedRoutineDayIds.includes(day.id);

  const chooseSwap = (recommendation: SwapRecommendation) => {
    if (!swapTarget) {
      return;
    }

    swapExercise(routine.id, day.id, swapTarget.id, recommendation);
    setSwapTarget(null);
  };

  return (
    <Card style={styles.playerShell}>
      <View style={styles.playerHeader}>
        <View style={styles.flex}>
          <Eyebrow>Routine player</Eyebrow>
          <AppText style={styles.playerTitle}>
            Day {dayIndex + 1}: {day.title}
          </AppText>
          <AppText style={styles.muted}>
            {dayFinished ? 'Finished' : `${completedCount} of ${day.exercises.length} completed`}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/workout/[id]', params: { id: routine.id } })}
          style={styles.focusButton}>
          <FontAwesome color={colors.accentDark} name="expand" size={15} />
        </Pressable>
      </View>

      <FlatList
        data={day.exercises.slice().sort((left, right) => left.position - right.position)}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseCard
            completed={completedExerciseIds.includes(item.id)}
            lastSetLog={getLastSetLog(item.id)}
            onLogSet={(weight) =>
              logSet(
                item.id,
                item.exerciseId,
                item.equipmentId,
                1,
                item.repsMax,
                item.repsMax,
                weight,
              )
            }
            onComplete={() => onToggleComplete(item.id)}
            onSwap={() => setSwapTarget(item)}
            width={cardWidth}
            workoutExercise={item}
          />
        )}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 12}
        decelerationRate="fast"
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />

      <SwapSheet
        onChoose={chooseSwap}
        onClose={() => setSwapTarget(null)}
        targetExercise={swapTarget}
        visible={Boolean(swapTarget)}
      />

      <View style={styles.finishRow}>
        <PrimaryButton
          icon="check"
          onPress={() => finishRoutineDay(day.id)}
          variant={dayFinished ? 'secondary' : 'primary'}>
          {dayFinished ? 'Day finished' : 'Finish day'}
        </PrimaryButton>
      </View>
    </Card>
  );
}

function ExerciseCard({
  completed,
  lastSetLog,
  onComplete,
  onLogSet,
  onSwap,
  width,
  workoutExercise,
}: {
  completed: boolean;
  lastSetLog: WorkoutSetLog | null;
  onComplete: () => void;
  onLogSet: (weight: number) => void;
  onSwap: () => void;
  width: number;
  workoutExercise: WorkoutExercise;
}) {
  const exercise = getExercise(workoutExercise.exerciseId);
  const machine = getEquipment(workoutExercise.equipmentId);
  const muscles = getPrimaryMuscleNames(workoutExercise.exerciseId);
  const [weight, setWeight] = useState(lastSetLog ? String(lastSetLog.weight) : '20.0');
  const parsedWeight = Number.parseFloat(weight);

  return (
    <View style={[styles.exerciseCard, { width }, completed && styles.exerciseCardDone]}>
      <View style={styles.mediaPlaceholder}>
        <View style={styles.placeholderFigure} />
        <View style={styles.placeholderBar} />
        <Pressable accessibilityRole="button" onPress={onComplete} style={styles.donePill}>
          <FontAwesome color={completed ? '#ffffff' : colors.accentDark} name="check" size={13} />
          <AppText style={[styles.doneText, completed && styles.doneTextActive]}>
            {completed ? 'Done' : 'Mark done'}
          </AppText>
        </Pressable>
      </View>

      <View style={styles.exerciseBody}>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <AppText style={styles.exerciseTitle}>{exercise.name}</AppText>
            <AppText style={styles.muted}>
              {machine.machineNumber ? `Station ${machine.machineNumber}` : 'Open floor'} · {machine.name}
            </AppText>
          </View>
          <Pressable accessibilityRole="button" onPress={onSwap} style={styles.swapButton}>
            <FontAwesome color={colors.blue} name="exchange" size={16} />
            <AppText style={styles.swapText}>Swap</AppText>
          </Pressable>
        </View>

        <View style={styles.rowWrap}>
          {muscles.slice(0, 2).map((muscle) => (
            <Pill key={muscle}>{muscle}</Pill>
          ))}
          <Pill>{workoutExercise.sets} sets</Pill>
          <Pill>{workoutExercise.repsMin}-{workoutExercise.repsMax} reps</Pill>
        </View>

        <View style={styles.playerControls}>
          <View style={styles.weightBox}>
            <AppText style={styles.controlLabel}>Weight</AppText>
            <View style={styles.weightInputRow}>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setWeight}
                style={styles.weightInput}
                value={weight}
              />
              <AppText style={styles.weightUnit}>kg</AppText>
            </View>
            {lastSetLog ? (
              <AppText style={styles.previousText}>
                Last: {lastSetLog.actualReps} reps · {lastSetLog.weight}kg
              </AppText>
            ) : null}
          </View>
          <View style={styles.restBox}>
            <AppText style={styles.controlLabel}>Rest</AppText>
            <AppText style={styles.restValue}>{formatSeconds(workoutExercise.restSeconds)}</AppText>
          </View>
        </View>
        <PrimaryButton
          icon="save"
          onPress={() => {
            onLogSet(Number.isFinite(parsedWeight) ? parsedWeight : 0);
            onComplete();
          }}
          variant="secondary">
          Log set 1
        </PrimaryButton>
      </View>
    </View>
  );
}

function SwapSheet({
  onChoose,
  onClose,
  targetExercise,
  visible,
}: {
  onChoose: (recommendation: SwapRecommendation) => void;
  onClose: () => void;
  targetExercise: WorkoutExercise | null;
  visible: boolean;
}) {
  const recommendations = targetExercise
    ? getSwapRecommendations(targetExercise.exerciseId)
    : [];

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.sheetBackdrop}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.sheetScrim} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Eyebrow>Exercise swaps</Eyebrow>
              <AppText style={styles.sheetTitle}>
                {targetExercise ? getExercise(targetExercise.exerciseId).name : 'Swap'}
              </AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <FontAwesome color={colors.ink} name="close" size={20} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetList}>
            {recommendations.length ? (
              recommendations.map((recommendation) => (
                <Pressable
                  accessibilityRole="button"
                  key={`${recommendation.source}-${recommendation.exercise.id}`}
                  onPress={() => onChoose(recommendation)}
                  style={styles.swapOption}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flex}>
                      <AppText style={styles.cardTitle}>{recommendation.exercise.name}</AppText>
                      <AppText style={styles.muted}>
                        {recommendation.equipment.machineNumber
                          ? `Station ${recommendation.equipment.machineNumber}`
                          : 'Open floor'}{' '}
                        · {recommendation.equipment.name}
                      </AppText>
                    </View>
                    <Pill tone={recommendation.source === 'trainer_approved' ? 'gold' : 'neutral'}>
                      {recommendation.source === 'trainer_approved' ? 'coach' : 'match'}
                    </Pill>
                  </View>
                  <AppText style={styles.muted}>{recommendation.reason}</AppText>
                </Pressable>
              ))
            ) : (
              <AppText style={styles.muted}>No similar Ratner exercise is mapped yet.</AppText>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function NoRoutineStart({
  coachRequestCount,
  generateRoutine,
  generationState,
  onAssignTemplate,
  requestCoachSession,
  savePreferences,
  templates,
  userPreferences,
}: {
  coachRequestCount: number;
  generateRoutine: (preferences: Partial<UserPreferences>) => void;
  generationState: ReturnType<typeof useWorkoutStore>['generationState'];
  onAssignTemplate: (templateId: string) => void;
  requestCoachSession: (goal: Goal, experienceLevel: ExperienceLevel) => void;
  savePreferences: (preferences: Partial<UserPreferences>) => void;
  templates: ReturnType<typeof useWorkoutStore>['templates'];
  userPreferences: ReturnType<typeof useWorkoutStore>['userPreferences'];
  userRoutineCount: number;
}) {
  const [goal, setGoal] = useState<Goal>(userPreferences.goal);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    userPreferences.experienceLevel,
  );
  const [preferredEquipment, setPreferredEquipment] = useState<EquipmentPreference>(
    userPreferences.preferredEquipment,
  );
  const [comfortLevel, setComfortLevel] = useState<ComfortLevel>(userPreferences.comfortLevel);
  const [daysPerWeek, setDaysPerWeek] = useState(userPreferences.daysPerWeek);
  const [sessionLengthMinutes, setSessionLengthMinutes] = useState(
    userPreferences.sessionLengthMinutes,
  );

  const preferences = {
    goal,
    experienceLevel,
    preferredEquipment,
    comfortLevel,
    daysPerWeek,
    sessionLengthMinutes,
  };

  return (
    <>
      <Card style={styles.emptyHero}>
        <Eyebrow>No routine saved</Eyebrow>
        <AppText style={styles.heroTitle}>Generate your first routine.</AppText>
        <AppText style={styles.muted}>
          V2 uses your goal, schedule, and comfort level to build a Ratner-aware routine.
        </AppText>
        {generationState.message ? (
          <View style={styles.generationNotice}>
            <Pill tone={generationState.source === 'fallback' ? 'gold' : 'accent'}>
              {generationState.source ?? generationState.status}
            </Pill>
            <AppText style={styles.muted}>{generationState.message}</AppText>
          </View>
        ) : null}
      </Card>

      <View style={styles.optionGrid}>
        <Card style={styles.planCard}>
          <Eyebrow>Default routines</Eyebrow>
          {templates.map((template) => (
            <View key={template.id} style={styles.templateRow}>
              <View style={styles.flex}>
                <AppText style={styles.cardTitle}>{template.title}</AppText>
                <AppText style={styles.muted}>
                  {template.days.length} days · {getTemplateExerciseCount(template)} moves
                </AppText>
              </View>
              <PrimaryButton icon="plus" onPress={() => onAssignTemplate(template.id)} variant="secondary">
                Use
              </PrimaryButton>
            </View>
          ))}
        </Card>

        <Card style={styles.planCard}>
          <Eyebrow>1. Goal and level</Eyebrow>
          <OptionChips options={goalOptions} selected={goal} onSelect={setGoal} />
          <OptionChips
            options={experienceOptions}
            selected={experienceLevel}
            onSelect={setExperienceLevel}
          />
          <Eyebrow>2. Schedule</Eyebrow>
          <View style={styles.metricChooser}>
            {dayOptions.map((days) => (
              <Pressable
                accessibilityRole="button"
                key={days}
                onPress={() => setDaysPerWeek(days)}
                style={[styles.metricButton, days === daysPerWeek && styles.metricButtonActive]}>
                <AppText
                  style={[
                    styles.metricValue,
                    days === daysPerWeek && styles.metricValueActive,
                  ]}>
                  {days}
                </AppText>
                <AppText style={styles.metricLabel}>days/wk</AppText>
              </Pressable>
            ))}
          </View>
          <View style={styles.metricChooser}>
            {sessionLengthOptions.map((minutes) => (
              <Pressable
                accessibilityRole="button"
                key={minutes}
                onPress={() => setSessionLengthMinutes(minutes)}
                style={[
                  styles.metricButton,
                  minutes === sessionLengthMinutes && styles.metricButtonActive,
                ]}>
                <AppText
                  style={[
                    styles.metricValue,
                    minutes === sessionLengthMinutes && styles.metricValueActive,
                  ]}>
                  {minutes}
                </AppText>
                <AppText style={styles.metricLabel}>min</AppText>
              </Pressable>
            ))}
          </View>
          <Eyebrow>3. Equipment and comfort</Eyebrow>
          <OptionChips
            options={equipmentPreferenceOptions}
            selected={preferredEquipment}
            onSelect={setPreferredEquipment}
          />
          <OptionChips options={comfortOptions} selected={comfortLevel} onSelect={setComfortLevel} />
        </Card>

        <Card style={styles.planCard}>
          <AppText style={styles.cardTitle}>AI routine recommendation</AppText>
          <AppText style={styles.muted}>
            Uses constrained catalog IDs. If AI is unavailable, a deterministic fallback still creates a valid routine.
          </AppText>
          <PrimaryButton
            icon="magic"
            onPress={() => generateRoutine(preferences)}>
            Generate routine
          </PrimaryButton>
          <PrimaryButton
            icon="save"
            onPress={() => savePreferences({ ...preferences, onboardingCompleted: true })}
            variant="ghost">
            Save preferences
          </PrimaryButton>
        </Card>

        <Card style={styles.planCard}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <AppText style={styles.cardTitle}>Schedule with a coach</AppText>
              <AppText style={styles.muted}>
                {coachRequestCount ? 'Request saved locally.' : 'Ask a trainer to review your setup.'}
              </AppText>
            </View>
            <Pill tone={coachRequestCount ? 'accent' : 'neutral'}>
              {coachRequestCount ? 'sent' : 'v2'}
            </Pill>
          </View>
          <PrimaryButton
            icon="calendar"
            onPress={() => {
              savePreferences({ ...preferences, onboardingCompleted: true });
              requestCoachSession(goal, experienceLevel);
            }}
            variant="secondary">
            Request coach
          </PrimaryButton>
        </Card>
      </View>
    </>
  );
}

function OptionChips<T extends string>({
  onSelect,
  options,
  selected,
}: {
  onSelect: (value: T) => void;
  options: { label: string; value: T }[];
  selected: T;
}) {
  return (
    <View style={styles.rowWrap}>
      {options.map((option) => (
        <Pressable
          accessibilityRole="button"
          key={option.value}
          onPress={() => onSelect(option.value)}
          style={[styles.optionChip, option.value === selected && styles.optionChipActive]}>
          <AppText
            style={[styles.optionChipText, option.value === selected && styles.optionChipTextActive]}>
            {option.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    gap: 16,
    maxWidth: 520,
    padding: 16,
    paddingBottom: 96,
    paddingTop: 8,
    width: '100%',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  statusStrip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: 12,
  },
  statusCell: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statusDivider: {
    backgroundColor: colors.border,
    height: 34,
    width: 1,
  },
  statusValue: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
  routineHeader: {
    gap: 14,
  },
  playerShell: {
    gap: 14,
    paddingHorizontal: 0,
  },
  playerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
  },
  playerTitle: {
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24,
  },
  focusButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  daySelector: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 2,
  },
  dayChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 108,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  dayChipActive: {
    backgroundColor: '#e7f3ed',
    borderColor: colors.accent,
  },
  dayChipTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  dayChipTitleActive: {
    color: colors.accentDark,
  },
  dayChipMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  dayChipMetaActive: {
    color: colors.ink,
  },
  exerciseCard: {
    backgroundColor: '#fbfcf8',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 14,
    overflow: 'hidden',
  },
  exerciseCardDone: {
    opacity: 0.78,
  },
  mediaPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#dce3dd',
    height: 150,
    justifyContent: 'center',
  },
  placeholderFigure: {
    backgroundColor: '#8f7b68',
    borderRadius: 999,
    height: 96,
    opacity: 0.85,
    width: 46,
  },
  placeholderBar: {
    backgroundColor: '#47524b',
    borderRadius: 999,
    height: 12,
    marginTop: -47,
    width: 150,
  },
  donePill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 10,
    position: 'absolute',
    right: 10,
    top: 10,
  },
  doneText: {
    color: colors.accentDark,
    fontSize: 12,
    fontWeight: '900',
  },
  doneTextActive: {
    color: colors.ink,
  },
  exerciseBody: {
    gap: 13,
    padding: 14,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
  },
  playerControls: {
    flexDirection: 'row',
    gap: 10,
  },
  finishRow: {
    paddingHorizontal: 14,
  },
  weightBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    flex: 1,
    padding: 11,
  },
  restBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    minWidth: 100,
    padding: 11,
  },
  controlLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  weightInputRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 4,
  },
  weightInput: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    minWidth: 62,
    padding: 0,
  },
  weightUnit: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  previousText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  restValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },
  swapButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    gap: 3,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 58,
  },
  swapText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  secondarySection: {
    gap: 12,
    marginTop: 4,
  },
  sectionHeader: {
    gap: 4,
  },
  optionGrid: {
    gap: 12,
  },
  planCard: {
    gap: 12,
  },
  templateRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
  },
  emptyHero: {
    gap: 8,
  },
  generationNotice: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    gap: 8,
    padding: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  muted: {
    color: colors.muted,
  },
  rowBetween: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricChooser: {
    flexDirection: 'row',
    gap: 8,
  },
  metricButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 62,
    justifyContent: 'center',
  },
  metricButtonActive: {
    backgroundColor: '#e7f3ed',
    borderColor: colors.accent,
  },
  metricValue: {
    color: colors.muted,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 23,
  },
  metricValueActive: {
    color: colors.accentDark,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  optionChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  optionChipActive: {
    backgroundColor: '#e7f3ed',
    borderColor: colors.accent,
  },
  optionChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  optionChipTextActive: {
    color: colors.accentDark,
  },
  flex: {
    flex: 1,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetScrim: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '72%',
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 5,
    marginBottom: 16,
    width: 46,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginTop: 2,
  },
  closeButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sheetList: {
    gap: 10,
    paddingTop: 18,
  },
  swapOption: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 13,
  },
});
