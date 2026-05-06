import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

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
import { getEquipment, getExercise } from '@/lib/recommendations';
import { useWorkoutStore } from '@/lib/workout-store';
import { UserWorkout } from '@/lib/types';

export default function WorkoutsScreen() {
  const { authMode, profile, signOut } = useHammersharkAuth();
  const { activeWorkout, assignTemplate, templates, userWorkouts } = useWorkoutStore();
  const firstName = profile?.displayName?.split(' ')[0] ?? 'Student';

  const openWorkout = (workoutId: string) => {
    router.push({
      pathname: '/workout/[id]',
      params: { id: workoutId },
    });
  };

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

        <View style={styles.statusStrip}>
          <View style={styles.statusCell}>
            <AppText style={styles.statusValue}>{userWorkouts.length}</AppText>
            <AppText style={styles.statusLabel}>workouts</AppText>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusCell}>
            <AppText style={styles.statusValue}>{templates.length}</AppText>
            <AppText style={styles.statusLabel}>coach picks</AppText>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusCell}>
            <AppText style={styles.statusValue}>{authMode === 'demo' ? 'Demo' : 'Live'}</AppText>
            <AppText style={styles.statusLabel}>{firstName}</AppText>
          </View>
        </View>

        {activeWorkout ? (
          <CurrentWorkoutSummary workout={activeWorkout} onStart={() => openWorkout(activeWorkout.id)} />
        ) : (
          <Card style={styles.emptyHero}>
            <Eyebrow>Ready when you are</Eyebrow>
            <AppText style={styles.heroTitle}>Pick a plan or start from the map.</AppText>
          </Card>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eyebrow>Coach picks</Eyebrow>
            <AppText style={styles.muted}>Reusable Ratner plans.</AppText>
          </View>
          {templates.map((template) => (
            <Card key={template.id} style={styles.planCard}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <AppText style={styles.cardTitle}>{template.title}</AppText>
                  <AppText style={styles.muted}>{template.description}</AppText>
                </View>
                <Pill tone="accent">{template.exercises.length} moves</Pill>
              </View>
              <View style={styles.rowWrap}>
                <Pill>{template.goal.replace('_', ' ')}</Pill>
                <Pill>{template.experienceLevel}</Pill>
              </View>
              <PrimaryButton icon="plus" onPress={() => assignTemplate(template.id)} variant="secondary">
                Add plan
              </PrimaryButton>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eyebrow>Your workouts</Eyebrow>
            <AppText style={styles.muted}>Jump back in fast.</AppText>
          </View>
          {userWorkouts.map((workout) => (
            <Card key={workout.id} style={styles.planCard}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <AppText style={styles.cardTitle}>{workout.title}</AppText>
                  <AppText style={styles.muted}>
                    {workout.exercises.length} exercises · {workout.status}
                  </AppText>
                </View>
                <Pill>{workout.sourceTemplateId ? 'trainer' : 'manual'}</Pill>
              </View>
              <PrimaryButton icon="play" onPress={() => openWorkout(workout.id)}>
                Start
              </PrimaryButton>
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function CurrentWorkoutSummary({
  workout,
  onStart,
}: {
  workout: UserWorkout;
  onStart: () => void;
}) {
  const firstExercise = workout.exercises[0];
  const exercise = firstExercise ? getExercise(firstExercise.exerciseId) : null;
  const machine = firstExercise ? getEquipment(firstExercise.equipmentId) : null;

  return (
    <Card style={styles.activeCard}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Eyebrow>Up next</Eyebrow>
          <AppText style={styles.heroTitle}>{workout.title}</AppText>
          {exercise && machine ? (
            <AppText style={styles.muted}>
              Start with {exercise.name} ·{' '}
              {machine.machineNumber ? `machine ${machine.machineNumber}` : machine.name}
            </AppText>
          ) : null}
        </View>
        <Pill tone="gold">{workout.status}</Pill>
      </View>
      <View style={styles.activeMeta}>
        <AppText style={styles.activeMetaValue}>{workout.exercises.length}</AppText>
        <AppText style={styles.activeMetaLabel}>exercises queued</AppText>
      </View>
      <PrimaryButton icon="play" onPress={onStart}>Open player</PrimaryButton>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    gap: 18,
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
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  planCard: {
    gap: 12,
  },
  activeCard: {
    backgroundColor: '#fbfcf8',
    borderColor: '#c8d8cd',
    gap: 16,
  },
  emptyHero: {
    gap: 8,
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
  activeMeta: {
    alignItems: 'baseline',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  activeMetaValue: {
    color: colors.accentDark,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  activeMetaLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
});
