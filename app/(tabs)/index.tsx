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

  const openWorkout = (workoutId: string) => {
    router.push({
      pathname: '/workout/[id]',
      params: { id: workoutId },
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Eyebrow>Today at Ratner</Eyebrow>
            <Title>Workouts</Title>
            <AppText style={styles.muted}>
              {profile?.displayName ?? 'Student'} is using{' '}
              {authMode === 'demo' ? 'local demo data' : 'Clerk + Supabase-ready auth'}.
            </AppText>
          </View>
          <PrimaryButton onPress={signOut} variant="ghost">
            Sign out
          </PrimaryButton>
        </View>

        {activeWorkout ? (
          <CurrentWorkoutSummary workout={activeWorkout} onStart={() => openWorkout(activeWorkout.id)} />
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eyebrow>Trainer recommendations</Eyebrow>
            <AppText style={styles.muted}>Choose a trainer-built plan, then launch the focused player.</AppText>
          </View>
          {templates.map((template) => (
            <Card key={template.id} style={styles.stack}>
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
              <PrimaryButton onPress={() => assignTemplate(template.id)} variant="secondary">
                Copy to my workouts
              </PrimaryButton>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eyebrow>Your workouts</Eyebrow>
            <AppText style={styles.muted}>Assigned and self-built workouts stay editable.</AppText>
          </View>
          {userWorkouts.map((workout) => (
            <Card key={workout.id} style={styles.stack}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <AppText style={styles.cardTitle}>{workout.title}</AppText>
                  <AppText style={styles.muted}>
                    {workout.exercises.length} exercises · {workout.status}
                  </AppText>
                </View>
                <Pill>{workout.sourceTemplateId ? 'trainer' : 'manual'}</Pill>
              </View>
              <PrimaryButton onPress={() => openWorkout(workout.id)}>
                Start workout
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
    <Card style={styles.heroCard}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Eyebrow>Active workout</Eyebrow>
          <AppText style={styles.heroTitle}>{workout.title}</AppText>
          <AppText style={styles.muted}>
            {workout.exercises.length} exercises queued
            {exercise && machine
              ? ` · starts with ${exercise.name} on ${
                  machine.machineNumber ? `machine ${machine.machineNumber}` : machine.name
                }`
              : ''}
          </AppText>
        </View>
        <Pill tone="gold">{workout.status}</Pill>
      </View>
      <PrimaryButton onPress={onStart}>Open player</PrimaryButton>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 22,
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  stack: {
    gap: 12,
  },
  heroCard: {
    gap: 16,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 27,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
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
  flex: {
    flex: 1,
  },
});
