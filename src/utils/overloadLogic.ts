/**
 * DRIFT FITNESS - PROGRESSIVE OVERLOAD LOGIC
 * RPE-based progression with deload weeks
 */

import { PROGRESSIVE_OVERLOAD, DELOAD_CONFIG } from "../types";

// ============================================================================
// PROGRESSIVE OVERLOAD
// ============================================================================

/**
 * Calculate next week's volume target based on current performance
 *
 * Rules:
 * - Deload every 4th week (40% reduction)
 * - Weeks 1-4: Newbie gains (RPE ≤ 6 = +5%, RPE 7-8 = +2.5%, RPE ≥ 9 = 0%)
 * - Weeks 5+: Capped gains (RPE ≤ 8 = +2.5%, RPE ≥ 9 = 0%)
 * - Hard cap: Never exceed 2× starting volume
 *
 * @param currentVolume Current weekly volume (lbs)
 * @param averageRPE Average RPE for the week (1-10)
 * @param weekNumber Current week number (1, 2, 3, ...)
 * @param startingVolume Initial volume from week 1 (for 2× cap check)
 * @returns Next week's volume target
 */
export function calculateNextWeekTarget(
  currentVolume: number,
  averageRPE: number,
  weekNumber: number,
  startingVolume: number
): number {
  // Rule 1: Deload every 4th week
  if (isDeloadWeek(weekNumber + 1)) {
    return currentVolume * (1 - DELOAD_CONFIG.REDUCTION);
  }

  // Rule 2: Determine increase percentage based on week number and RPE
  const increasePercentage = getIncreasePercentage(averageRPE, weekNumber);

  // Calculate new volume
  const newVolume = currentVolume * (1 + increasePercentage);

  // Rule 3: Apply 2× hard cap
  const maxAllowedVolume = startingVolume * PROGRESSIVE_OVERLOAD.MAX_MULTIPLIER;

  if (newVolume > maxAllowedVolume) {
    console.log(
      `[Overload] Volume capped at 2× starting volume (${maxAllowedVolume} lbs)`
    );
    return maxAllowedVolume;
  }

  return Math.round(newVolume);
}

/**
 * Determine if a given week is a deload week
 */
export function isDeloadWeek(weekNumber: number): boolean {
  return weekNumber % DELOAD_CONFIG.FREQUENCY === 0;
}

/**
 * Get increase percentage based on RPE and week number
 */
function getIncreasePercentage(averageRPE: number, weekNumber: number): number {
  // Weeks 1-4: Newbie gains window
  if (weekNumber <= 4) {
    if (averageRPE <= 6) {
      return PROGRESSIVE_OVERLOAD.WEEKS_1_4.LOW_RPE; // +5%
    } else if (averageRPE <= 8) {
      return PROGRESSIVE_OVERLOAD.WEEKS_1_4.MID_RPE; // +2.5%
    } else {
      return PROGRESSIVE_OVERLOAD.WEEKS_1_4.HIGH_RPE; // 0% (maintain)
    }
  }

  // Weeks 5+: Standard progression (capped)
  if (averageRPE <= 6) {
    return PROGRESSIVE_OVERLOAD.WEEKS_5_PLUS.LOW_RPE; // +2.5% (capped)
  } else if (averageRPE <= 8) {
    return PROGRESSIVE_OVERLOAD.WEEKS_5_PLUS.MID_RPE; // +2.5%
  } else {
    return PROGRESSIVE_OVERLOAD.WEEKS_5_PLUS.HIGH_RPE; // 0% (maintain)
  }
}

// ============================================================================
// OVERLOAD SUMMARY
// ============================================================================

export interface OverloadSummary {
  /** Current week number */
  currentWeek: number;

  /** Next week number */
  nextWeek: number;

  /** Is next week a deload? */
  isNextWeekDeload: boolean;

  /** Current volume (lbs) */
  currentVolume: number;

  /** Next week's target volume (lbs) */
  nextVolume: number;

  /** Change in volume (lbs) */
  volumeChange: number;

  /** Percentage change */
  percentageChange: number;

  /** Average RPE this week */
  averageRPE: number;

  /** Reason for change */
  reason: string;
}

/**
 * Generate a comprehensive overload summary
 */
export function generateOverloadSummary(
  currentVolume: number,
  averageRPE: number,
  weekNumber: number,
  startingVolume: number
): OverloadSummary {
  const nextWeek = weekNumber + 1;
  const nextVolume = calculateNextWeekTarget(
    currentVolume,
    averageRPE,
    weekNumber,
    startingVolume
  );

  const volumeChange = nextVolume - currentVolume;
  const percentageChange = (volumeChange / currentVolume) * 100;

  // Determine reason for change
  let reason = "";
  if (isDeloadWeek(nextWeek)) {
    reason = `Deload week (${DELOAD_CONFIG.REDUCTION * 100}% reduction for recovery)`;
  } else if (volumeChange > 0) {
    const increasePercent = Math.round(percentageChange);
    if (weekNumber <= 4) {
      reason = `Newbie gains (+${increasePercent}%, RPE: ${averageRPE.toFixed(1)})`;
    } else {
      reason = `Progressive overload (+${increasePercent}%, RPE: ${averageRPE.toFixed(1)})`;
    }
  } else if (volumeChange === 0) {
    reason = `Maintain volume (RPE too high: ${averageRPE.toFixed(1)})`;
  } else {
    reason = `Volume reduction (${Math.abs(Math.round(percentageChange))}%)`;
  }

  return {
    currentWeek: weekNumber,
    nextWeek,
    isNextWeekDeload: isDeloadWeek(nextWeek),
    currentVolume,
    nextVolume,
    volumeChange,
    percentageChange,
    averageRPE,
    reason,
  };
}

// ============================================================================
// VOLUME VALIDATION
// ============================================================================

/**
 * Check if current volume is safe and sustainable
 */
export function validateVolume(
  currentVolume: number,
  startingVolume: number
): { safe: boolean; warning?: string } {
  const ratio = currentVolume / startingVolume;

  // Warn if approaching 2× cap
  if (ratio >= 1.8) {
    return {
      safe: true,
      warning: `Volume approaching 2× limit (${(ratio * 100).toFixed(0)}% of starting volume)`,
    };
  }

  // Warn if volume dropped below starting (regression)
  if (ratio < 0.8) {
    return {
      safe: true,
      warning: `Volume significantly below starting level (${(ratio * 100).toFixed(0)}% of starting volume)`,
    };
  }

  return { safe: true };
}

// ============================================================================
// DELOAD HELPERS
// ============================================================================

/**
 * Get the next deload week number
 */
export function getNextDeloadWeek(currentWeek: number): number {
  const weeksUntilDeload = DELOAD_CONFIG.FREQUENCY - (currentWeek % DELOAD_CONFIG.FREQUENCY);
  return currentWeek + weeksUntilDeload;
}

/**
 * Check if user should consider an early deload
 * (if RPE is consistently very high)
 */
export function shouldConsiderEarlyDeload(
  recentRPEs: number[]
): { shouldDeload: boolean; reason?: string } {
  // Need at least 3 sessions to evaluate
  if (recentRPEs.length < 3) {
    return { shouldDeload: false };
  }

  // Check if last 3 sessions were all RPE ≥ 9
  const last3 = recentRPEs.slice(-3);
  const allHighRPE = last3.every((rpe) => rpe >= 9);

  if (allHighRPE) {
    return {
      shouldDeload: true,
      reason: "Last 3 sessions were RPE ≥ 9 (overtraining risk)",
    };
  }

  // Check average RPE over last 5 sessions
  if (recentRPEs.length >= 5) {
    const last5 = recentRPEs.slice(-5);
    const avgRPE = last5.reduce((sum, rpe) => sum + rpe, 0) / last5.length;

    if (avgRPE >= 8.5) {
      return {
        shouldDeload: true,
        reason: `Average RPE over last 5 sessions: ${avgRPE.toFixed(1)} (fatigue accumulation)`,
      };
    }
  }

  return { shouldDeload: false };
}

// ============================================================================
// PROGRESSION TRACKING
// ============================================================================

export interface ProgressionMetrics {
  /** Total weeks trained */
  totalWeeks: number;

  /** Starting volume (week 1) */
  startingVolume: number;

  /** Current volume */
  currentVolume: number;

  /** Total volume increase (lbs) */
  totalIncrease: number;

  /** Total percentage gain */
  percentageGain: number;

  /** Average weekly increase */
  avgWeeklyIncrease: number;

  /** Number of deloads completed */
  deloadsCompleted: number;
}

/**
 * Calculate progression metrics for user feedback
 */
export function calculateProgressionMetrics(
  weekNumber: number,
  startingVolume: number,
  currentVolume: number
): ProgressionMetrics {
  const totalIncrease = currentVolume - startingVolume;
  const percentageGain = (totalIncrease / startingVolume) * 100;
  const avgWeeklyIncrease = totalIncrease / weekNumber;
  const deloadsCompleted = Math.floor(weekNumber / DELOAD_CONFIG.FREQUENCY);

  return {
    totalWeeks: weekNumber,
    startingVolume,
    currentVolume,
    totalIncrease,
    percentageGain,
    avgWeeklyIncrease,
    deloadsCompleted,
  };
}
