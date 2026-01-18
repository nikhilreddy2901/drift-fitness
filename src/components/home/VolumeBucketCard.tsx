import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

interface Session {
  completed: boolean;
  volume: number;
  date: string;
}

interface Bucket {
  name: string;
  target: number;
  current: number;
  sessions: Session[];
}

interface VolumeBucketCardProps {
  bucket: Bucket;
}

export function VolumeBucketCard({ bucket }: VolumeBucketCardProps) {
  const percentage = Math.round((bucket.current / bucket.target) * 100);
  const isComplete = percentage >= 100;
  const remaining = bucket.target - bucket.current;

  return (
    <Card padding={4}>
      <View style={styles.header}>
        <Text style={styles.name}>{bucket.name}</Text>
        <Text style={[styles.percentage, isComplete && styles.percentageComplete]}>
          {percentage}%
        </Text>
      </View>

      <ProgressBar
        progress={percentage}
        color={isComplete ? colors.green[500] : colors.blue[600]}
        style={styles.progressBar}
      />

      <View style={styles.volumeRow}>
        <Text style={styles.volumeText}>
          {bucket.current.toLocaleString()} / {bucket.target.toLocaleString()} lbs
        </Text>
        <Text style={styles.remainingText}>
          {remaining > 0 ? `${remaining.toLocaleString()} lbs left` : 'Complete!'}
        </Text>
      </View>

      <View style={styles.sessionsRow}>
        {bucket.sessions.map((session, idx) => (
          <View
            key={idx}
            style={[
              styles.sessionPill,
              session.completed ? styles.sessionCompleted : styles.sessionPending,
            ]}
          >
            <Ionicons
              name={session.completed ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={session.completed ? colors.green[600] : colors.gray[300]}
            />
            <Text style={styles.sessionDate}>{session.date || `S${idx + 1}`}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  name: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
  },
  percentage: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  percentageComplete: {
    color: colors.green[600],
  },
  progressBar: {
    marginBottom: spacing[3],
  },
  volumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  volumeText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  remainingText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
  sessionsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  sessionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  sessionCompleted: {
    backgroundColor: colors.green[50],
  },
  sessionPending: {
    backgroundColor: colors.gray[50],
  },
  sessionDate: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
  },
});
