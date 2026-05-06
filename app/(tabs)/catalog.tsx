import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

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
  const [mode, setMode] = useState<'equipment' | 'exercises'>('equipment');
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
          <Title>Find your station</Title>
        </View>

        <TextInput
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="Search machine 18, row, push"
          placeholderTextColor={colors.muted}
          style={styles.search}
          value={query}
        />

        <View style={styles.segmented}>
          <SegmentButton
            active={mode === 'equipment'}
            count={filteredEquipment.length}
            label="Machines"
            onPress={() => setMode('equipment')}
          />
          <SegmentButton
            active={mode === 'exercises'}
            count={filteredExercises.length}
            label="Exercises"
            onPress={() => setMode('exercises')}
          />
        </View>

        {mode === 'equipment' ? (
          <View style={styles.section}>
            {filteredEquipment.map((item) => {
              const mappedExercises = getExercisesForEquipment(item.id);

              return (
                <Card key={item.id} style={styles.stack}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flex}>
                      <AppText style={styles.cardTitle}>{item.name}</AppText>
                      <AppText style={styles.muted}>
                        {item.machineNumber ? `Machine ${item.machineNumber}` : 'Shared station'} ·{' '}
                        {item.equipmentType}
                      </AppText>
                    </View>
                    <Pill tone={item.isAvailable ? 'accent' : 'gold'}>
                      {item.isAvailable ? 'open' : 'offline'}
                    </Pill>
                  </View>
                  <AppText numberOfLines={2}>{item.instructions}</AppText>
                  <View style={styles.rowWrap}>
                    {mappedExercises.slice(0, 3).map((exercise) => (
                      <Pill key={exercise.id}>{exercise.name}</Pill>
                    ))}
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <View style={styles.section}>
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
                    {muscles.slice(0, 2).map((muscle) => (
                      <Pill key={muscle}>{muscle}</Pill>
                    ))}
                    <Pill>{exercise.movementPattern}</Pill>
                  </View>
                  <AppText numberOfLines={2}>{exercise.instructions}</AppText>
                  <PrimaryButton
                    disabled={!preferredEquipment}
                    icon={activeWorkout ? 'plus' : 'play'}
                    onPress={() => addOrCreate(exercise.id)}
                    variant="secondary">
                    {activeWorkout ? 'Add to workout' : 'Start workout'}
                  </PrimaryButton>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function SegmentButton({
  active,
  count,
  label,
  onPress,
}: {
  active: boolean;
  count: number;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.segmentButton, active && styles.segmentButtonActive]}>
      <AppText style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</AppText>
      <AppText style={[styles.segmentCount, active && styles.segmentLabelActive]}>{count}</AppText>
    </Pressable>
  );
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
  header: {
    gap: 3,
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
    minHeight: 50,
    paddingHorizontal: 14,
  },
  segmented: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    padding: 5,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 7,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 44,
  },
  segmentButtonActive: {
    backgroundColor: colors.surface,
  },
  segmentLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  segmentCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  segmentLabelActive: {
    color: colors.accentDark,
  },
  section: {
    gap: 12,
  },
  stack: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
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
