/**
 * DRIFT FITNESS - WORKOUT SCREEN (Redesigned)
 * Active workout flow with new UI components
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ActiveWorkout } from "@/src/components/screens/ActiveWorkout";
import { WorkoutSummary } from "@/src/components/screens/WorkoutSummary";
import { useWorkoutStore } from "@/src/stores/useWorkoutStore";
import { colors } from "@/src/constants/theme";

type WorkoutState = 'active' | 'summary';

export default function WorkoutScreen() {
  const router = useRouter();
  const [workoutState, setWorkoutState] = useState<WorkoutState>('active');
  const [workoutData, setWorkoutData] = useState({
    volume: 0,
    duration: 0,
    exercises: 0,
  });
  // Store the pre-workout bucket percentage for the summary
  const [preWorkoutPercentage, setPreWorkoutPercentage] = useState<number>(0);

  // Stores
  const { activeWorkout, weeklyProgress, finishWorkout, cancelWorkout } = useWorkoutStore();

  // CRITICAL: useEffect must be called unconditionally (React Rules of Hooks)
  // Redirect to home if there's no active workout
  useEffect(() => {
    if (!activeWorkout) {
      router.replace("/(tabs)");
    }
  }, [activeWorkout, router]);

  // Capture the pre-workout percentage when workout starts
  useEffect(() => {
    if (activeWorkout && weeklyProgress) {
      const mg = activeWorkout.muscleGroup;
      const bucket = (weeklyProgress as any)[`${mg}_completion_percentage`] || 0;
      setPreWorkoutPercentage(bucket);
    }
  }, []);

  // ============================================================================
  // TRANSFORM DATA FOR NEW COMPONENTS
  // ============================================================================

  const transformedExercises = activeWorkout ? activeWorkout.exercises.map((ex, idx) => {
    const prescribedCount = ex.prescribedSets;

    // Create sets array based on prescription, including already logged sets
    const sets = Array.from({ length: prescribedCount }, (_, i) => {
      const loggedSet = ex.loggedSets[i];
      return {
        weight: loggedSet?.weight || ex.prescribedWeight,
        reps: loggedSet?.reps || ex.prescribedReps,
        rpe: loggedSet?.rpe || 0,
        completed: !!loggedSet && !loggedSet.isWarmup,
        isWarmup: loggedSet?.isWarmup || false,
        exerciseId: ex.id,
        setNumber: i + 1,
      };
    });

    // Determine slot label based on exercise position
    let slotLabel = 'Moderate Compound';
    if (idx === 0) slotLabel = 'Heavy Compound';
    if (idx >= activeWorkout.exercises.length - 1) slotLabel = 'Isolation';

    return {
      id: ex.id,
      name: ex.exerciseName,
      slot: slotLabel,
      sets,
      notes: undefined,
      swapOptions: [],
    };
  }) : [];

  // Type cast to match ActiveWorkout expectations
  const exercises = transformedExercises as any[];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleVolumeChange = (volumeDelta: number) => {
    // This is handled by the store's logSet function
    // The ActiveWorkout component tracks volume internally
  };

  const handleFinish = async (data: { volume: number; duration: number; exercises: number }) => {
    setWorkoutData(data);

    // Prompt for RPE
    Alert.prompt(
      "Rate Your Session",
      "How hard was this workout? (RPE 1-10)",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Finish",
          onPress: async (rpeInput?: string) => {
            const rpe = parseInt(rpeInput || "7", 10);
            const validRpe = Math.max(1, Math.min(10, rpe));

            try {
              await finishWorkout(validRpe);
              setWorkoutState('summary');
            } catch (error) {
              Alert.alert("Error", "Failed to finish workout");
            }
          },
        },
      ],
      "plain-text",
      "7"
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Workout?",
      "Your progress will not be saved.",
      [
        { text: "Continue Workout", style: "cancel" },
        {
          text: "Cancel Workout",
          style: "destructive",
          onPress: () => {
            cancelWorkout();
            router.back();
          },
        },
      ]
    );
  };

  const handleSummaryClose = () => {
    router.replace("/(tabs)");
  };

  // Show empty view while redirecting (handled by useEffect above)
  if (!activeWorkout) {
    return <View style={styles.container} />;
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (workoutState === 'summary') {
    // Calculate actual post-workout percentage from the current workout data
    const targetVolume = activeWorkout.targetVolume || 1;
    const workoutPercentageGain = Math.round((workoutData.volume / targetVolume) * 100);
    const newPercentage = Math.min(100, preWorkoutPercentage + workoutPercentageGain);

    return (
      <WorkoutSummary
        data={workoutData}
        weeklyProgress={{
          muscleGroup: activeWorkout.muscleGroup,
          oldPercentage: Math.round(preWorkoutPercentage),
          newPercentage: newPercentage,
        }}
        onClose={handleSummaryClose}
      />
    );
  }

  return (
    <ActiveWorkout
      muscleGroup={activeWorkout.muscleGroup.toUpperCase()}
      targetVolume={activeWorkout.targetVolume}
      exercises={exercises}
      onFinish={handleFinish}
      onCancel={handleCancel}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
