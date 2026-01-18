import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

interface WorkoutSummaryProps {
  data: {
    volume: number;
    duration: number;
    exercises: number;
  };
  weeklyProgress?: {
    muscleGroup: string;
    oldPercentage: number;
    newPercentage: number;
  };
  personalRecords?: Array<{
    exercise: string;
    achievement: string;
  }>;
  onClose: () => void;
  onShare?: () => void;
}

export function WorkoutSummary({
  data,
  weeklyProgress,
  personalRecords = [],
  onClose,
  onShare,
}: WorkoutSummaryProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={colors.green[600]} />
          </View>
          <Text style={styles.successTitle}>Workout Complete!</Text>
          <Text style={styles.successSubtitle}>Great work today</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.blue[100] }]}>
                <Ionicons name="trending-up" size={24} color={colors.blue[600]} />
              </View>
              <Text style={styles.statValue}>{data.volume.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Volume (lbs)</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.purple[100] }]}>
                <Ionicons name="time-outline" size={24} color={colors.purple[600]} />
              </View>
              <Text style={styles.statValue}>{formatDuration(data.duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.orange[100] }]}>
                <Ionicons name="barbell-outline" size={24} color={colors.orange[600]} />
              </View>
              <Text style={styles.statValue}>{data.exercises}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
          </View>
        </View>

        {/* Weekly Progress Update */}
        {weeklyProgress && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green[600]} />
              <Text style={styles.progressTitle}>Weekly Progress Updated</Text>
            </View>
            <Text style={styles.progressText}>
              {weeklyProgress.muscleGroup} bucket: {weeklyProgress.oldPercentage}% → {weeklyProgress.newPercentage}% complete
            </Text>
            <ProgressBar
              progress={weeklyProgress.newPercentage}
              color={colors.green[600]}
              backgroundColor={colors.green[200]}
              style={styles.progressBar}
            />
          </View>
        )}

        {/* Personal Records */}
        {personalRecords.length > 0 && (
          <View style={styles.prsCard}>
            <Text style={styles.prsTitle}>New Personal Records</Text>
            <View style={styles.prsList}>
              {personalRecords.map((pr, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.prItem,
                    idx < personalRecords.length - 1 && styles.prItemBorder,
                  ]}
                >
                  <Text style={styles.prExercise}>{pr.exercise}</Text>
                  <Text style={styles.prAchievement}>{pr.achievement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Placeholder PRs if none provided */}
        {personalRecords.length === 0 && (
          <View style={styles.prsCard}>
            <Text style={styles.prsTitle}>New Personal Records</Text>
            <View style={styles.prsList}>
              <View style={styles.prItem}>
                <Text style={styles.prExercise}>Bench Press</Text>
                <Text style={styles.prAchievement}>185 lbs × 6 reps</Text>
              </View>
              <View style={[styles.prItem, styles.prItemBorder]}>
                <Text style={styles.prExercise}>Total Session Volume</Text>
                <Text style={styles.prAchievement}>{data.volume.toLocaleString()} lbs</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {onShare && (
          <Button
            onPress={onShare}
            variant="primary"
            style={styles.actionButton}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="share-outline" size={20} color={colors.white} />
              <Text style={styles.buttonText}>Share Workout</Text>
            </View>
          </Button>
        )}
        <Button
          onPress={onClose}
          variant="secondary"
          style={styles.actionButton}
        >
          Back to Home
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: spacing[6],
    paddingBottom: spacing[20],
    gap: spacing[6],
  },

  successSection: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },

  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.green[100],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },

  successTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginBottom: spacing[2],
  },

  successSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
  },

  statsCard: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing[6],
  },

  statsGrid: {
    flexDirection: 'row',
    gap: spacing[6],
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },

  statValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginBottom: spacing[1],
  },

  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    textAlign: 'center',
  },

  progressCard: {
    backgroundColor: colors.green[50],
    borderWidth: 1,
    borderColor: colors.green[200],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },

  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },

  progressTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.green[900],
  },

  progressText: {
    fontSize: typography.sizes.sm,
    color: colors.green[700],
    marginBottom: spacing[3],
  },

  progressBar: {
    marginTop: spacing[2],
  },

  prsCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },

  prsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginBottom: spacing[3],
  },

  prsList: {
    gap: spacing[2],
  },

  prItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },

  prItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },

  prExercise: {
    fontSize: typography.sizes.base,
    color: colors.gray[700],
  },

  prAchievement: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.green[600],
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    padding: spacing[6],
    gap: spacing[3],
  },

  actionButton: {
    width: '100%',
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },

  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
});
