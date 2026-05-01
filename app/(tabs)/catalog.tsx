import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { equipment, exercises } from '@/data/demoData';
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
import { getPrimaryMuscleNames } from '@/lib/recommendations';
import { getExercisesForEquipment, useWorkoutStore } from '@/lib/workout-store';

export default function CatalogScreen() {
  const [query, setQuery] = useState('');
  const {
    activeWorkout,
    addExerciseToManualWorkout,
    createManualWorkout,
    findEquipmentForExercise,
  } = useWorkoutStore();
  const normalizedQuery = query.trim().toLowerCase();

  const filteredEquipment = useMemo(
    () =>
      equipment.filter((item) =>
        [item.name, item.machineNumber ?? '', item.equipmentType]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [normalizedQuery],
  );

  const filteredExercises = useMemo(
    () =>
      exercises.filter((exercise) =>
        [exercise.name, exercise.movementPattern, exercise.difficulty]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [normalizedQuery],
  );

  const addOrCreate = (exerciseId: string) => {
    if (activeWorkout) {
      addExerciseToManualWorkout(exerciseId);
    } else {
      createManualWorkout(exerciseId);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Eyebrow>Ratner map</Eyebrow>
          <Title>Catalog</Title>
          <AppText style={styles.muted}>
            Machines and exercises are separate so trainer templates, manual workouts, and swaps
            can all reuse the same data.
          </AppText>
        </View>

        <TextInput
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="Search machine 18, row, push..."
          placeholderTextColor={colors.muted}
          style={styles.search}
          value={query}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eyebrow>Equipment</Eyebrow>
            <AppText style={styles.muted}>{filteredEquipment.length} mapped Ratner stations</AppText>
          </View>
          {filteredEquipment.map((item) => {
            const mappedExercises = getExercisesForEquipment(item.id);

            return (
              <Card key={item.id} style={styles.stack}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex}>
                    <AppText style={styles.cardTitle}>{item.name}</AppText>
                    <AppText style={styles.muted}>
                      {item.machineNumber ? `Machine ${item.machineNumber}` : 'Shared station'} · {item.equipmentType}
                    </AppText>
                  </View>
                  <Pill tone={item.isAvailable ? 'accent' : 'gold'}>
                    {item.isAvailable ? 'available' : 'offline'}
                  </Pill>
                </View>
                <AppText>{item.instructions}</AppText>
                <View style={styles.rowWrap}>
                  {mappedExercises.map((exercise) => (
                    <Pill key={exercise.id}>{exercise.name}</Pill>
                  ))}
                </View>
              </Card>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eyebrow>Exercises</Eyebrow>
            <AppText style={styles.muted}>Start a manual workout or add to the active one.</AppText>
          </View>
          {filteredExercises.map((exercise) => {
            const preferredEquipment = findEquipmentForExercise(exercise.id);
            const muscles = getPrimaryMuscleNames(exercise.id);

            return (
              <Card key={exercise.id} style={styles.stack}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex}>
                    <AppText style={styles.cardTitle}>{exercise.name}</AppText>
                    <AppText style={styles.muted}>
                      {preferredEquipment?.machineNumber
                        ? `Machine ${preferredEquipment.machineNumber}`
                        : preferredEquipment?.name ?? 'No equipment mapped'}
                    </AppText>
                  </View>
                  <Pill>{exercise.difficulty}</Pill>
                </View>
                <View style={styles.rowWrap}>
                  {muscles.map((muscle) => (
                    <Pill key={muscle}>{muscle}</Pill>
                  ))}
                  <Pill>{exercise.movementPattern}</Pill>
                </View>
                <AppText>{exercise.instructions}</AppText>
                <PrimaryButton disabled={!preferredEquipment} onPress={() => addOrCreate(exercise.id)} variant="secondary">
                  {activeWorkout ? 'Add to active workout' : 'Start manual workout'}
                </PrimaryButton>
              </Card>
            );
          })}
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
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
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
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
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
