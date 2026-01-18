/**
 * DRIFT FITNESS - STREAK TRACKING
 * Track workout consistency for gamification
 */

import { db, WorkoutsRepo } from '../db/client';
import { format, parseISO, differenceInDays, subDays, startOfWeek } from 'date-fns';

export interface StreakData {
  currentStreak: number; // Days in a row with workouts
  longestStreak: number;
  totalWorkouts: number;
  lastWorkoutDate: string | null;
}

/**
 * Get current streak data
 */
export async function getStreakData(): Promise<StreakData> {
  try {
    const result = await db.queryOne(
      'SELECT value FROM user_stats WHERE key = ?',
      ['streak_data']
    );

    if (!result) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        lastWorkoutDate: null,
      };
    }

    return JSON.parse((result as any).value);
  } catch (error) {
    console.error('[Streak] Error loading streak data:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalWorkouts: 0,
      lastWorkoutDate: null,
    };
  }
}

/**
 * Update streak when a workout is completed
 */
export async function updateStreakOnWorkoutComplete(workoutDate: string): Promise<void> {
  try {
    const current = await getStreakData();
    const today = format(new Date(), 'yyyy-MM-dd');
    const workoutDay = format(parseISO(workoutDate), 'yyyy-MM-dd');

    // Calculate new streak
    let newStreak = current.currentStreak;

    if (!current.lastWorkoutDate) {
      // First workout ever
      newStreak = 1;
    } else {
      const lastWorkout = format(parseISO(current.lastWorkoutDate), 'yyyy-MM-dd');
      const daysSinceLastWorkout = differenceInDays(parseISO(workoutDay), parseISO(lastWorkout));

      if (daysSinceLastWorkout === 0) {
        // Same day, don't increment streak
        newStreak = current.currentStreak;
      } else if (daysSinceLastWorkout === 1) {
        // Consecutive day, increment streak
        newStreak = current.currentStreak + 1;
      } else if (daysSinceLastWorkout <= 2) {
        // Within 2 days (allows for rest days), continue streak
        newStreak = current.currentStreak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    const updated: StreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(current.longestStreak, newStreak),
      totalWorkouts: current.totalWorkouts + 1,
      lastWorkoutDate: workoutDay,
    };

    await db.execute(
      `INSERT OR REPLACE INTO user_stats (key, value, updated_at)
       VALUES (?, ?, ?)`,
      ['streak_data', JSON.stringify(updated), new Date().toISOString()]
    );

    console.log('[Streak] Updated streak:', updated);
  } catch (error) {
    console.error('[Streak] Error updating streak:', error);
  }
}

/**
 * Check if streak needs to be reset (called on app startup)
 */
export async function checkStreakValidity(): Promise<void> {
  try {
    const current = await getStreakData();

    if (!current.lastWorkoutDate) {
      return; // No workout history yet
    }

    const lastWorkout = parseISO(current.lastWorkoutDate);
    const today = new Date();
    const daysSince = differenceInDays(today, lastWorkout);

    // If more than 3 days without a workout, reset streak
    if (daysSince > 3 && current.currentStreak > 0) {
      console.log('[Streak] Streak expired, resetting');

      const updated: StreakData = {
        ...current,
        currentStreak: 0,
      };

      await db.execute(
        `INSERT OR REPLACE INTO user_stats (key, value, updated_at)
         VALUES (?, ?, ?)`,
        ['streak_data', JSON.stringify(updated), new Date().toISOString()]
      );
    }
  } catch (error) {
    console.error('[Streak] Error checking streak validity:', error);
  }
}

/**
 * Get weekly workout frequency (for insights)
 */
export async function getWeeklyWorkoutCount(weekStartDate: string): Promise<number> {
  try {
    const weekStart = weekStartDate;
    const weekEnd = format(
      new Date(parseISO(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000),
      'yyyy-MM-dd'
    );

    const workouts = await WorkoutsRepo.getByDateRange(weekStart, weekEnd);
    const completed = (workouts as any[]).filter(w => w.status === 'completed');

    return completed.length;
  } catch (error) {
    console.error('[Streak] Error getting weekly workout count:', error);
    return 0;
  }
}
