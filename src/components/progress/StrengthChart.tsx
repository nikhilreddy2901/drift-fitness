import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/src/constants/theme';

export function StrengthChart() {
  const exercises = [
    { name: 'Bench Press', start: 135, current: 225, color: colors.blue[600] },
    { name: 'Squat', start: 185, current: 315, color: colors.green[600] },
    { name: 'Deadlift', start: 225, current: 405, color: colors.purple[600] },
  ];

  const maxWeight = Math.max(...exercises.map((e) => e.current));

  return (
    <View style={styles.container}>
      {exercises.map((exercise, idx) => {
        const progress = (exercise.current / maxWeight) * 100;
        const gain = exercise.current - exercise.start;
        const gainPercent = Math.round((gain / exercise.start) * 100);

        return (
          <View key={idx} style={styles.exerciseRow}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseGain}>
                +{gain} lbs ({gainPercent}%)
              </Text>
            </View>
            <View style={styles.barContainer}>
              <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: `${progress}%`, backgroundColor: exercise.color }]} />
              </View>
              <Text style={styles.weight}>{exercise.current} lbs</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },

  exerciseRow: {
    gap: spacing[2],
  },

  exerciseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  exerciseName: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
  },

  exerciseGain: {
    fontSize: typography.sizes.xs,
    color: colors.green[600],
  },

  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },

  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  weight: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    minWidth: 60,
    textAlign: 'right',
  },
});
