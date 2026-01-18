import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/src/constants/theme';

export function WorkoutHistory() {
  const workouts = [
    {
      type: 'Push',
      date: '2 hours ago',
      volume: 10200,
      exercises: 4,
      duration: '52 min',
      color: colors.red[600],
    },
    {
      type: 'Pull',
      date: 'Yesterday',
      volume: 9800,
      exercises: 4,
      duration: '48 min',
      color: colors.green[600],
    },
    {
      type: 'Legs',
      date: '2 days ago',
      volume: 12400,
      exercises: 4,
      duration: '58 min',
      color: colors.orange[600],
    },
    {
      type: 'Push',
      date: '4 days ago',
      volume: 10000,
      exercises: 4,
      duration: '50 min',
      color: colors.red[600],
    },
  ];

  return (
    <View style={styles.container}>
      {workouts.map((workout, idx) => (
        <View key={idx} style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <View style={styles.workoutTitleRow}>
              <View style={[styles.iconContainer, { backgroundColor: workout.color + '20' }]}>
                <Ionicons name="barbell" size={20} color={workout.color} />
              </View>
              <View>
                <Text style={styles.workoutType}>{workout.type} Workout</Text>
                <Text style={styles.workoutDate}>{workout.date}</Text>
              </View>
            </View>
          </View>
          <View style={styles.workoutStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Volume</Text>
              <Text style={styles.statValue}>{(workout.volume / 1000).toFixed(1)}k lbs</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Exercises</Text>
              <Text style={styles.statValue}>{workout.exercises}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{workout.duration}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },

  workoutCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing[4],
  },

  workoutHeader: {
    marginBottom: spacing[3],
  },

  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  workoutType: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
  },

  workoutDate: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing[0.5],
  },

  workoutStats: {
    flexDirection: 'row',
    gap: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },

  stat: {
    flex: 1,
  },

  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    marginBottom: spacing[0.5],
  },

  statValue: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
  },
});
