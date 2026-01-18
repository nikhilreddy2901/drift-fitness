/**
 * DRIFT FITNESS - WORKOUT EXERCISE CARD
 * Single exercise within active workout with set logging
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/layout";
import type { WorkoutExercise } from "../types";

// ============================================================================
// TYPES
// ============================================================================

interface WorkoutExerciseCardProps {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  onLogSet: (setNumber: number, weight: number, reps: number) => void;
  onUnlogSet: (setNumber: number) => void;
  onSwap: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WorkoutExerciseCard({
  exercise,
  exerciseIndex,
  onLogSet,
  onUnlogSet,
  onSwap,
}: WorkoutExerciseCardProps) {
  // Track which sets are logged (by set number)
  const loggedSetNumbers = new Set(
    exercise.loggedSets.filter((s) => !s.isWarmup).map((s) => s.setNumber)
  );

  const handleSetToggle = (setNumber: number) => {
    const isLogged = loggedSetNumbers.has(setNumber);

    if (isLogged) {
      // Unlog the set
      onUnlogSet(setNumber);
    } else {
      // Log the set with prescribed weight and reps
      onLogSet(setNumber, exercise.prescribedWeight, exercise.prescribedReps);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseNumber}>{exerciseIndex + 1}.</Text>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
            <Text style={styles.prescription}>
              {exercise.prescribedSets} × {exercise.prescribedReps} @ {exercise.prescribedWeight} lbs
            </Text>
          </View>
        </View>

        {/* Swap Button */}
        <Pressable style={styles.swapButton} onPress={onSwap}>
          <Text style={styles.swapIcon}>⇄</Text>
        </Pressable>
      </View>

      {/* Sets Grid */}
      <View style={styles.setsGrid}>
        {/* Header Row */}
        <View style={styles.gridHeader}>
          <Text style={[styles.gridHeaderText, styles.colSet]}>Set</Text>
          <Text style={[styles.gridHeaderText, styles.colWeight]}>Weight</Text>
          <Text style={[styles.gridHeaderText, styles.colReps]}>Reps</Text>
          <Text style={[styles.gridHeaderText, styles.colCheck]}>✓</Text>
        </View>

        {/* Set Rows */}
        {Array.from({ length: exercise.prescribedSets }).map((_, index) => {
          const setNumber = index + 1;
          const isLogged = loggedSetNumbers.has(setNumber);

          return (
            <Pressable
              key={setNumber}
              style={[styles.gridRow, isLogged && styles.gridRowLogged]}
              onPress={() => handleSetToggle(setNumber)}
            >
              <Text style={[styles.gridText, styles.colSet, isLogged && styles.gridTextLogged]}>
                {setNumber}
              </Text>
              <Text style={[styles.gridText, styles.colWeight, isLogged && styles.gridTextLogged]}>
                {exercise.prescribedWeight}
              </Text>
              <Text style={[styles.gridText, styles.colReps, isLogged && styles.gridTextLogged]}>
                {exercise.prescribedReps}
              </Text>
              <View style={[styles.colCheck, styles.checkboxContainer]}>
                <View style={[styles.checkbox, isLogged && styles.checkboxChecked]}>
                  {isLogged && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {loggedSetNumbers.size} / {exercise.prescribedSets} sets completed
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },

  headerLeft: {
    flexDirection: "row",
    flex: 1,
  },

  exerciseNumber: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
    marginRight: Spacing.sm,
  },

  exerciseInfo: {
    flex: 1,
  },

  exerciseName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },

  prescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },

  swapButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.tertiary,
  },

  swapIcon: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text.primary,
  },

  setsGrid: {
    marginBottom: Spacing.sm,
  },

  gridHeader: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  gridHeaderText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
  },

  gridRow: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    alignItems: "center",
  },

  gridRowLogged: {
    opacity: 0.5,
  },

  gridText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },

  gridTextLogged: {
    color: Colors.text.secondary,
  },

  colSet: {
    width: "15%",
    textAlign: "center",
  },

  colWeight: {
    width: "30%",
    textAlign: "center",
  },

  colReps: {
    width: "30%",
    textAlign: "center",
  },

  colCheck: {
    width: "25%",
    alignItems: "center",
  },

  checkboxContainer: {
    justifyContent: "center",
  },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxChecked: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },

  checkmark: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },

  progress: {
    marginTop: Spacing.sm,
  },

  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: "center",
  },
});
