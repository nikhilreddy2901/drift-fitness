/**
 * DRIFT FITNESS - EXERCISE SWAP MODAL
 * Select alternative exercises with equipment grouping
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../constants/layout";
import type { Exercise } from "../types";
import { getValidSwaps, groupSwapsByEquipment } from "../utils/swapLogic";

// ============================================================================
// TYPES
// ============================================================================

interface SwapModalProps {
  visible: boolean;
  originalExercise: Exercise | null;
  allExercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SwapModal({
  visible,
  originalExercise,
  allExercises,
  onSelect,
  onClose,
}: SwapModalProps) {
  if (!originalExercise) return null;

  // Get valid swaps
  const validSwaps = getValidSwaps(originalExercise, allExercises);
  const groupedSwaps = groupSwapsByEquipment(validSwaps);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Alternative</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeIcon}>×</Text>
            </Pressable>
          </View>

          {/* Current Exercise */}
          <View style={styles.currentExercise}>
            <Text style={styles.currentLabel}>Currently:</Text>
            <Text style={styles.currentName}>{originalExercise.name}</Text>
          </View>

          {/* Alternatives List */}
          <ScrollView style={styles.scrollView}>
            {groupedSwaps.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No alternatives available for this exercise
                </Text>
              </View>
            ) : (
              groupedSwaps.map((group) => (
                <View key={group.equipment} style={styles.group}>
                  {/* Equipment Header */}
                  <Text style={styles.groupHeader}>{group.equipment}</Text>

                  {/* Exercises */}
                  {group.exercises.map((exercise) => (
                    <Pressable
                      key={exercise.id}
                      style={({ pressed }) => [
                        styles.exerciseRow,
                        pressed && styles.exerciseRowPressed,
                      ]}
                      onPress={() => {
                        onSelect(exercise);
                        onClose();
                      }}
                    >
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseIcon}>→</Text>
                    </Pressable>
                  ))}
                </View>
              ))
            )}
          </ScrollView>

          {/* Cancel Button */}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },

  container: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
    ...Shadows.lg,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },

  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  closeIcon: {
    fontSize: 32,
    color: Colors.text.secondary,
    lineHeight: 32,
  },

  currentExercise: {
    padding: Spacing.lg,
    backgroundColor: Colors.background.tertiary,
  },

  currentLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },

  currentName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },

  scrollView: {
    maxHeight: 400,
  },

  emptyState: {
    padding: Spacing.xxl,
    alignItems: "center",
  },

  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    textAlign: "center",
  },

  group: {
    paddingVertical: Spacing.md,
  },

  groupHeader: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
  },

  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  exerciseRowPressed: {
    backgroundColor: Colors.background.tertiary,
  },

  exerciseName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    flex: 1,
  },

  exerciseIcon: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primary.main,
    marginLeft: Spacing.sm,
  },

  cancelButton: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.status.error,
  },
});
