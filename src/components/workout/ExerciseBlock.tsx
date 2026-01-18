import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { useWorkoutStore } from '../../stores/useWorkoutStore';

interface Set {
  weight: number;
  reps: number;
  rpe: number;
  completed: boolean;
  isWarmup?: boolean;
  exerciseId?: string;
  setNumber?: number;
}

interface Exercise {
  id: string;
  name: string;
  slot: string;
  sets: Set[];
  notes?: string;
  swapOptions?: string[];
}

interface ExerciseBlockProps {
  exercise: Exercise;
  onVolumeChange: (volume: number) => void;
  onRestStart?: (duration: number) => void;
}

export function ExerciseBlock({ exercise, onVolumeChange, onRestStart }: ExerciseBlockProps) {
  const [sets, setSets] = useState(exercise.sets);
  const [showSwap, setShowSwap] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const { logSet } = useWorkoutStore();

  const getSlotColor = () => {
    if (exercise.slot.includes('Heavy')) {
      return {
        bg: colors.red[100],
        text: colors.red[700],
        border: colors.red[200],
      };
    }
    if (exercise.slot.includes('Moderate')) {
      return {
        bg: colors.blue[100],
        text: colors.blue[700],
        border: colors.blue[200],
      };
    }
    return {
      bg: colors.green[100],
      text: colors.green[700],
      border: colors.green[200],
    };
  };

  const slotColors = getSlotColor();

  const toggleSet = (index: number) => {
    const newSets = [...sets];
    const set = newSets[index];

    if (set.isWarmup) return; // Can't mark warmup sets as completed

    const volume = set.weight * set.reps;

    if (!set.completed) {
      console.log('[ExerciseBlock] Logging set - exercise ID:', exercise.id);
      console.log('[ExerciseBlock] Set data:', { weight: set.weight, reps: set.reps });

      // Log the set to the database
      logSet(
        exercise.id, // workout exercise ID
        set.weight,
        set.reps,
        false, // not a warmup
        set.rpe || undefined
      );

      onVolumeChange(volume);

      // Auto-start rest timer
      if (onRestStart) {
        const restTime = exercise.slot.includes('Heavy') ? 180 : exercise.slot.includes('Moderate') ? 90 : 60;
        onRestStart(restTime);
      }

      set.completed = true;
    } else {
      // Don't allow unchecking completed sets
      return;
    }

    setSets(newSets);
  };

  const updateSet = (index: number, field: 'weight' | 'reps', value: string) => {
    const newSets = [...sets];
    const numValue = parseFloat(value) || 0;

    // Don't allow editing completed sets
    if (newSets[index].completed) {
      return;
    }

    newSets[index][field] = numValue;
    setSets(newSets);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <View style={[styles.slotBadge, { backgroundColor: slotColors.bg, borderColor: slotColors.border }]}>
              <Text style={[styles.slotText, { color: slotColors.text }]}>{exercise.slot}</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          {exercise.notes && (
            <TouchableOpacity
              onPress={() => setShowNotes(!showNotes)}
              style={[
                styles.actionButton,
                showNotes && { backgroundColor: colors.blue[100] },
              ]}
            >
              <Ionicons
                name="chatbox-outline"
                size={16}
                color={showNotes ? colors.blue[600] : colors.gray[600]}
              />
            </TouchableOpacity>
          )}
          {exercise.swapOptions && exercise.swapOptions.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowSwap(!showSwap)}
              style={styles.actionButton}
            >
              <Ionicons name="swap-horizontal" size={16} color={colors.gray[600]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notes */}
      {showNotes && exercise.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>{exercise.notes}</Text>
        </View>
      )}

      {/* Swap Options */}
      {showSwap && exercise.swapOptions && exercise.swapOptions.length > 0 && (
        <View style={styles.swapContainer}>
          <Text style={styles.swapLabel}>SWAP WITH:</Text>
          <View style={styles.swapOptions}>
            {exercise.swapOptions.map((option, idx) => (
              <TouchableOpacity key={idx} style={styles.swapOption}>
                <Text style={styles.swapOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Sets */}
      <View style={styles.setsContainer}>
        {sets.map((set, index) => (
          <View
            key={index}
            style={[
              styles.setRow,
              set.completed && styles.setRowCompleted,
              set.isWarmup && styles.setRowWarmup,
            ]}
          >
            <TouchableOpacity
              onPress={() => toggleSet(index)}
              style={styles.checkboxContainer}
              disabled={set.isWarmup}
            >
              <View
                style={[
                  styles.checkbox,
                  set.completed && styles.checkboxChecked,
                  set.isWarmup && styles.checkboxWarmup,
                ]}
              >
                {set.completed && <Ionicons name="checkmark" size={16} color={colors.white} />}
              </View>
            </TouchableOpacity>

            <Text style={styles.setLabel}>
              {set.isWarmup ? 'W' : `Set ${index + 1}`}
            </Text>

            <View style={styles.setInputs}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={set.weight.toString()}
                  onChangeText={(value) => updateSet(index, 'weight', value)}
                  keyboardType="numeric"
                  editable={!set.completed}
                />
                <Text style={styles.inputLabel}>lbs</Text>
              </View>

              <Text style={styles.multiply}>×</Text>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={set.reps.toString()}
                  onChangeText={(value) => updateSet(index, 'reps', value)}
                  keyboardType="numeric"
                  editable={!set.completed}
                />
                <Text style={styles.inputLabel}>reps</Text>
              </View>
            </View>

            <Text style={styles.volumeText}>
              {(set.weight * set.reps).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  headerContent: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },

  exerciseName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
  },

  slotBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
  },

  slotText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },

  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },

  actionButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notesContainer: {
    backgroundColor: colors.blue[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.blue[200],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },

  notesText: {
    fontSize: typography.sizes.sm,
    color: colors.blue[900],
    lineHeight: typography.lineHeights.sm,
  },

  swapContainer: {
    backgroundColor: colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },

  swapLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    marginBottom: spacing[2],
  },

  swapOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },

  swapOption: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
  },

  swapOptionText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
  },

  setsContainer: {
    padding: spacing[4],
    gap: spacing[2],
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    minHeight: 60,
  },

  setRowCompleted: {
    borderColor: colors.green[500],
    backgroundColor: colors.green[50],
  },

  setRowWarmup: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[300],
  },

  checkboxContainer: {
    padding: spacing[0.5],
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: colors.green[500],
    borderColor: colors.green[500],
  },

  checkboxWarmup: {
    borderColor: colors.gray[400],
  },

  setLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    width: 40,
    fontWeight: typography.weights.medium,
  },

  setInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    justifyContent: 'flex-start',
  },

  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  input: {
    width: 56,
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[1.5],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
    textAlign: 'center',
    fontWeight: typography.weights.medium,
  },

  inputLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    minWidth: 28,
  },

  multiply: {
    fontSize: typography.sizes.base,
    color: colors.gray[400],
  },

  volumeText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    minWidth: 45,
    textAlign: 'right',
    fontWeight: typography.weights.medium,
  },
});
