import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { useHammersharkAuth } from '@/lib/auth';
import {
  getEquipment,
  getExercise,
  getPrimaryMuscleNames,
  getSwapRecommendations,
} from '@/lib/recommendations';
import { useWorkoutStore } from '@/lib/workout-store';
import { SwapRecommendation, UserWorkout, WorkoutExercise } from '@/lib/types';

const playerColors = {
  bg: '#111815',
  card: '#fbfcf8',
  cardMuted: '#eef2ed',
  ink: '#14211c',
  muted: '#617066',
  line: '#dbe3dc',
  accent: '#e4a11b',
  accentDark: '#8d650f',
  darkControl: '#0f6f56',
  blue: '#22577a',
  white: '#ffffff',
};

export default function WorkoutPlayerScreen() {
  const { isLoaded, isSignedIn } = useHammersharkAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { setActiveWorkoutId, userWorkouts } = useWorkoutStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);
  const [swapTarget, setSwapTarget] = useState<WorkoutExercise | null>(null);
  const { width } = useWindowDimensions();

  const workout = userWorkouts.find((item) => item.id === id) ?? null;
  const orderedExercises = useMemo(
    () => workout?.exercises.slice().sort((left, right) => left.position - right.position) ?? [],
    [workout],
  );
  const cardGap = 12;
  const cardWidth = Math.min(width - 32, 440);
  const completedCount = orderedExercises.filter((exercise) =>
    completedExerciseIds.includes(exercise.id),
  ).length;

  if (isLoaded && !isSignedIn) {
    return <Redirect href="/auth" />;
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.player}>
        <View style={styles.emptyState}>
          <AppText style={styles.emptyTitle}>Workout not found</AppText>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <FontAwesome color={playerColors.white} name="arrow-left" size={22} />
            <AppText style={styles.iconButtonText}>Back</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const completeExercise = (workoutExerciseId: string) => {
    setCompletedExerciseIds((current) =>
      current.includes(workoutExerciseId)
        ? current.filter((item) => item !== workoutExerciseId)
        : [...current, workoutExerciseId],
    );
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + cardGap));
    setActiveIndex(Math.max(0, Math.min(nextIndex, orderedExercises.length - 1)));
  };

  const closePlayer = () => {
    setActiveWorkoutId(workout.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.player}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={closePlayer} style={styles.headerIcon}>
          <FontAwesome color={playerColors.white} name="arrow-left" size={24} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText numberOfLines={1} style={styles.headerTitle}>
            {workout.title}
          </AppText>
          <AppText style={styles.progressText}>
            {completedCount} of {orderedExercises.length} completed
          </AppText>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.carouselWrap}>
        <FlatList
          data={orderedExercises}
          horizontal
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={handleMomentumEnd}
          renderItem={({ item }) => (
            <ExercisePlayerCard
              cardWidth={cardWidth}
              completed={completedExerciseIds.includes(item.id)}
              onComplete={() => completeExercise(item.id)}
              onSwap={() => setSwapTarget(item)}
              workout={workout}
              workoutExercise={item}
            />
          )}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={cardWidth + cardGap}
          decelerationRate="fast"
          ItemSeparatorComponent={() => <View style={{ width: cardGap }} />}
          contentContainerStyle={styles.carouselContent}
        />
      </View>

      <View style={styles.dots}>
        {orderedExercises.map((exercise, index) => (
          <View
            key={exercise.id}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      <SwapSheet
        onClose={() => setSwapTarget(null)}
        targetExercise={swapTarget}
        visible={Boolean(swapTarget)}
        workout={workout}
      />
    </SafeAreaView>
  );
}

function ExercisePlayerCard({
  cardWidth,
  completed,
  onComplete,
  onSwap,
  workoutExercise,
}: {
  cardWidth: number;
  completed: boolean;
  onComplete: () => void;
  onSwap: () => void;
  workout: UserWorkout;
  workoutExercise: WorkoutExercise;
}) {
  const exercise = getExercise(workoutExercise.exerciseId);
  const machine = getEquipment(workoutExercise.equipmentId);
  const primaryMuscles = getPrimaryMuscleNames(workoutExercise.exerciseId);
  const [weight, setWeight] = useState('20.0');

  return (
    <View style={[styles.exerciseCard, { width: cardWidth }, completed && styles.exerciseCardDone]}>
      <View style={styles.media}>
        {exercise.thumbnailUrl ? (
          <Image source={{ uri: exercise.thumbnailUrl }} style={styles.mediaImage} />
        ) : (
          <View style={styles.mediaPlaceholder}>
            <View style={styles.placeholderFigure} />
            <View style={styles.placeholderBar} />
          </View>
        )}
        <View style={styles.playButton}>
          <FontAwesome color={playerColors.ink} name="play" size={30} style={styles.playIcon} />
        </View>
        <Pressable accessibilityRole="checkbox" onPress={onComplete} style={styles.doneButton}>
          <View style={[styles.doneBox, completed && styles.doneBoxChecked]}>
            {completed ? <FontAwesome color={playerColors.white} name="check" size={17} /> : null}
          </View>
          <AppText style={styles.doneText}>{completed ? 'DONE' : 'DONE?'}</AppText>
        </Pressable>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.exerciseTitleRow}>
          <View style={styles.exerciseTitleCopy}>
            <AppText numberOfLines={2} style={styles.exerciseTitle}>
              {exercise.name}
            </AppText>
            <AppText numberOfLines={1} style={styles.machineText}>
              {machine.machineNumber ? `Machine ${machine.machineNumber}` : 'Shared station'} ·{' '}
              {machine.name}
            </AppText>
          </View>
          <Pressable accessibilityRole="button" onPress={onSwap} style={styles.swapButton}>
            <FontAwesome color={playerColors.blue} name="exchange" size={18} />
            <AppText style={styles.swapText}>Swap</AppText>
          </Pressable>
        </View>

        <View style={styles.muscleRow}>
          {primaryMuscles.slice(0, 3).map((muscle) => (
            <AppText key={muscle} style={styles.musclePill}>
              {muscle}
            </AppText>
          ))}
        </View>

        <View style={styles.prescriptionRow}>
          <View>
            <AppText style={styles.prescriptionLabel}>sets</AppText>
            <AppText style={styles.prescriptionValue}>{workoutExercise.sets}x</AppText>
          </View>
          <View>
            <AppText style={styles.prescriptionLabel}>reps</AppText>
            <AppText style={styles.prescriptionValue}>
              {workoutExercise.repsMin} to {workoutExercise.repsMax}
            </AppText>
          </View>
        </View>

        <View style={styles.restStrip}>
          <View style={styles.restLabel}>
            <AppText style={styles.restLabelText}>{completed ? 'DONE' : 'REST'}</AppText>
          </View>
          <View style={styles.restTime}>
            <AppText style={styles.restTimeText}>{formatSeconds(workoutExercise.restSeconds)}</AppText>
          </View>
          <View style={styles.restToggle}>
            <FontAwesome
              color={playerColors.white}
              name={completed ? 'check-square-o' : 'square-o'}
              size={18}
            />
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.weightBox}>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setWeight}
              style={styles.weightInput}
              value={weight}
            />
            <AppText style={styles.weightUnit}>kg</AppText>
          </View>
          <View style={styles.notesBox}>
            <FontAwesome color={playerColors.ink} name="sticky-note-o" size={18} />
            <AppText style={styles.notesText}>notes</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

function SwapSheet({
  onClose,
  targetExercise,
  visible,
  workout,
}: {
  onClose: () => void;
  targetExercise: WorkoutExercise | null;
  visible: boolean;
  workout: UserWorkout;
}) {
  const { swapExercise } = useWorkoutStore();
  const recommendations = targetExercise
    ? getSwapRecommendations(targetExercise.exerciseId)
    : [];

  const chooseSwap = (recommendation: SwapRecommendation) => {
    if (!targetExercise) {
      return;
    }

    swapExercise(workout.id, targetExercise.id, recommendation);
    onClose();
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.sheetBackdrop}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.sheetScrim} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <AppText style={styles.sheetEyebrow}>Exercise swaps</AppText>
              <AppText style={styles.sheetTitle}>
                {targetExercise ? getExercise(targetExercise.exerciseId).name : 'Swap'}
              </AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <FontAwesome color={playerColors.ink} name="close" size={20} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetList}>
            {recommendations.length ? (
              recommendations.map((recommendation) => (
                <Pressable
                  accessibilityRole="button"
                  key={`${recommendation.source}-${recommendation.exercise.id}`}
                  onPress={() => chooseSwap(recommendation)}
                  style={styles.swapOption}>
                  <View style={styles.swapOptionHeader}>
                    <View style={styles.swapOptionCopy}>
                      <AppText style={styles.swapOptionTitle}>{recommendation.exercise.name}</AppText>
                      <AppText style={styles.swapOptionMeta}>
                        {recommendation.equipment.machineNumber
                          ? `Machine ${recommendation.equipment.machineNumber}`
                          : 'Open floor'}{' '}
                        · {recommendation.equipment.name}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.swapSourceBadge,
                        recommendation.source === 'trainer_approved' && styles.swapSourceTrainer,
                      ]}>
                      <AppText
                        style={[
                          styles.swapSourceText,
                          recommendation.source === 'trainer_approved' &&
                            styles.swapSourceTrainerText,
                        ]}>
                        {recommendation.source === 'trainer_approved' ? 'trainer' : 'catalog'}
                      </AppText>
                    </View>
                  </View>
                  <AppText style={styles.swapReason}>{recommendation.reason}</AppText>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptySwap}>
                <AppText style={styles.swapReason}>No similar Ratner exercise is mapped yet.</AppText>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  player: {
    backgroundColor: playerColors.bg,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: '#1b2722',
    borderColor: '#2d3a34',
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerSpacer: {
    height: 44,
    width: 44,
  },
  headerCopy: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    color: playerColors.white,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  progressText: {
    color: playerColors.accent,
    fontSize: 13,
    fontWeight: '900',
  },
  carouselWrap: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 10,
  },
  carouselContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  exerciseCard: {
    backgroundColor: playerColors.card,
    borderRadius: 8,
    boxShadow: '0px 14px 24px rgba(0, 0, 0, 0.24)',
    elevation: 6,
    overflow: 'hidden',
  },
  exerciseCardDone: {
    opacity: 0.82,
  },
  media: {
    backgroundColor: '#dce3dd',
    height: 184,
    overflow: 'visible',
  },
  mediaImage: {
    height: '100%',
    width: '100%',
  },
  mediaPlaceholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  placeholderFigure: {
    backgroundColor: '#98806e',
    borderRadius: 999,
    height: 112,
    opacity: 0.85,
    width: 52,
  },
  placeholderBar: {
    backgroundColor: '#4f5357',
    borderRadius: 999,
    height: 14,
    marginTop: -54,
    width: 168,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: playerColors.white,
    borderRadius: 999,
    height: 58,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -29,
    position: 'absolute',
    top: 63,
    width: 58,
  },
  playIcon: {
    marginLeft: 6,
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: playerColors.white,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 36,
    paddingHorizontal: 10,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  doneBox: {
    alignItems: 'center',
    backgroundColor: playerColors.cardMuted,
    borderColor: playerColors.line,
    borderRadius: 6,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  doneBoxChecked: {
    backgroundColor: playerColors.darkControl,
    borderColor: playerColors.darkControl,
  },
  doneText: {
    color: playerColors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  cardBody: {
    paddingTop: 18,
  },
  exerciseTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  exerciseTitleCopy: {
    flex: 1,
  },
  exerciseTitle: {
    color: playerColors.ink,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
  },
  machineText: {
    color: playerColors.muted,
    fontSize: 13,
    marginTop: 5,
  },
  swapButton: {
    alignItems: 'center',
    backgroundColor: playerColors.cardMuted,
    borderRadius: 8,
    gap: 3,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 58,
  },
  swapText: {
    color: playerColors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  musclePill: {
    backgroundColor: '#f4ead4',
    borderRadius: 999,
    color: playerColors.accentDark,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  prescriptionRow: {
    backgroundColor: playerColors.cardMuted,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 28,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  prescriptionLabel: {
    color: playerColors.accentDark,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'lowercase',
  },
  prescriptionValue: {
    color: playerColors.ink,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  restStrip: {
    borderRadius: 7,
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    minHeight: 54,
    overflow: 'hidden',
  },
  restLabel: {
    alignItems: 'center',
    backgroundColor: playerColors.accent,
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  restLabelText: {
    color: playerColors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  restTime: {
    alignItems: 'flex-end',
    backgroundColor: playerColors.cardMuted,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  restTimeText: {
    color: playerColors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  restToggle: {
    alignItems: 'center',
    backgroundColor: playerColors.darkControl,
    justifyContent: 'center',
    width: 58,
  },
  footerRow: {
    borderTopColor: playerColors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: 16,
    minHeight: 60,
  },
  weightBox: {
    alignItems: 'center',
    borderRightColor: playerColors.line,
    borderRightWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  weightInput: {
    color: '#6d6f73',
    fontSize: 22,
    fontWeight: '900',
    minWidth: 74,
    textAlign: 'right',
  },
  weightUnit: {
    color: '#6d6f73',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 2,
  },
  notesBox: {
    alignItems: 'center',
    flex: 0.8,
    gap: 3,
    justifyContent: 'center',
  },
  notesText: {
    color: playerColors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    justifyContent: 'center',
    paddingBottom: 22,
  },
  dot: {
    backgroundColor: '#686868',
    borderRadius: 999,
    height: 9,
    width: 9,
  },
  dotActive: {
    backgroundColor: playerColors.accent,
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
    backgroundColor: playerColors.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '72%',
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#c7c7c7',
    borderRadius: 999,
    height: 5,
    marginBottom: 16,
    width: 46,
  },
  sheetHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sheetEyebrow: {
    color: playerColors.accentDark,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sheetTitle: {
    color: playerColors.ink,
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
    backgroundColor: playerColors.white,
    borderColor: playerColors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 13,
  },
  swapOptionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  swapOptionCopy: {
    flex: 1,
  },
  swapOptionTitle: {
    color: playerColors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  swapOptionMeta: {
    color: playerColors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  swapSourceBadge: {
    backgroundColor: playerColors.cardMuted,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  swapSourceTrainer: {
    backgroundColor: '#f7df9f',
  },
  swapSourceText: {
    color: playerColors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  swapSourceTrainerText: {
    color: playerColors.accentDark,
  },
  swapReason: {
    color: playerColors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  emptySwap: {
    paddingVertical: 18,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: playerColors.white,
    fontSize: 24,
    fontWeight: '900',
  },
  iconButton: {
    alignItems: 'center',
    borderColor: '#393939',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  iconButtonText: {
    color: playerColors.white,
    fontWeight: '900',
  },
});
