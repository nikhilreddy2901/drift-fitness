/**
 * DRIFT FITNESS - BUCKET CARD COMPONENT (Redesigned)
 * Visual representation of weekly volume bucket (Push/Pull/Legs)
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../constants/theme";
import type { MuscleGroup } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface BucketCardProps {
  muscleGroup: MuscleGroup;
  targetVolume: number;
  completedVolume: number;
  completionPercentage: number;
  onStartWorkout: () => void;
  disabled?: boolean;
}

// ============================================================================
// BUCKET COLORS
// ============================================================================

const BUCKET_COLORS = {
  push: colors.red[600],
  pull: colors.blue[600],
  legs: colors.green[600],
};

const BUCKET_LABELS = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function BucketCard({
  muscleGroup,
  targetVolume,
  completedVolume,
  completionPercentage,
  onStartWorkout,
  disabled = false,
}: BucketCardProps) {
  const bucketColor = BUCKET_COLORS[muscleGroup];
  const bucketLabel = BUCKET_LABELS[muscleGroup];
  const remainingVolume = Math.max(0, targetVolume - completedVolume);
  const isComplete = completionPercentage >= 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.label, { color: bucketColor }]}>{bucketLabel}</Text>
        {isComplete && <Text style={styles.completeBadge}>✓ COMPLETE</Text>}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(completionPercentage, 100)}%`,
              backgroundColor: bucketColor,
            },
          ]}
        />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.percentageText}>
            {Math.round(completionPercentage)}%
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.volumeText}>
            {Math.round(remainingVolume).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>lbs left</Text>
        </View>
      </View>

      {/* Action Button */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: bucketColor },
          disabled && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={onStartWorkout}
        disabled={disabled || isComplete}
      >
        <Text style={styles.buttonText}>
          {isComplete ? "✓ Week Complete" : `Start ${bucketLabel}`}
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },

  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
  },

  completeBadge: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.green[600],
    backgroundColor: colors.green[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.DEFAULT,
  },

  progressContainer: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginBottom: spacing[3],
  },

  progressBar: {
    height: "100%",
    borderRadius: borderRadius.full,
  },

  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },

  statItem: {
    alignItems: "flex-start",
  },

  percentageText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[600],
    marginBottom: spacing[0.5],
  },

  volumeText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing[0.5],
  },

  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },

  button: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
});
