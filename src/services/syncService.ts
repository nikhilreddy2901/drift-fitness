/**
 * DRIFT FITNESS - SYNC SERVICE
 * Handles bidirectional sync between SQLite (local) and Supabase (cloud)
 *
 * Strategy: SQLite is the source of truth
 * - All writes go to SQLite first
 * - Sync to Supabase in background when online
 * - On app start, pull latest from Supabase if available
 */

import { supabase } from '../lib/supabase';
import {
  UserProfileRepo,
  WorkingWeightsRepo,
  WeeklyProgressRepo,
  ExercisesRepo
} from '../db/client';
import {
  SupabaseUserProfileRepo,
  SupabaseWorkingWeightsRepo,
  SupabaseWeeklyProgressRepo
} from '../db/supabaseRepo';
import { getCurrentUser, isAnonymousUser } from './auth';

// ============================================================================
// SYNC STATUS
// ============================================================================

let isSyncing = false;
let lastSyncTime: Date | null = null;

export function getSyncStatus() {
  return {
    isSyncing,
    lastSyncTime,
  };
}

// ============================================================================
// CHECK ONLINE STATUS
// ============================================================================

async function isOnline(): Promise<boolean> {
  try {
    // Simple ping to Supabase to check connectivity (works for all users)
    const { error } = await supabase.from('exercises').select('id').limit(1);
    return error === null || error.code !== 'PGRST301'; // Not offline error
  } catch {
    return false;
  }
}

// ============================================================================
// SYNC EXERCISES (Cloud → SQLite)
// ============================================================================

async function syncExercisesFromCloud(): Promise<void> {
  try {
    // Fetch all exercises from Supabase
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');

    if (error) {
      console.error('[Sync] Error fetching exercises from cloud:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('[Sync] No exercises found in cloud');
      return;
    }

    console.log(`[Sync] Found ${data.length} exercises in cloud, syncing to local SQLite...`);

    // Upsert each exercise to SQLite
    // This will insert if doesn't exist, or update if it does
    for (const exercise of data) {
      await ExercisesRepo.upsert({
        id: exercise.id,
        name: exercise.name,
        muscle_group: exercise.muscle_group,
        slot: exercise.slot,
        type: exercise.type,
        equipment: exercise.equipment,
        load_type: exercise.load_type,
        rep_range_min: exercise.rep_range_min,
        rep_range_max: exercise.rep_range_max,
        movement_pattern: exercise.movement_pattern,
        primary_muscle: exercise.primary_muscle,
        bodyweight_multiplier: exercise.bodyweight_multiplier,
      });
    }

    console.log(`[Sync] Successfully synced ${data.length} exercises to local SQLite`);
  } catch (error) {
    console.error('[Sync] Error syncing exercises:', error);
    // Don't throw - exercises sync failure shouldn't block user data sync
  }
}

// ============================================================================
// SYNC TO CLOUD (SQLite → Supabase)
// ============================================================================

export async function syncToCloud(): Promise<{ success: boolean; error?: string }> {
  if (isSyncing) {
    console.log('[Sync] Already syncing, skipping...');
    return { success: false, error: 'Sync already in progress' };
  }

  try {
    isSyncing = true;
    console.log('[Sync] Starting sync to cloud...');

    // Check if online
    const online = await isOnline();
    if (!online) {
      console.log('[Sync] Offline, skipping sync');
      return { success: false, error: 'Offline' };
    }

    // Get user
    const user = await getCurrentUser();
    if (!user) {
      console.log('[Sync] No user authenticated, skipping sync');
      return { success: false, error: 'Not authenticated' };
    }

    // Skip sync for anonymous users (they don't have cloud storage)
    const anonymous = await isAnonymousUser();
    if (anonymous) {
      console.log('[Sync] Anonymous user detected, skipping sync to cloud');
      return { success: true }; // Not an error, just skip
    }

    // Sync profile
    const profile = await UserProfileRepo.get();
    if (profile) {
      console.log('[Sync] Syncing profile...');
      await SupabaseUserProfileRepo.upsert({
        name: (profile as any).name,
        bodyweight: (profile as any).bodyweight,
        experienceLevel: (profile as any).experience_level,
        trainingDaysPerWeek: (profile as any).training_days_per_week,
        currentWeek: (profile as any).current_week,
        weekStartDate: (profile as any).week_start_date,
        weeklyTargets: {
          push: (profile as any).push_weekly_target,
          pull: (profile as any).pull_weekly_target,
          legs: (profile as any).legs_weekly_target,
        },
        startingVolume: {
          push: (profile as any).push_starting_volume,
          pull: (profile as any).pull_starting_volume,
          legs: (profile as any).legs_starting_volume,
        },
      });
      console.log('[Sync] Profile synced');
    }

    // Sync working weights
    console.log('[Sync] Syncing working weights...');
    const weights = await WorkingWeightsRepo.getAll();
    for (const weight of weights as any[]) {
      await SupabaseWorkingWeightsRepo.upsert(weight.exercise_id, weight.weight);
    }
    console.log('[Sync] Working weights synced');

    // Sync weekly progress
    console.log('[Sync] Syncing weekly progress...');
    const weeklyProgress = await WeeklyProgressRepo.getCurrentWeek();
    if (weeklyProgress) {
      const wp = weeklyProgress as any;
      await SupabaseWeeklyProgressRepo.upsert({
        id: wp.id,
        weekStartDate: wp.week_start_date,
        weekNumber: wp.week_number,
        isDeloadWeek: wp.is_deload_week === 1,
        status: wp.status,
        buckets: {
          push: {
            targetVolume: wp.push_target_volume,
            completedVolume: wp.push_completed_volume || 0,
            completionPercentage: wp.push_completion_percentage || 0,
            sessionsPlanned: wp.push_sessions_planned,
            sessionsCompleted: wp.push_sessions_completed || 0,
            driftAmount: wp.push_drift_amount || 0,
          },
          pull: {
            targetVolume: wp.pull_target_volume,
            completedVolume: wp.pull_completed_volume || 0,
            completionPercentage: wp.pull_completion_percentage || 0,
            sessionsPlanned: wp.pull_sessions_planned,
            sessionsCompleted: wp.pull_sessions_completed || 0,
            driftAmount: wp.pull_drift_amount || 0,
          },
          legs: {
            targetVolume: wp.legs_target_volume,
            completedVolume: wp.legs_completed_volume || 0,
            completionPercentage: wp.legs_completion_percentage || 0,
            sessionsPlanned: wp.legs_sessions_planned,
            sessionsCompleted: wp.legs_sessions_completed || 0,
            driftAmount: wp.legs_drift_amount || 0,
          },
        },
      });
      console.log('[Sync] Weekly progress synced');
    }

    lastSyncTime = new Date();
    console.log('[Sync] Sync to cloud completed successfully');
    return { success: true };
  } catch (error) {
    console.error('[Sync] Error syncing to cloud:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    isSyncing = false;
  }
}

// ============================================================================
// SYNC FROM CLOUD (Supabase → SQLite)
// ============================================================================

export async function syncFromCloud(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[Sync] Starting sync from cloud...');

    // Check if online
    const online = await isOnline();
    if (!online) {
      console.log('[Sync] Offline, skipping sync');
      return { success: false, error: 'Offline' };
    }

    // ALWAYS sync exercises from cloud (shared data, available to all users)
    console.log('[Sync] Syncing exercise library from cloud...');
    await syncExercisesFromCloud();
    console.log('[Sync] Exercise library synced');

    // Get user - check if authenticated for user-specific data sync
    const user = await getCurrentUser();
    if (!user) {
      console.log('[Sync] No user authenticated, skipping user data sync');
      return { success: true }; // Exercise sync succeeded, which is all we need
    }

    // Skip user data sync for anonymous users (they don't have cloud storage)
    const anonymous = await isAnonymousUser();
    if (anonymous) {
      console.log('[Sync] Anonymous user detected, skipping user data sync');
      return { success: true }; // Exercise sync succeeded, which is all anonymous users need
    }

    // User is authenticated - sync user-specific data
    console.log('[Sync] Authenticated user, syncing user data from cloud...');

    // Check if local profile exists
    const localProfile = await UserProfileRepo.get();
    if (localProfile) {
      console.log('[Sync] Local profile exists, user data already synced (local is source of truth)');
      return { success: true };
    }

    // No local profile - pull from cloud
    console.log('[Sync] No local profile, pulling from cloud...');
    const cloudProfile = await SupabaseUserProfileRepo.get();

    if (!cloudProfile) {
      console.log('[Sync] No cloud profile either, user needs onboarding');
      return { success: false, error: 'No profile found' };
    }

    // Save cloud profile to local
    await UserProfileRepo.create({
      name: (cloudProfile as any).name,
      bodyweight: (cloudProfile as any).bodyweight,
      experienceLevel: (cloudProfile as any).experience_level,
      trainingDaysPerWeek: (cloudProfile as any).training_days_per_week,
      currentWeek: (cloudProfile as any).current_week,
      weekStartDate: (cloudProfile as any).week_start_date,
      weeklyTargets: {
        push: (cloudProfile as any).push_weekly_target,
        pull: (cloudProfile as any).pull_weekly_target,
        legs: (cloudProfile as any).legs_weekly_target,
      },
      startingVolume: {
        push: (cloudProfile as any).push_starting_volume,
        pull: (cloudProfile as any).pull_starting_volume,
        legs: (cloudProfile as any).legs_starting_volume,
      },
    });

    console.log('[Sync] Profile synced from cloud');

    // Sync working weights from cloud
    console.log('[Sync] Syncing working weights from cloud...');
    const cloudWeights = await SupabaseWorkingWeightsRepo.getAll();
    for (const [exerciseId, weight] of Object.entries(cloudWeights)) {
      await WorkingWeightsRepo.upsert(exerciseId, weight);
    }
    console.log('[Sync] Working weights synced from cloud');

    // Sync weekly progress from cloud
    console.log('[Sync] Syncing weekly progress from cloud...');
    const cloudProgress = await SupabaseWeeklyProgressRepo.getCurrent();
    if (cloudProgress) {
      const cp = cloudProgress as any;
      await WeeklyProgressRepo.upsert({
        id: cp.id,
        weekStartDate: cp.week_start_date,
        weekNumber: cp.week_number,
        isDeloadWeek: cp.is_deload_week === 1,
        status: cp.status,
        buckets: {
          push: {
            targetVolume: cp.push_target_volume,
            completedVolume: cp.push_completed_volume || 0,
            completionPercentage: cp.push_completion_percentage || 0,
            sessionsPlanned: cp.push_sessions_planned,
            sessionsCompleted: cp.push_sessions_completed || 0,
            driftAmount: cp.push_drift_amount || 0,
          },
          pull: {
            targetVolume: cp.pull_target_volume,
            completedVolume: cp.pull_completed_volume || 0,
            completionPercentage: cp.pull_completion_percentage || 0,
            sessionsPlanned: cp.pull_sessions_planned,
            sessionsCompleted: cp.pull_sessions_completed || 0,
            driftAmount: cp.pull_drift_amount || 0,
          },
          legs: {
            targetVolume: cp.legs_target_volume,
            completedVolume: cp.legs_completed_volume || 0,
            completionPercentage: cp.legs_completion_percentage || 0,
            sessionsPlanned: cp.legs_sessions_planned,
            sessionsCompleted: cp.legs_sessions_completed || 0,
            driftAmount: cp.legs_drift_amount || 0,
          },
        },
      });
      console.log('[Sync] Weekly progress synced from cloud');
    }

    console.log('[Sync] Sync from cloud completed successfully');
    return { success: true };
  } catch (error) {
    console.error('[Sync] Error syncing from cloud:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// FULL SYNC (Bidirectional)
// ============================================================================

export async function fullSync(): Promise<{ success: boolean; error?: string }> {
  console.log('[Sync] Starting full sync...');

  // First, sync from cloud (in case user logged in on different device)
  const fromCloudResult = await syncFromCloud();

  // Then, sync to cloud (push local changes)
  const toCloudResult = await syncToCloud();

  if (!toCloudResult.success) {
    return toCloudResult;
  }

  return { success: true };
}
