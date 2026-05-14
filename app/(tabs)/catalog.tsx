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
  const [mode, setMode] = useState<'stations' | 'exercises' | 'database'>('database');
  const {
    activeRoutine,
    addExerciseToActiveDay,
    createManualRoutine,
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
      )
      .slice()
      .sort((left, right) => (left.machineNumber ?? left.name).localeCompare(right.machineNumber ?? right.name, undefined, { numeric: true })),
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

  const databaseRows = useMemo(
    () =>
      equipment
        .map((item) => {
          const mappedExercises = getExercisesForEquipment(item.id);
          const searchBlob = [
            item.name,
            item.machineNumber ?? '',
            item.equipmentType,
            item.brand ?? '',
            ...mappedExercises.map((exercise) => exercise.name),
            ...mappedExercises.flatMap((exercise) => getPrimaryMuscleNames(exercise.id)),
          ]
            .join(' ')
            .toLowerCase();

          return {
            item,
            mappedExercises,
            searchBlob,
          };
        })
        .filter((entry) => entry.searchBlob.includes(normalizedQuery))
        .sort((left, right) =>
          (left.item.machineNumber ?? left.item.name).localeCompare(
            right.item.machineNumber ?? right.item.name,
            undefined,
            { numeric: true },
          ),
        ),
    [normalizedQuery],
  );

  const addOrCreate = (exerciseId: string) => {
    if (activeRoutine) {
      addExerciseToActiveDay(exerciseId);
    } else {
      createManualRoutine(exerciseId);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Eyebrow>Ratner database</Eyebrow>
          <Title>Browse stations and exercises</Title>
        </View>

        <TextInput
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="Search A21, pulldown, quads"
          placeholderTextColor={colors.muted}
          style={styles.search}
          value={query}
        />

        <View style={styles.segmented}>
          <SegmentButton
            active={mode === 'stations'}
            count={filteredEquipment.length}
            label="Stations"
            onPress={() => setMode('stations')}
          />
          <SegmentButton
            active={mode === 'exercises'}
            count={filteredExercises.length}
            label="Exercises"
            onPress={() => setMode('exercises')}
          />
          <SegmentButton
            active={mode === 'database'}
            count={databaseRows.length}
            label="Database"
            onPress={() => setMode('database')}
          />
        </View>

        {mode === 'stations' ? (
          <View style={styles.section}>
            {filteredEquipment.map((item) => {
              const mappedExercises = getExercisesForEquipment(item.id);

              return (
                <Card key={item.id} style={styles.stack}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flex}>
                      <AppText style={styles.cardTitle}>{item.name}</AppText>
                      <AppText style={styles.muted}>
                        {item.machineNumber ? `Station ${item.machineNumber}` : 'Shared station'} ·{' '}
                        {item.equipmentType}
                      </AppText>
                    </View>
                    <Pill tone={item.isAvailable ? 'accent' : 'gold'}>
                      {item.isAvailable ? 'open' : 'offline'}
                    </Pill>
                  </View>
                  <View style={styles.rowWrap}>
                    <Pill tone={item.catalogStatus === 'verified' ? 'accent' : 'gold'}>
                      {item.catalogStatus === 'verified' ? 'verified' : 'placeholder'}
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
        ) : mode === 'exercises' ? (
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
                          ? `Station ${preferredEquipment.machineNumber}`
                          : preferredEquipment?.name ?? 'No equipment mapped'}
                      </AppText>
                    </View>
                    <Pill>{exercise.difficulty}</Pill>
                  </View>
                  <View style={styles.rowWrap}>
                    <Pill tone={exercise.catalogStatus === 'verified' ? 'accent' : 'gold'}>
                      {exercise.catalogStatus === 'verified' ? 'verified' : 'placeholder'}
                    </Pill>
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
                    icon={activeRoutine ? 'plus' : 'play'}
                    onPress={() => addOrCreate(exercise.id)}
                    variant="secondary">
                    {activeRoutine ? 'Add to today' : 'Start routine'}
                  </PrimaryButton>
                </Card>
              );
            })}
          </View>
        ) : (
          <View style={styles.section}>
            {databaseRows.map(({ item, mappedExercises }) => (
              <Card key={item.id} style={styles.databaseCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex}>
                    <AppText style={styles.databaseStationCode}>
                      {item.machineNumber ? `Station ${item.machineNumber}` : item.name}
                    </AppText>
                    <AppText style={styles.cardTitle}>{item.name}</AppText>
                    <AppText style={styles.muted}>
                      {[item.equipmentType, item.brand].filter(Boolean).join(' · ')}
                    </AppText>
                  </View>
                  <Pill tone={item.isAvailable ? 'accent' : 'gold'}>
                    {item.isAvailable ? 'open' : 'offline'}
                  </Pill>
                </View>

                <View style={styles.rowWrap}>
                  <Pill tone={item.catalogStatus === 'verified' ? 'accent' : 'gold'}>
                    {item.catalogStatus === 'verified' ? 'verified' : 'placeholder'}
                  </Pill>
                  <Pill>{mappedExercises.length} exercises</Pill>
                </View>

                <AppText>{item.instructions}</AppText>

                <View style={styles.exerciseDatabaseList}>
                  {mappedExercises.length ? (
                    mappedExercises.map((exercise) => {
                      const muscles = getPrimaryMuscleNames(exercise.id);

                      return (
                        <View key={exercise.id} style={styles.exerciseDatabaseRow}>
                          <View style={styles.rowBetween}>
                            <View style={styles.flex}>
                              <AppText style={styles.exerciseDatabaseTitle}>{exercise.name}</AppText>
                              <AppText style={styles.muted}>
                                {exercise.difficulty} · {exercise.movementPattern}
                              </AppText>
                            </View>
                            <PrimaryButton
                              disabled={!item.isAvailable}
                              icon={activeRoutine ? 'plus' : 'play'}
                              onPress={() => addOrCreate(exercise.id)}
                              variant="secondary">
                              {activeRoutine ? 'Add' : 'Start'}
                            </PrimaryButton>
                          </View>
                          <View style={styles.rowWrap}>
                            {muscles.map((muscle) => (
                              <Pill key={`${exercise.id}-${muscle}`}>{muscle}</Pill>
                            ))}
                          </View>
                          <AppText numberOfLines={2}>{exercise.instructions}</AppText>
                        </View>
                      );
                    })
                  ) : (
                    <AppText style={styles.muted}>No exercises mapped to this station yet.</AppText>
                  )}
                </View>
              </Card>
            ))}
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
    gap: 4,
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
  databaseCard: {
    gap: 12,
  },
  databaseStationCode: {
    color: colors.accentDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  exerciseDatabaseList: {
    gap: 10,
  },
  exerciseDatabaseRow: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  exerciseDatabaseTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
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
