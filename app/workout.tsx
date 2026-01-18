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

console.log('[workout.tsx] FILE LOADED - This should appear when the file is imported');

type WorkoutState = 'active' | 'summary';

export default function WorkoutScreen() {
  console.log('[WorkoutScreen] COMPONENT FUNCTION CALLED');
  const router = useRouter();
  const [workoutState, setWorkoutState] = useState<WorkoutState>('active');
  const [workoutData, setWorkoutData] = useState({
    volume: 0,
    duration: 0,
    exercises: 0,
  });

  // Stores
  const { activeWorkout, logSet, finishWorkout, cancelWorkout } = useWorkoutStore();

  console.log('[WorkoutScreen] Render - activeWorkout:', activeWorkout ? 'EXISTS' : 'NULL');
  console.log('[WorkoutScreen] Active workout data:', JSON.stringify(activeWorkout, null, 2));

  // ============================================================================
  // TRANSFORM DATA FOR NEW COMPONENTS
  // ============================================================================

  const transformedExercises = activeWorkout ? activeWorkout.exercises.map((ex, idx) => {
    console.log(`[WorkoutScreen] Transforming exercise ${idx}:`, ex.exerciseName);

    // Get prescribed sets count
    const prescribedCount = ex.prescribedSets;
    console.log(`[WorkoutScreen] Exercise ${ex.exerciseName} - prescribed sets:`, prescribedCount);

    // Create sets array based on prescription, including already logged sets
    const sets = Array.from({ length: prescribedCount }, (_, i) => {
      const loggedSet = ex.loggedSets[i];
      return {
        weight: loggedSet?.weight || ex.prescribedWeight,
        reps: loggedSet?.reps || ex.prescribedReps,
        rpe: loggedSet?.rpe || 0,
        completed: !!loggedSet && !loggedSet.isWarmup,
        isWarmup: loggedSet?.isWarmup || false,
        exerciseId: ex.id, // Store for logging
        setNumber: i + 1,
      };
    });

    console.log(`[WorkoutScreen] Exercise ${ex.exerciseName} - sets:`, sets.length);

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

  console.log('[WorkoutScreen] Transformed exercises count:', transformedExercises.length);

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

  // ============================================================================
  // NO ACTIVE WORKOUT
  // ============================================================================

  if (!activeWorkout) {
    console.log('[WorkoutScreen] NO ACTIVE WORKOUT - redirecting to home');
    // Redirect back if no workout
    useEffect(() => {
      router.replace("/(tabs)");
    }, []);

    return <View style={styles.container} />;
  }

  console.log('[WorkoutScreen] RENDERING WORKOUT - state:', workoutState);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (workoutState === 'summary') {
    return (
      <WorkoutSummary
        data={workoutData}
        weeklyProgress={{
          muscleGroup: activeWorkout.muscleGroup,
          oldPercentage: 68,
          newPercentage: 86,
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
