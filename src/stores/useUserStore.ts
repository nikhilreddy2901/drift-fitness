/**
 * DRIFT FITNESS - USER STORE
 * Manages user profile, exercises, and working weights
 */

import { create } from "zustand";
import type { UserProfile, Exercise } from "../types";
import {
  UserProfileRepo,
  ExercisesRepo,
  WorkingWeightsRepo,
} from "../db/client";

// ============================================================================
// STORE STATE
// ============================================================================

interface UserStore {
  // State
  profile: UserProfile | null;
  exercises: Exercise[];
  workingWeights: Record<string, number>;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProfile: () => Promise<void>;
  loadExercises: () => Promise<void>;
  loadWorkingWeights: () => Promise<void>;
  updateBodyweight: (bodyweight: number) => Promise<void>;
  updateWorkingWeight: (exerciseId: string, weight: number) => Promise<void>;
  incrementWeek: () => Promise<void>;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useUserStore = create<UserStore>((set, get) => ({
  // Initial state
  profile: null,
  exercises: [],
  workingWeights: {},
  isLoading: false,
  error: null,

  // ============================================================================
  // LOAD PROFILE
  // ============================================================================

  loadProfile: async () => {
    try {
      set({ isLoading: true, error: null });

      const profileData = await UserProfileRepo.get();

      if (!profileData) {
        console.log("[UserStore] No profile found - user needs onboarding");
        set({ profile: null, isLoading: false });
        return;
      }

      // Convert database row to UserProfile
      const profile: UserProfile = {
        uid: "local",
        name: (profileData as any).name,
        bodyweight: (profileData as any).bodyweight,
        experienceLevel: (profileData as any).experience_level,
        trainingDaysPerWeek: (profileData as any).training_days_per_week,
        currentWeek: (profileData as any).current_week,
        weeklyTargets: {
          push: (profileData as any).push_weekly_target,
          pull: (profileData as any).pull_weekly_target,
          legs: (profileData as any).legs_weekly_target,
        },
        startingVolume: {
          push: (profileData as any).push_starting_volume,
          pull: (profileData as any).pull_starting_volume,
          legs: (profileData as any).legs_starting_volume,
        },
        workingWeights: {}, // Will be loaded separately
        weekStartDate: (profileData as any).week_start_date,
        createdAt: (profileData as any).created_at,
        updatedAt: (profileData as any).updated_at,
      };

      set({ profile, isLoading: false });
      console.log("[UserStore] Profile loaded");
    } catch (error) {
      console.error("[UserStore] Failed to load profile:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to load profile",
        isLoading: false,
      });
    }
  },

  // ============================================================================
  // LOAD EXERCISES
  // ============================================================================

  loadExercises: async () => {
    try {
      console.log("[UserStore] Loading exercises from database...");
      const exercisesData = await ExercisesRepo.getAll();
      console.log("[UserStore] Fetched exercises data:", exercisesData?.length || 0, "rows");

      // Convert database rows to Exercise objects
      const exercises: Exercise[] = (exercisesData as any[]).map((row) => ({
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

      console.log("[UserStore] Converted exercises:", exercises.length);
      if (exercises.length > 0) {
        console.log("[UserStore] First exercise:", exercises[0]);
        const firstPush = exercises.find((ex) => ex.muscleGroup === "push");
        console.log("[UserStore] First PUSH exercise:", firstPush);
        const pushExercises = exercises.filter((ex) => ex.muscleGroup === "push");
        console.log("[UserStore] Total PUSH exercises:", pushExercises.length);
      }

      set({ exercises });
      console.log(`[UserStore] Loaded ${exercises.length} exercises`);
    } catch (error) {
      console.error("[UserStore] Failed to load exercises:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to load exercises",
      });
    }
  },

  // ============================================================================
  // LOAD WORKING WEIGHTS
  // ============================================================================

  loadWorkingWeights: async () => {
    try {
      const weightsData = await WorkingWeightsRepo.getAll();

      // Convert to Record
      const workingWeights: Record<string, number> = {};
      (weightsData as any[]).forEach((row) => {
        workingWeights[row.exercise_id] = row.weight;
      });

      set({ workingWeights });
      console.log(
        `[UserStore] Loaded ${Object.keys(workingWeights).length} working weights`
      );
    } catch (error) {
      console.error("[UserStore] Failed to load working weights:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to load working weights",
      });
    }
  },

  // ============================================================================
  // UPDATE BODYWEIGHT
  // ============================================================================

  updateBodyweight: async (bodyweight: number) => {
    const { profile } = get();

    if (!profile) {
      console.error("[UserStore] No profile to update");
      return;
    }

    try {
      set({ isLoading: true });

      // Update in database
      await UserProfileRepo.update({
        ...profile,
        bodyweight,
      });

      // Update local state
      set({
        profile: { ...profile, bodyweight },
        isLoading: false,
      });

      console.log(`[UserStore] Bodyweight updated to ${bodyweight} lbs`);
    } catch (error) {
      console.error("[UserStore] Failed to update bodyweight:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to update bodyweight",
        isLoading: false,
      });
    }
  },

  // ============================================================================
  // UPDATE WORKING WEIGHT
  // ============================================================================

  updateWorkingWeight: async (exerciseId: string, weight: number) => {
    try {
      // Update in database
      await WorkingWeightsRepo.upsert(exerciseId, weight);

      // Update local state
      set((state) => ({
        workingWeights: {
          ...state.workingWeights,
          [exerciseId]: weight,
        },
      }));

      console.log(`[UserStore] Working weight updated: ${exerciseId} = ${weight} lbs`);
    } catch (error) {
      console.error("[UserStore] Failed to update working weight:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to update working weight",
      });
    }
  },

  // ============================================================================
  // INCREMENT WEEK
  // ============================================================================

  incrementWeek: async () => {
    const { profile } = get();

    if (!profile) {
      console.error("[UserStore] No profile to update");
      return;
    }

    try {
      set({ isLoading: true });

      const newWeekNumber = profile.currentWeek + 1;

      // Calculate new week start date (next Monday)
      const currentWeekStart = new Date(profile.weekStartDate);
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const newWeekStartDate = nextWeekStart.toISOString().split("T")[0];

      // Update in database
      await UserProfileRepo.update({
        ...profile,
        currentWeek: newWeekNumber,
        weekStartDate: newWeekStartDate,
      });

      // Update local state
      set({
        profile: {
          ...profile,
          currentWeek: newWeekNumber,
          weekStartDate: newWeekStartDate,
        },
        isLoading: false,
      });

      console.log(`[UserStore] Week incremented to ${newWeekNumber}`);
    } catch (error) {
      console.error("[UserStore] Failed to increment week:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to increment week",
        isLoading: false,
      });
    }
  },
}));
