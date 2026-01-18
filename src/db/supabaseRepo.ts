/**
 * DRIFT FITNESS - SUPABASE REPOSITORY LAYER
 * Cloud database operations for user data
 */

import { supabase } from '../lib/supabase';
import type { ExperienceLevel } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserProfile {
  id: string;
  user_id: string;
  name?: string;
  bodyweight: number;
  experience_level: ExperienceLevel;
  training_days_per_week: number;
  current_week: number;
  week_start_date: string;
  push_weekly_target: number;
  pull_weekly_target: number;
  legs_weekly_target: number;
  push_starting_volume: number;
  pull_starting_volume: number;
  legs_starting_volume: number;
  created_at: string;
  updated_at: string;
}

export interface WorkingWeight {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  last_updated: string;
}

export interface WeeklyProgress {
  id: string;
  user_id: string;
  week_start_date: string;
  week_number: number;
  is_deload_week: boolean;
  status: 'active' | 'completed' | 'forgiven';

  push_target_volume: number;
  push_completed_volume: number;
  push_completion_percentage: number;
  push_sessions_planned: number;
  push_sessions_completed: number;
  push_drift_amount: number;

  pull_target_volume: number;
  pull_completed_volume: number;
  pull_completion_percentage: number;
  pull_sessions_planned: number;
  pull_sessions_completed: number;
  pull_drift_amount: number;

  legs_target_volume: number;
  legs_completed_volume: number;
  legs_completion_percentage: number;
  legs_sessions_planned: number;
  legs_sessions_completed: number;
  legs_drift_amount: number;

  average_rpe?: number;
  completed_at?: string;
  created_at: string;
}

// ============================================================================
// USER PROFILE REPOSITORY
// ============================================================================

export const SupabaseUserProfileRepo = {
  /**
   * Get current user's profile
   */
  async get(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // PGRST116 means "no rows found" - this is expected for new users
      if (error.code === 'PGRST116') {
        console.log('[Supabase] No profile found in cloud (expected for new users)');
        return null;
      }

      // Log actual errors
      console.error('[Supabase] Error fetching profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Create user profile
   */
  async create(profile: {
    name?: string;
    bodyweight: number;
    experienceLevel: ExperienceLevel;
    trainingDaysPerWeek: number;
    currentWeek: number;
    weekStartDate: string;
    weeklyTargets: { push: number; pull: number; legs: number };
    startingVolume: { push: number; pull: number; legs: number };
  }): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_profile')
      .insert({
        user_id: user.id,
        name: profile.name || null,
        bodyweight: profile.bodyweight,
        experience_level: profile.experienceLevel,
        training_days_per_week: profile.trainingDaysPerWeek,
        current_week: profile.currentWeek,
        week_start_date: profile.weekStartDate,
        push_weekly_target: profile.weeklyTargets.push,
        pull_weekly_target: profile.weeklyTargets.pull,
        legs_weekly_target: profile.weeklyTargets.legs,
        push_starting_volume: profile.startingVolume.push,
        pull_starting_volume: profile.startingVolume.pull,
        legs_starting_volume: profile.startingVolume.legs,
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error creating profile:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update user profile
   */
  async update(updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_profile')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Supabase] Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Upsert (insert or update) user profile
   */
  async upsert(profile: {
    bodyweight: number;
    experienceLevel: ExperienceLevel;
    trainingDaysPerWeek: number;
    currentWeek: number;
    weekStartDate: string;
    weeklyTargets: { push: number; pull: number; legs: number };
    startingVolume: { push: number; pull: number; legs: number };
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_profile')
      .upsert({
        user_id: user.id,
        bodyweight: profile.bodyweight,
        experience_level: profile.experienceLevel,
        training_days_per_week: profile.trainingDaysPerWeek,
        current_week: profile.currentWeek,
        week_start_date: profile.weekStartDate,
        push_weekly_target: profile.weeklyTargets.push,
        pull_weekly_target: profile.weeklyTargets.pull,
        legs_weekly_target: profile.weeklyTargets.legs,
        push_starting_volume: profile.startingVolume.push,
        pull_starting_volume: profile.startingVolume.pull,
        legs_starting_volume: profile.startingVolume.legs,
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[Supabase] Error upserting profile:', error);
      throw error;
    }
  },
};

// ============================================================================
// WORKING WEIGHTS REPOSITORY
// ============================================================================

export const SupabaseWorkingWeightsRepo = {
  /**
   * Get working weight for an exercise
   */
  async get(exerciseId: string): Promise<number | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('working_weights')
      .select('weight')
      .eq('user_id', user.id)
      .eq('exercise_id', exerciseId)
      .single();

    if (error || !data) return null;
    return data.weight;
  },

  /**
   * Upsert (insert or update) working weight
   */
  async upsert(exerciseId: string, weight: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('working_weights')
      .upsert({
        user_id: user.id,
        exercise_id: exerciseId,
        weight,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'user_id,exercise_id',
      });

    if (error) {
      console.error('[Supabase] Error upserting working weight:', error);
      throw error;
    }
  },

  /**
   * Get all working weights for current user
   */
  async getAll(): Promise<Record<string, number>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const { data, error } = await supabase
      .from('working_weights')
      .select('exercise_id, weight')
      .eq('user_id', user.id);

    if (error) {
      console.error('[Supabase] Error fetching working weights:', error);
      return {};
    }

    return data.reduce((acc, item) => {
      acc[item.exercise_id] = item.weight;
      return acc;
    }, {} as Record<string, number>);
  },
};

// ============================================================================
// WEEKLY PROGRESS REPOSITORY
// ============================================================================

export const SupabaseWeeklyProgressRepo = {
  /**
   * Insert new weekly progress
   */
  async insert(progress: {
    weekStartDate: string;
    weekNumber: number;
    isDeloadWeek: boolean;
    buckets: {
      push: {
        targetVolume: number;
        completedVolume: number;
        completionPercentage: number;
        sessionsPlanned: number;
        sessionsCompleted: number;
        driftAmount: number;
      };
      pull: {
        targetVolume: number;
        completedVolume: number;
        completionPercentage: number;
        sessionsPlanned: number;
        sessionsCompleted: number;
        driftAmount: number;
      };
      legs: {
        targetVolume: number;
        completedVolume: number;
        completionPercentage: number;
        sessionsPlanned: number;
        sessionsCompleted: number;
        driftAmount: number;
      };
    };
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('weekly_progress')
      .insert({
        user_id: user.id,
        week_start_date: progress.weekStartDate,
        week_number: progress.weekNumber,
        is_deload_week: progress.isDeloadWeek,

        push_target_volume: progress.buckets.push.targetVolume,
        push_completed_volume: progress.buckets.push.completedVolume,
        push_completion_percentage: progress.buckets.push.completionPercentage,
        push_sessions_planned: progress.buckets.push.sessionsPlanned,
        push_sessions_completed: progress.buckets.push.sessionsCompleted,
        push_drift_amount: progress.buckets.push.driftAmount,

        pull_target_volume: progress.buckets.pull.targetVolume,
        pull_completed_volume: progress.buckets.pull.completedVolume,
        pull_completion_percentage: progress.buckets.pull.completionPercentage,
        pull_sessions_planned: progress.buckets.pull.sessionsPlanned,
        pull_sessions_completed: progress.buckets.pull.sessionsCompleted,
        pull_drift_amount: progress.buckets.pull.driftAmount,

        legs_target_volume: progress.buckets.legs.targetVolume,
        legs_completed_volume: progress.buckets.legs.completedVolume,
        legs_completion_percentage: progress.buckets.legs.completionPercentage,
        legs_sessions_planned: progress.buckets.legs.sessionsPlanned,
        legs_sessions_completed: progress.buckets.legs.sessionsCompleted,
        legs_drift_amount: progress.buckets.legs.driftAmount,
      });

    if (error) {
      console.error('[Supabase] Error inserting weekly progress:', error);
      throw error;
    }
  },

  /**
   * Upsert weekly progress
   */
  async upsert(progress: {
    id: string;
    weekStartDate: string;
    weekNumber: number;
    isDeloadWeek: boolean;
    status: string;
    buckets: {
      push: {
        targetVolume: number;
        completedVolume: number;
        completionPercentage: number;
        sessionsPlanned: number;
        sessionsCompleted: number;
        driftAmount: number;
      };
      pull: {
        targetVolume: number;
        completedVolume: number;
        completionPercentage: number;
        sessionsPlanned: number;
        sessionsCompleted: number;
        driftAmount: number;
      };
      legs: {
        targetVolume: number;
        completedVolume: number;
        completionPercentage: number;
        sessionsPlanned: number;
        sessionsCompleted: number;
        driftAmount: number;
      };
    };
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('weekly_progress')
      .upsert({
        id: progress.id,
        user_id: user.id,
        week_start_date: progress.weekStartDate,
        week_number: progress.weekNumber,
        is_deload_week: progress.isDeloadWeek,
        status: progress.status,

        push_target_volume: progress.buckets.push.targetVolume,
        push_completed_volume: progress.buckets.push.completedVolume,
        push_completion_percentage: progress.buckets.push.completionPercentage,
        push_sessions_planned: progress.buckets.push.sessionsPlanned,
        push_sessions_completed: progress.buckets.push.sessionsCompleted,
        push_drift_amount: progress.buckets.push.driftAmount,

        pull_target_volume: progress.buckets.pull.targetVolume,
        pull_completed_volume: progress.buckets.pull.completedVolume,
        pull_completion_percentage: progress.buckets.pull.completionPercentage,
        pull_sessions_planned: progress.buckets.pull.sessionsPlanned,
        pull_sessions_completed: progress.buckets.pull.sessionsCompleted,
        pull_drift_amount: progress.buckets.pull.driftAmount,

        legs_target_volume: progress.buckets.legs.targetVolume,
        legs_completed_volume: progress.buckets.legs.completedVolume,
        legs_completion_percentage: progress.buckets.legs.completionPercentage,
        legs_sessions_planned: progress.buckets.legs.sessionsPlanned,
        legs_sessions_completed: progress.buckets.legs.sessionsCompleted,
        legs_drift_amount: progress.buckets.legs.driftAmount,
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('[Supabase] Error upserting weekly progress:', error);
      throw error;
    }
  },

  /**
   * Get current week's progress
   */
  async getCurrent(): Promise<WeeklyProgress | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('weekly_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('week_start_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data;
  },
};

// ============================================================================
// AUTH HELPERS
// ============================================================================

export const SupabaseAuthHelpers = {
  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[Supabase] Error signing out:', error);
      throw error;
    }
  },
};
