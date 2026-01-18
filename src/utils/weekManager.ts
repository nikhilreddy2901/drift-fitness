/**
 * DRIFT FITNESS - WEEK MANAGER
 * Handles automatic week progression based on calendar weeks
 */

import { UserProfileRepo, WeeklyProgressRepo, WorkoutsRepo } from '../db/client';
import { format, parseISO, differenceInWeeks, startOfWeek, addWeeks, endOfWeek } from 'date-fns';
import { calculateNextWeekTarget, isDeloadWeek } from './overloadLogic';
import { generateWeeklySchedule, serializeSchedule } from './scheduleGenerator';

/**
 * Check if we need to advance to a new week and update if necessary
 * Should be called on app startup and when loading home screen
 */
export async function checkAndAdvanceWeek(): Promise<boolean> {
  try {
    const profile = await UserProfileRepo.get();
    if (!profile) {
      console.log('[WeekManager] No profile found, skipping week check');
      return false;
    }

    const weekStartDate = (profile as any).week_start_date;
    const currentWeek = (profile as any).current_week;

    if (!weekStartDate) {
      console.log('[WeekManager] No week start date found');
      return false;
    }

    // Parse the stored week start date
    const storedWeekStart = parseISO(weekStartDate);
    const today = new Date();

    // Get the Monday of current calendar week
    const currentMonday = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday

    // Calculate how many weeks have passed since the stored week start
    const weeksPassed = differenceInWeeks(currentMonday, storedWeekStart);

    if (weeksPassed <= 0) {
      // Still in the same week or earlier, no need to advance
      console.log('[WeekManager] Still in current week, no advancement needed');
      return false;
    }

    // We need to advance the week!
    console.log(`[WeekManager] ${weeksPassed} week(s) have passed, advancing...`);

    // Calculate new week number and start date
    const newWeekNumber = currentWeek + weeksPassed;
    const newWeekStartDate = format(addWeeks(storedWeekStart, weeksPassed), 'yyyy-MM-dd');

    // Update the profile
    await UserProfileRepo.update({
      name: (profile as any).name,
      bodyweight: (profile as any).bodyweight,
      experienceLevel: (profile as any).experience_level,
      trainingDaysPerWeek: (profile as any).training_days_per_week,
      currentWeek: newWeekNumber,
      weekStartDate: newWeekStartDate,
      weeklyTargets: {
        push: (profile as any).push_weekly_target,
        pull: (profile as any).pull_weekly_target,
        legs: (profile as any).legs_weekly_target,
      },
    });

    console.log(`[WeekManager] Advanced to week ${newWeekNumber}, starting ${newWeekStartDate}`);

    // Calculate new volume targets using progressive overload
    const newTargets = await calculateNewWeekTargets(
      profile as any,
      weekStartDate,
      newWeekNumber
    );

    // Update profile with new targets
    await UserProfileRepo.update({
      name: (profile as any).name,
      bodyweight: (profile as any).bodyweight,
      experienceLevel: (profile as any).experience_level,
      trainingDaysPerWeek: (profile as any).training_days_per_week,
      currentWeek: newWeekNumber,
      weekStartDate: newWeekStartDate,
      weeklyTargets: newTargets,
    });

    // Create new weekly progress entry
    await createNewWeekProgress(
      newWeekNumber,
      newWeekStartDate,
      newTargets,
      (profile as any).training_days_per_week
    );

    console.log('[WeekManager] New week initialized with progressive overload targets:', newTargets);

    return true;
  } catch (error) {
    console.error('[WeekManager] Error checking/advancing week:', error);
    return false;
  }
}

/**
 * Get how many days are left in the current week (including today)
 * Always uses device's local timezone
 */
export function getDaysLeftInWeek(weekStartDate: string): number {
  try {
    // Parse week start date
    const weekStart = parseISO(weekStartDate);

    // Get today's date in local timezone (strip time for day-based calculation)
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekStartDateOnly = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());

    // Calculate how many days into the week we are (0 = Monday, 6 = Sunday)
    const millisInDay = 1000 * 60 * 60 * 24;
    const daysPassed = Math.floor((todayDateOnly.getTime() - weekStartDateOnly.getTime()) / millisInDay);

    // If we're past the week (shouldn't happen with proper week advancement), return 0
    if (daysPassed >= 7) return 0;
    if (daysPassed < 0) return 7; // If week hasn't started yet, 7 days remain

    // Calculate days remaining in the week (7 total days - days already passed)
    const daysRemaining = 7 - daysPassed;

    return daysRemaining;
  } catch (error) {
    console.error('[getDaysLeftInWeek] Error:', error);
    return 7;
  }
}

/**
 * Calculate new volume targets for next week using progressive overload
 */
async function calculateNewWeekTargets(
  profile: any,
  lastWeekStartDate: string,
  newWeekNumber: number
): Promise<{ push: number; pull: number; legs: number }> {
  try {
    // Get all completed workouts from last week
    const weekStart = lastWeekStartDate;
    const weekEnd = format(endOfWeek(parseISO(weekStart), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const lastWeekWorkouts = await WorkoutsRepo.getByDateRange(weekStart, weekEnd);
    const completedWorkouts = (lastWeekWorkouts as any[]).filter(w => w.status === 'completed');

    // Calculate average RPE per muscle group
    const rpeByMuscleGroup: Record<string, number[]> = {
      push: [],
      pull: [],
      legs: [],
    };

    completedWorkouts.forEach((workout: any) => {
      if (workout.session_rpe) {
        rpeByMuscleGroup[workout.muscle_group].push(workout.session_rpe);
      }
    });

    // Calculate average RPE (default to 7 if no data)
    const avgRPEs = {
      push: rpeByMuscleGroup.push.length > 0
        ? rpeByMuscleGroup.push.reduce((a, b) => a + b, 0) / rpeByMuscleGroup.push.length
        : 7,
      pull: rpeByMuscleGroup.pull.length > 0
        ? rpeByMuscleGroup.pull.reduce((a, b) => a + b, 0) / rpeByMuscleGroup.pull.length
        : 7,
      legs: rpeByMuscleGroup.legs.length > 0
        ? rpeByMuscleGroup.legs.reduce((a, b) => a + b, 0) / rpeByMuscleGroup.legs.length
        : 7,
    };

    console.log('[WeekManager] Average RPEs from last week:', avgRPEs);

    // Calculate new targets using progressive overload logic
    const newPushTarget = calculateNextWeekTarget(
      profile.push_weekly_target,
      avgRPEs.push,
      newWeekNumber - 1, // Week number is for the new week, so subtract 1 for the calculation
      profile.push_starting_volume
    );

    const newPullTarget = calculateNextWeekTarget(
      profile.pull_weekly_target,
      avgRPEs.pull,
      newWeekNumber - 1,
      profile.pull_starting_volume
    );

    const newLegsTarget = calculateNextWeekTarget(
      profile.legs_weekly_target,
      avgRPEs.legs,
      newWeekNumber - 1,
      profile.legs_starting_volume
    );

    return {
      push: newPushTarget,
      pull: newPullTarget,
      legs: newLegsTarget,
    };
  } catch (error) {
    console.error('[WeekManager] Error calculating new targets, using current targets:', error);
    // Fallback to current targets if calculation fails
    return {
      push: profile.push_weekly_target,
      pull: profile.pull_weekly_target,
      legs: profile.legs_weekly_target,
    };
  }
}

/**
 * Create a new weekly progress entry for the new week
 */
async function createNewWeekProgress(
  weekNumber: number,
  weekStartDate: string,
  targets: { push: number; pull: number; legs: number },
  trainingDaysPerWeek: number
): Promise<void> {
  try {
    // Generate smart schedule
    const schedule = generateWeeklySchedule(weekStartDate, trainingDaysPerWeek);
    const serializedSchedule = serializeSchedule(schedule);

    // Count sessions per muscle group
    const sessionsCount = {
      push: schedule.push.length,
      pull: schedule.pull.length,
      legs: schedule.legs.length,
    };

    const newProgress = {
      id: `week-${weekStartDate}`,
      weekStartDate,
      weekNumber,
      isDeloadWeek: isDeloadWeek(weekNumber),
      status: 'active',
      plannedSchedule: serializedSchedule,
      buckets: {
        push: {
          targetVolume: targets.push,
          completedVolume: 0,
          completionPercentage: 0,
          sessionsPlanned: sessionsCount.push,
          sessionsCompleted: 0,
          driftAmount: 0,
        },
        pull: {
          targetVolume: targets.pull,
          completedVolume: 0,
          completionPercentage: 0,
          sessionsPlanned: sessionsCount.pull,
          sessionsCompleted: 0,
          driftAmount: 0,
        },
        legs: {
          targetVolume: targets.legs,
          completedVolume: 0,
          completionPercentage: 0,
          sessionsPlanned: sessionsCount.legs,
          sessionsCompleted: 0,
          driftAmount: 0,
        },
      },
    };

    await WeeklyProgressRepo.insert(newProgress);

    console.log('[WeekManager] Created new weekly progress entry');
  } catch (error) {
    console.error('[WeekManager] Error creating new weekly progress:', error);
    throw error;
  }
}
