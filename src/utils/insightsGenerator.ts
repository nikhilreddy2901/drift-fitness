/**
 * DRIFT FITNESS - INSIGHTS GENERATOR
 * Generate real insights from user data (not hardcoded AI)
 */

import type { MuscleGroup } from "../types";
import { DriftItemsRepo, WorkoutsRepo } from "../db/client";
import { distributeDrift, generateDriftSummary } from "./driftEngine";
import { isDeloadWeek, getNextDeloadWeek, calculateNextWeekTarget, generateOverloadSummary } from "./overloadLogic";
import { format, parseISO, endOfWeek, formatDistanceToNow } from 'date-fns';
import { getRecentPRs } from "./prDetection";
import { getStreakData } from "./streakTracking";

export interface Insight {
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  action?: string;
  priority: number; // Higher = more important
}

/**
 * Generate insights for the home screen dashboard
 */
export async function generateInsights(
  weeklyProgress: any,
  profile: any
): Promise<Insight[]> {
  const insights: Insight[] = [];

  // 1. Check for active drift redistribution
  const driftInsights = await generateDriftInsights(weeklyProgress);
  insights.push(...driftInsights);

  // 2. Check for upcoming deload week
  const deloadInsight = generateDeloadInsight(profile.currentWeek);
  if (deloadInsight) {
    insights.push(deloadInsight);
  }

  // 3. Check for progressive overload projection
  const overloadInsight = await generateOverloadInsight(profile, weeklyProgress);
  if (overloadInsight) {
    insights.push(overloadInsight);
  }

  // 4. Check for PRs
  const prInsight = await generatePRInsight();
  if (prInsight) {
    insights.push(prInsight);
  }

  // 5. Check for completion milestones
  const milestoneInsight = generateMilestoneInsight(weeklyProgress);
  if (milestoneInsight) {
    insights.push(milestoneInsight);
  }

  // 6. Check for streak
  const streakInsight = await generateStreakInsight();
  if (streakInsight) {
    insights.push(streakInsight);
  }

  // Sort by priority (highest first) and return top 3
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

/**
 * Generate insights about active drift redistribution
 */
async function generateDriftInsights(weeklyProgress: any): Promise<Insight[]> {
  const insights: Insight[] = [];

  // Check each muscle group for active drift
  for (const muscleGroup of ['push', 'pull', 'legs'] as MuscleGroup[]) {
    const driftAmount = weeklyProgress[`${muscleGroup}_drift_amount`] || 0;
    const sessionsCompleted = weeklyProgress[`${muscleGroup}_sessions_completed`] || 0;
    const sessionsPlanned = weeklyProgress[`${muscleGroup}_sessions_planned`] || 0;
    const remainingSessions = sessionsPlanned - sessionsCompleted;
    const targetVolume = weeklyProgress[`${muscleGroup}_target_volume`];
    const sessionVolume = targetVolume / sessionsPlanned;

    if (driftAmount > 0 && remainingSessions > 0) {
      const summary = generateDriftSummary(driftAmount, remainingSessions, sessionVolume);

      insights.push({
        type: 'warning',
        title: `${capitalize(muscleGroup)} Drift Active`,
        message: `Missed volume redistributed: +${Math.round(summary.additionPerSession)} lbs per session (+${Math.round(summary.percentageIncrease)}%). ${remainingSessions} session${remainingSessions > 1 ? 's' : ''} remaining.`,
        action: 'View Details',
        priority: 90, // High priority
      });
    } else if (driftAmount > 0 && remainingSessions === 0) {
      // Drift will be forgiven
      insights.push({
        type: 'info',
        title: `${capitalize(muscleGroup)} Drift Forgiven`,
        message: `${Math.round(driftAmount)} lbs of missed volume forgiven. No sessions left to redistribute. Fresh start next week!`,
        priority: 60,
      });
    }
  }

  return insights;
}

/**
 * Generate insight about upcoming deload week
 */
function generateDeloadInsight(currentWeek: number): Insight | null {
  const nextDeloadWeek = getNextDeloadWeek(currentWeek);
  const weeksUntilDeload = nextDeloadWeek - currentWeek;

  if (isDeloadWeek(currentWeek)) {
    return {
      type: 'info',
      title: 'Deload Week Active',
      message: 'Volume reduced by 40% for recovery. Focus on form and technique.',
      action: 'Learn More',
      priority: 80,
    };
  } else if (weeksUntilDeload === 1) {
    return {
      type: 'info',
      title: 'Deload Week Coming',
      message: `Week ${nextDeloadWeek} will be a deload (40% volume reduction) for optimal recovery.`,
      action: 'Learn More',
      priority: 70,
    };
  }

  return null;
}

/**
 * Generate insight about completion milestones
 */
function generateMilestoneInsight(weeklyProgress: any): Insight | null {
  const buckets = ['push', 'pull', 'legs'];

  // Check if any bucket just hit 100%
  for (const bucket of buckets) {
    const percentage = weeklyProgress[`${bucket}_completion_percentage`] || 0;
    if (percentage >= 100) {
      return {
        type: 'success',
        title: `${capitalize(bucket)} Bucket Complete!`,
        message: `You've completed 100% of your weekly ${bucket} volume. Excellent work!`,
        priority: 85,
      };
    }
  }

  // Check if all buckets are >75%
  const allHigh = buckets.every(bucket =>
    (weeklyProgress[`${bucket}_completion_percentage`] || 0) >= 75
  );
  if (allHigh) {
    const avgPercentage = buckets.reduce((sum, bucket) =>
      sum + (weeklyProgress[`${bucket}_completion_percentage`] || 0), 0
    ) / buckets.length;

    return {
      type: 'success',
      title: 'Strong Week!',
      message: `All muscle groups at ${Math.round(avgPercentage)}% completion. Keep it up!`,
      priority: 75,
    };
  }

  return null;
}

/**
 * Generate insight about next week's progressive overload targets
 */
async function generateOverloadInsight(profile: any, weeklyProgress: any): Promise<Insight | null> {
  try {
    // Don't show during first week (no data to base RPE on)
    if (profile.currentWeek === 1) {
      return null;
    }

    // Get completed workouts from current week to calculate average RPE
    const weekStart = weeklyProgress.week_start_date;
    const weekEnd = format(endOfWeek(parseISO(weekStart), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const workouts = await WorkoutsRepo.getByDateRange(weekStart, weekEnd);
    const completedWorkouts = (workouts as any[]).filter(w => w.status === 'completed');

    if (completedWorkouts.length === 0) {
      // No completed workouts yet this week
      return null;
    }

    // Calculate average RPE
    const rpes = completedWorkouts
      .filter((w: any) => w.session_rpe)
      .map((w: any) => w.session_rpe);

    if (rpes.length === 0) {
      return null;
    }

    const avgRPE = rpes.reduce((a: number, b: number) => a + b, 0) / rpes.length;

    // Calculate projected next week target for one muscle group (use push as example)
    const currentTarget = profile.push_weekly_target;
    const nextTarget = calculateNextWeekTarget(
      currentTarget,
      avgRPE,
      profile.currentWeek,
      profile.push_starting_volume
    );

    const change = nextTarget - currentTarget;
    const percentChange = (change / currentTarget) * 100;

    if (Math.abs(percentChange) < 1) {
      // Less than 1% change, not worth showing
      return null;
    }

    const summary = generateOverloadSummary(
      currentTarget,
      avgRPE,
      profile.currentWeek,
      profile.push_starting_volume
    );

    return {
      type: summary.isNextWeekDeload ? 'info' : (change > 0 ? 'success' : 'info'),
      title: summary.isNextWeekDeload ? 'Deload Next Week' : 'Next Week Preview',
      message: summary.reason,
      priority: 65,
    };
  } catch (error) {
    console.error('[generateOverloadInsight] Error:', error);
    return null;
  }
}

/**
 * Generate insight about recent PRs
 */
async function generatePRInsight(): Promise<Insight | null> {
  try {
    const recentPRs = await getRecentPRs(1); // Get most recent PR

    if (recentPRs.length === 0) {
      return null;
    }

    const pr = recentPRs[0];
    const timeAgo = formatDistanceToNow(parseISO(pr.date), { addSuffix: true });

    let message = '';
    if (pr.type === 'weight') {
      message = `${pr.exerciseName}: ${pr.newValue} lbs × ${pr.reps} reps (previous: ${pr.oldValue} lbs). Hit ${timeAgo}!`;
    } else if (pr.type === 'reps') {
      message = `${pr.exerciseName}: ${pr.weight} lbs × ${pr.newValue} reps (previous: ${pr.oldValue} reps). Hit ${timeAgo}!`;
    } else {
      message = `${pr.exerciseName}: ${pr.weight} lbs × ${pr.reps} reps = ${pr.newValue} lbs total (previous: ${pr.oldValue} lbs). Hit ${timeAgo}!`;
    }

    return {
      type: 'success',
      title: 'New Personal Record!',
      message,
      action: 'See All PRs',
      priority: 95, // Highest priority
    };
  } catch (error) {
    console.error('[generatePRInsight] Error:', error);
    return null;
  }
}

/**
 * Generate insight about workout streak
 */
async function generateStreakInsight(): Promise<Insight | null> {
  try {
    const streak = await getStreakData();

    if (streak.currentStreak === 0) {
      return null; // No active streak
    }

    // Milestones: 3, 7, 14, 21, 30 days
    const milestones = [3, 7, 14, 21, 30, 60, 90, 100];
    const recentMilestone = milestones.find(m => m === streak.currentStreak);

    if (recentMilestone) {
      return {
        type: 'success',
        title: `${streak.currentStreak} Day Streak!`,
        message: `You've completed workouts for ${streak.currentStreak} consecutive training days. Keep it up!`,
        priority: 82,
      };
    } else if (streak.currentStreak >= 5) {
      // Show streak if it's 5+ days
      return {
        type: 'info',
        title: 'Consistency Streak',
        message: `You're on a ${streak.currentStreak} day workout streak. Personal best: ${streak.longestStreak} days.`,
        priority: 55,
      };
    }

    return null;
  } catch (error) {
    console.error('[generateStreakInsight] Error:', error);
    return null;
  }
}

/**
 * Helper: Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
