import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { exercises } from '@/data/demoData';
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
import { getEquipment, getPrimaryMuscleNames } from '@/lib/recommendations';
import { useWorkoutStore } from '@/lib/workout-store';

export default function TrainerScreen() {
  const { profile, signOut } = useHammersharkAuth();
  const { createTrainerTemplate, templates } = useWorkoutStore();
  const [title, setTitle] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([
    'ex-leg-press',
    'ex-chest-press',
    'ex-lat-pulldown',
  ]);

  const isTrainer = profile?.role === 'trainer';

  const selectedCount = selectedExerciseIds.length;
  const canCreate = title.trim().length > 2 && selectedCount > 0;

  const toggleExercise = (exerciseId: string) => {
    setSelectedExerciseIds((current) =>
      current.includes(exerciseId)
        ? current.filter((item) => item !== exerciseId)
        : [...current, exerciseId],
    );
  };

  const submit = () => {
    createTrainerTemplate(title, selectedExerciseIds);
    setTitle('');
  };

  const trainerTemplates = useMemo(
    () => templates.filter((template) => template.createdBy === 'profile-trainer-demo'),
    [templates],
  );

  if (!isTrainer) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Eyebrow>Protected mode</Eyebrow>
            <Title>Trainer tools</Title>
            <AppText style={styles.muted}>
              Trainer editing is protected by the profile role. In local demo mode, sign out and
              continue as trainer to use this screen.
            </AppText>
          </View>
          <Card style={styles.stack}>
            <AppText style={styles.cardTitle}>Current role: {profile?.role ?? 'none'}</AppText>
            <AppText style={styles.muted}>
              Supabase RLS will enforce the same boundary when the database is connected.
            </AppText>
            <PrimaryButton onPress={signOut} variant="secondary">
              Sign out
            </PrimaryButton>
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Eyebrow>Admin scaffold</Eyebrow>
          <Title>Trainer tools</Title>
          <AppText style={styles.muted}>
            Create reusable templates from the mapped Ratner exercise catalog. Assignments are
            copied into the user workout list.
          </AppText>
        </View>

        <Card style={styles.stack}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <AppText style={styles.cardTitle}>New workout template</AppText>
              <AppText style={styles.muted}>{selectedCount} selected exercises</AppText>
            </View>
            <Pill tone="accent">trainer</Pill>
          </View>

          <TextInput
            onChangeText={setTitle}
            placeholder="Template title"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={title}
          />

          <View style={styles.exercisePicker}>
            {exercises.map((exercise) => {
              const selected = selectedExerciseIds.includes(exercise.id);
              const muscles = getPrimaryMuscleNames(exercise.id);

              return (
                <Card key={exercise.id} style={selected ? styles.selectedExercise : styles.exerciseOption}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flex}>
                      <AppText style={styles.cardTitle}>{exercise.name}</AppText>
                      <AppText style={styles.muted}>{muscles.join(', ') || exercise.movementPattern}</AppText>
                    </View>
                    <Pill tone={selected ? 'accent' : 'neutral'}>{selected ? 'selected' : 'add'}</Pill>
                  </View>
                  <PrimaryButton onPress={() => toggleExercise(exercise.id)} variant="ghost">
                    {selected ? 'Remove' : 'Add'}
                  </PrimaryButton>
                </Card>
              );
            })}
          </View>

          <PrimaryButton disabled={!canCreate} onPress={submit}>
            Create template
          </PrimaryButton>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eyebrow>Existing trainer templates</Eyebrow>
            <AppText style={styles.muted}>These are reusable source plans, not user logs.</AppText>
          </View>
          {trainerTemplates.map((template) => (
            <Card key={template.id} style={styles.stack}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <AppText style={styles.cardTitle}>{template.title}</AppText>
                  <AppText style={styles.muted}>{template.description}</AppText>
                </View>
                <Pill>{template.exercises.length} moves</Pill>
              </View>
              {template.exercises.map((templateExercise) => {
                const exercise = exercises.find((item) => item.id === templateExercise.exerciseId);
                const equipment = getEquipment(templateExercise.equipmentId);

                return (
                  <AppText key={templateExercise.id} style={styles.muted}>
                    {templateExercise.position}. {exercise?.name ?? 'Unknown exercise'} ·{' '}
                    {equipment.machineNumber ? `Machine ${equipment.machineNumber}` : equipment.name}
                  </AppText>
                );
              })}
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 22,
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    gap: 6,
  },
  muted: {
    color: colors.muted,
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
  rowBetween: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  exercisePicker: {
    gap: 10,
  },
  exerciseOption: {
    gap: 10,
  },
  selectedExercise: {
    backgroundColor: '#ecfdf3',
    borderColor: colors.accent,
    gap: 10,
  },
});
