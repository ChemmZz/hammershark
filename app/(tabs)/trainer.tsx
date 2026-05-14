import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

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
import { getTemplateExerciseCount, useWorkoutStore } from '@/lib/workout-store';

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
            <Title>Coach tools</Title>
            <AppText style={styles.muted}>
              Sign in as a trainer to build reusable Ratner templates.
            </AppText>
          </View>
          <Card style={styles.stack}>
            <AppText style={styles.cardTitle}>Current role: {profile?.role ?? 'none'}</AppText>
            <AppText style={styles.muted}>
              Supabase RLS will enforce the same boundary when the database is connected.
            </AppText>
            <PrimaryButton icon="sign-out" onPress={signOut} variant="secondary">
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
          <Eyebrow>Coach mode</Eyebrow>
          <Title>Build a plan</Title>
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
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  key={exercise.id}
                  onPress={() => toggleExercise(exercise.id)}
                  style={[styles.exerciseOption, selected && styles.selectedExercise]}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flex}>
                      <AppText style={styles.cardTitle}>{exercise.name}</AppText>
                      <AppText style={styles.muted}>{muscles.join(', ') || exercise.movementPattern}</AppText>
                    </View>
                    <Pill tone={selected ? 'accent' : 'neutral'}>{selected ? 'selected' : 'add'}</Pill>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton disabled={!canCreate} icon="plus" onPress={submit}>
            Create template
          </PrimaryButton>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eyebrow>Saved templates</Eyebrow>
            <AppText style={styles.muted}>Reusable source plans.</AppText>
          </View>
          {trainerTemplates.map((template) => (
            <Card key={template.id} style={styles.stack}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <AppText style={styles.cardTitle}>{template.title}</AppText>
                  <AppText style={styles.muted}>{template.description}</AppText>
                </View>
                <Pill>{template.days.length} days</Pill>
              </View>
              <AppText style={styles.muted}>{getTemplateExerciseCount(template)} total moves</AppText>
              {template.days.map((day) => (
                <View key={day.id} style={styles.daySummary}>
                  <AppText style={styles.dayTitle}>
                    Day {day.dayNumber}: {day.title}
                  </AppText>
                  {day.exercises.map((templateExercise) => {
                    const exercise = exercises.find((item) => item.id === templateExercise.exerciseId);
                    const equipment = getEquipment(templateExercise.equipmentId);

                    return (
                      <AppText key={templateExercise.id} style={styles.muted}>
                        {templateExercise.position}. {exercise?.name ?? 'Unknown exercise'} ·{' '}
                        {equipment.machineNumber ? `Station ${equipment.machineNumber}` : equipment.name}
                      </AppText>
                    );
                  })}
                </View>
              ))}
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
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
  header: {
    gap: 4,
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
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  selectedExercise: {
    backgroundColor: '#eef8f2',
    borderColor: colors.accent,
  },
  daySummary: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 4,
    paddingTop: 10,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
});
