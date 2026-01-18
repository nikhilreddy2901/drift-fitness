/**
 * DRIFT FITNESS - WORKOUT STORE
 * Manages active workout session and weekly progress
 */

import { create } from "zustand";
import type {
  WorkoutSession,
  WeeklyProgress,
  MuscleGroup,
  LoggedSet,
  CheckInData,
} from "../types";
import { generateWorkout } from "../utils/workoutGenerator";
import { calculateVolume, calculateTotalVolume } from "../utils/volumeMath";
import { calculateDrift, distributeDrift } from "../utils/driftEngine";
import {
  WorkoutsRepo,
  WeeklyProgressRepo,
  ExercisesRepo,
  WorkingWeightsRepo,
  UserProfileRepo,
  DriftItemsRepo,
} from "../db/client";
import { syncToCloud } from "../services/syncService";
import { checkAndRecordPR } from "../utils/prDetection";
import { updateStreakOnWorkoutComplete } from "../utils/streakTracking";

// ============================================================================
// STORE STATE
// ============================================================================

interface WorkoutStore {
  // State
  activeWorkout: WorkoutSession | null;
  weeklyProgress: WeeklyProgress | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadWeeklyProgress: () => Promise<void>;
  startWorkout: (muscleGroup: MuscleGroup, checkIn: CheckInData) => Promise<void>;
  logSet: (
    workoutExerciseId: string,
    weight: number,
    reps: number,
    isWarmup: boolean,
    rpe?: number
  ) => void;
  finishWorkout: (sessionRPE: number) => Promise<void>;
  cancelWorkout: () => void;
  updateWorkoutExercise: (
    workoutExerciseId: string,
    updates: Partial<any>
  ) => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  // Initial state
  activeWorkout: null,
  weeklyProgress: null,
  isLoading: false,
  error: null,

  // ============================================================================
  // LOAD WEEKLY PROGRESS
  // ============================================================================

  loadWeeklyProgress: async () => {
    try {
      set({ isLoading: true, error: null });

      const progress = await WeeklyProgressRepo.getCurrentWeek();

      if (!progress) {
        // No active week found - should trigger onboarding or week creation
        console.log("[WorkoutStore] No active week found");
        set({ weeklyProgress: null, isLoading: false });
        return;
      }

      set({ weeklyProgress: progress as any, isLoading: false });
    } catch (error) {
      console.error("[WorkoutStore] Failed to load weekly progress:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to load progress",
        isLoading: false,
      });
    }
  },

  // ============================================================================
  // START WORKOUT
  // ============================================================================

  startWorkout: async (muscleGroup: MuscleGroup, checkIn: CheckInData) => {
    try {
      console.log('[WorkoutStore] Starting workout for:', muscleGroup);
      console.log('[WorkoutStore] Check-in data:', checkIn);
      set({ isLoading: true, error: null });

      // Load necessary data
      const [exercisesData, workingWeightsData, profile, weeklyProgress] =
        await Promise.all([
          ExercisesRepo.getAll(),
          WorkingWeightsRepo.getAll(),
          UserProfileRepo.get(),
          WeeklyProgressRepo.getCurrentWeek(),
        ]);

      if (!profile) {
        throw new Error("User profile not found. Complete onboarding first.");
      }

      // Convert database rows to Exercise objects
      const exercises = (exercisesData as any[]).map((row) => ({
        id: row.id,
        name: row.name,
        muscleGroup: row.muscle_group,
        slot: row.slot,
        type: row.type,
        equipment: row.equipment,
        loadType: row.load_type,
        repRange: [row.rep_range_min, row.rep_range_max],
        movementPattern: row.movement_pattern,
        primaryMuscle: row.primary_muscle,
        bodyweightMultiplier: row.bodyweight_multiplier,
      }));

      // Convert working weights array to Record
      const workingWeights: Record<string, number> = {};
      (workingWeightsData as any[]).forEach((ww: any) => {
        workingWeights[ww.exercise_id] = ww.weight;
      });

      // Get weekly target for this muscle group
      const weeklyTarget = (profile as any)[`${muscleGroup}_weekly_target`];

      // Calculate sessions per week for this muscle group
      const sessionsPerWeek = (profile as any).training_days_per_week <= 3 ? 1 : 2;
      const sessionVolume = Math.round(weeklyTarget / sessionsPerWeek);

      // Check for drift to redistribute
      let additionalDrift = 0;
      if (weeklyProgress) {
        const bucketKey = `${muscleGroup}_drift_amount`;
        const currentDrift = (weeklyProgress as any)[bucketKey] || 0;
        const remainingSessions = sessionsPerWeek - 1; // Assume this is the next session

        if (currentDrift > 0 && remainingSessions > 0) {
          additionalDrift = distributeDrift(
            currentDrift,
            remainingSessions,
            sessionVolume
          );
        }
      }

      // Generate workout
      const workout = await generateWorkout({
        muscleGroup,
        targetVolume: sessionVolume,
        exercises: exercises as any,
        workingWeights,
        userBodyweight: (profile as any).bodyweight,
        checkIn,
        additionalDrift,
      });

      // Save workout to database
      await WorkoutsRepo.insert(workout);

      console.log('[WorkoutStore] Generated workout:', JSON.stringify(workout, null, 2));

      set({
        activeWorkout: workout,
        isLoading: false,
      });

      console.log("[WorkoutStore] Workout started and set in store:", workout.id);
      console.log("[WorkoutStore] Active workout exercises count:", workout.exercises.length);
    } catch (error) {
      console.error("[WorkoutStore] Failed to start workout:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to start workout",
        isLoading: false,
      });
    }
  },

  // ============================================================================
  // LOG SET
  // ============================================================================

  logSet: (
    workoutExerciseId: string,
    weight: number,
    reps: number,
    isWarmup: boolean,
    rpe?: number
  ) => {
    const { activeWorkout } = get();

    console.log('[WorkoutStore] logSet called with ID:', workoutExerciseId);

    if (!activeWorkout) {
      console.error("[WorkoutStore] No active workout to log set to");
      return;
    }

    console.log('[WorkoutStore] Active workout exercises:', activeWorkout.exercises.map(e => ({ id: e.id, name: e.exerciseName })));

    // Find the exercise in the workout
    const exerciseIndex = activeWorkout.exercises.findIndex(
      (ex) => ex.id === workoutExerciseId
    );

    console.log('[WorkoutStore] Found exercise at index:', exerciseIndex);

    if (exerciseIndex === -1) {
      console.error("[WorkoutStore] Exercise not found in workout - looking for ID:", workoutExerciseId);
      console.error("[WorkoutStore] Available IDs:", activeWorkout.exercises.map(e => e.id));
      return;
    }

    // Create logged set
    const setNumber =
      activeWorkout.exercises[exerciseIndex].loggedSets.length + 1;

    const loggedSet: LoggedSet = {
      setNumber,
      weight,
      reps,
      isWarmup,
      rpe,
      loggedAt: new Date().toISOString(),
    };

    // Update the workout
    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises[exerciseIndex].loggedSets.push(loggedSet);

    // Recalculate actual volume (need exercise data for this)
    // For now, simplified calculation (will need to fetch exercise from DB for accurate calculation)
    if (!isWarmup) {
      const volumeAdded = weight * reps;
      updatedWorkout.exercises[exerciseIndex].actualVolume += volumeAdded;
      updatedWorkout.actualVolume += volumeAdded;

      // Check for personal records
      const exerciseName = updatedWorkout.exercises[exerciseIndex].exerciseName;
      const exerciseId = updatedWorkout.exercises[exerciseIndex].exerciseId;
      checkAndRecordPR(exerciseId, exerciseName, weight, reps).catch(err => {
        console.error('[WorkoutStore] PR detection failed:', err);
      });
    }

    // Recalculate completion percentage
    updatedWorkout.completionPercentage =
      (updatedWorkout.actualVolume / updatedWorkout.targetVolume) * 100;

    // Check if exercise is completed
    const totalSets =
      updatedWorkout.exercises[exerciseIndex].loggedSets.filter(
        (s) => !s.isWarmup
      ).length;
    const prescribedSets =
      updatedWorkout.exercises[exerciseIndex].prescribedSets;

    if (totalSets >= prescribedSets) {
      updatedWorkout.exercises[exerciseIndex].completed = true;
    }

    set({ activeWorkout: updatedWorkout });

    console.log("[WorkoutStore] Set logged:", loggedSet);
  },

  // ============================================================================
  // FINISH WORKOUT
  // ============================================================================

  finishWorkout: async (sessionRPE: number) => {
    const { activeWorkout } = get();

    if (!activeWorkout) {
      console.error("[WorkoutStore] No active workout to finish");
      return;
    }

    try {
      set({ isLoading: true });

      // Calculate drift
      const drift = calculateDrift(
        activeWorkout.targetVolume,
        activeWorkout.actualVolume
      );

      console.log(
        `[WorkoutStore] Workout drift: ${drift} lbs (${activeWorkout.actualVolume}/${activeWorkout.targetVolume})`
      );

      // Update workout status
      const completedWorkout = {
        ...activeWorkout,
        status: "completed" as const,
        sessionRPE,
        completedAt: new Date().toISOString(),
      };

      // Save to database
      await WorkoutsRepo.update(completedWorkout.id, {
        actualVolume: completedWorkout.actualVolume,
        completionPercentage: completedWorkout.completionPercentage,
        status: "completed",
        sessionRPE,
        completedAt: completedWorkout.completedAt,
      });

      // Update weekly progress bucket
      const weeklyProgress = await WeeklyProgressRepo.getCurrentWeek();
      if (weeklyProgress) {
        const muscleGroup = activeWorkout.muscleGroup;
        const progress = weeklyProgress as any;

        console.log('[WorkoutStore] Updating weekly progress for:', muscleGroup);
        console.log('[WorkoutStore] Current completed volume:', progress[`${muscleGroup}_completed_volume`]);
        console.log('[WorkoutStore] Workout actual volume:', completedWorkout.actualVolume);

        // Calculate new completed volume and percentage
        const currentCompleted = progress[`${muscleGroup}_completed_volume`] || 0;
        const newCompleted = currentCompleted + completedWorkout.actualVolume;
        const targetVolume = progress[`${muscleGroup}_target_volume`];
        const newPercentage = (newCompleted / targetVolume) * 100;

        console.log('[WorkoutStore] New completed volume:', newCompleted);
        console.log('[WorkoutStore] Target volume:', targetVolume);
        console.log('[WorkoutStore] New percentage:', newPercentage);

        // Increment sessions completed
        const currentSessions = progress[`${muscleGroup}_sessions_completed`] || 0;
        const newSessions = currentSessions + 1;

        // Add drift to bucket if any
        const currentDrift = progress[`${muscleGroup}_drift_amount`] || 0;
        const newDrift = currentDrift + drift;

        // Update weekly progress
        const updatedProgress = {
          id: progress.id,
          weekStartDate: progress.week_start_date,
          weekNumber: progress.week_number,
          isDeloadWeek: progress.is_deload_week === 1,
          status: progress.status,
          buckets: {
            push: {
              targetVolume: progress.push_target_volume,
              completedVolume: muscleGroup === 'push' ? newCompleted : progress.push_completed_volume,
              completionPercentage: muscleGroup === 'push' ? newPercentage : progress.push_completion_percentage,
              sessionsPlanned: progress.push_sessions_planned,
              sessionsCompleted: muscleGroup === 'push' ? newSessions : progress.push_sessions_completed,
              driftAmount: muscleGroup === 'push' ? newDrift : progress.push_drift_amount,
            },
            pull: {
              targetVolume: progress.pull_target_volume,
              completedVolume: muscleGroup === 'pull' ? newCompleted : progress.pull_completed_volume,
              completionPercentage: muscleGroup === 'pull' ? newPercentage : progress.pull_completion_percentage,
              sessionsPlanned: progress.pull_sessions_planned,
              sessionsCompleted: muscleGroup === 'pull' ? newSessions : progress.pull_sessions_completed,
              driftAmount: muscleGroup === 'pull' ? newDrift : progress.pull_drift_amount,
            },
            legs: {
              targetVolume: progress.legs_target_volume,
              completedVolume: muscleGroup === 'legs' ? newCompleted : progress.legs_completed_volume,
              completionPercentage: muscleGroup === 'legs' ? newPercentage : progress.legs_completion_percentage,
              sessionsPlanned: progress.legs_sessions_planned,
              sessionsCompleted: muscleGroup === 'legs' ? newSessions : progress.legs_sessions_completed,
              driftAmount: muscleGroup === 'legs' ? newDrift : progress.legs_drift_amount,
            },
          },
        };

        console.log('[WorkoutStore] About to upsert weekly progress:', JSON.stringify(updatedProgress, null, 2));
        await WeeklyProgressRepo.upsert(updatedProgress);

        console.log(
          `[WorkoutStore] Updated weekly progress: ${muscleGroup} ${newCompleted}/${targetVolume} lbs (${newPercentage.toFixed(1)}%)`
        );

        // Verify the update
        const verifyProgress = await WeeklyProgressRepo.getCurrentWeek();
        const verify = verifyProgress as any;
        console.log('[WorkoutStore] Verified completed volume after update:', verify[`${muscleGroup}_completed_volume`]);
      }

      // Save drift item if drift > 0
      if (drift > 0) {
        const driftItem = {
          id: `drift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          muscleGroup: activeWorkout.muscleGroup,
          amount: drift,
          sourceWorkoutId: completedWorkout.id,
          redistributed: false,
        };

        await DriftItemsRepo.insert(driftItem);

        console.log(
          `[WorkoutStore] Saved drift item: ${drift} lbs for ${activeWorkout.muscleGroup}`
        );
      }

      // Update streak
      await updateStreakOnWorkoutComplete(activeWorkout.date);

      set({
        activeWorkout: null,
        isLoading: false,
      });

      // Reload weekly progress
      await get().loadWeeklyProgress();

      console.log("[WorkoutStore] Workout finished:", completedWorkout.id);

      // Sync to cloud in background (non-blocking)
      syncToCloud().catch(err => {
        console.log("[WorkoutStore] Background sync failed (expected if offline):", err);
      });
    } catch (error) {
      console.error("[WorkoutStore] Failed to finish workout:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to finish workout",
        isLoading: false,
      });
    }
  },

  // ============================================================================
  // CANCEL WORKOUT
  // ============================================================================

  cancelWorkout: () => {
    set({ activeWorkout: null });
    console.log("[WorkoutStore] Workout cancelled");
  },

  // ============================================================================
  // UPDATE WORKOUT EXERCISE
  // ============================================================================

  updateWorkoutExercise: (workoutExerciseId: string, updates: any) => {
    const { activeWorkout } = get();

    if (!activeWorkout) {
      return;
    }

    const exerciseIndex = activeWorkout.exercises.findIndex(
      (ex) => ex.id === workoutExerciseId
    );

    if (exerciseIndex === -1) {
      return;
    }

    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises[exerciseIndex] = {
      ...updatedWorkout.exercises[exerciseIndex],
      ...updates,
    };

    set({ activeWorkout: updatedWorkout });
  },
}));
