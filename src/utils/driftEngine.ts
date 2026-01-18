/**
 * DRIFT FITNESS - DRIFT ALGORITHM
 * The "Forgiveness Engine" - redistributes missed volume intelligently
 */

import { DRIFT_ALGORITHM } from "../types";

// ============================================================================
// DRIFT CALCULATION
// ============================================================================

/**
 * Calculate drift (missed volume)
 *
 * Rules:
 * - Drift = Planned Volume - Actual Volume
 * - If drift < 10% of planned, forgive it (return 0)
 * - This prevents penalizing small misses
 */
export function calculateDrift(
  plannedVolume: number,
  actualVolume: number
): number {
  const rawDrift = plannedVolume - actualVolume;

  // If user exceeded target, no drift
  if (rawDrift <= 0) {
    return 0;
  }

  // Calculate percentage missed
  const percentageMissed = rawDrift / plannedVolume;

  // Apply forgiveness threshold (10%)
  if (percentageMissed < DRIFT_ALGORITHM.FORGIVENESS_THRESHOLD) {
    return 0; // Forgive small misses
  }

  return rawDrift;
}

// ============================================================================
// DRIFT REDISTRIBUTION
// ============================================================================

/**
 * Distribute drift across remaining sessions
 *
 * Rules:
 * - Spread missed volume proportionally across remaining sessions
 * - Cap at +20% per session (prevent death sessions)
 * - Forgive any excess that can't fit
 *
 * @param driftAmount Total missed volume (lbs)
 * @param remainingSessions Number of sessions left this week for this muscle group
 * @param sessionBaseVolume Base volume for a single session
 * @returns Volume to add to each remaining session
 */
export function distributeDrift(
  driftAmount: number,
  remainingSessions: number,
  sessionBaseVolume: number
): number {
  // Edge case: No remaining sessions
  if (remainingSessions === 0) {
    return 0; // Drift is forgiven (Sunday reset will wipe it)
  }

  // Calculate drift per session (proportional distribution)
  const driftPerSession = driftAmount / remainingSessions;

  // Calculate maximum allowed addition (20% cap)
  const maxAddition = sessionBaseVolume * DRIFT_ALGORITHM.SESSION_CAP;

  // Apply the cap
  if (driftPerSession > maxAddition) {
    // Excess drift is forgiven
    return maxAddition;
  }

  return driftPerSession;
}

/**
 * Calculate how much drift will be forgiven
 *
 * This helps users understand how much volume they're "losing"
 */
export function calculateForgivenDrift(
  driftAmount: number,
  remainingSessions: number,
  sessionBaseVolume: number
): number {
  if (remainingSessions === 0) {
    return driftAmount; // All drift forgiven (no sessions left)
  }

  const driftPerSession = driftAmount / remainingSessions;
  const maxAddition = sessionBaseVolume * DRIFT_ALGORITHM.SESSION_CAP;

  if (driftPerSession <= maxAddition) {
    return 0; // All drift can be redistributed, nothing forgiven
  }

  // Calculate forgiven amount
  const actualRedistribution = maxAddition * remainingSessions;
  return driftAmount - actualRedistribution;
}

// ============================================================================
// DRIFT SUMMARY
// ============================================================================

export interface DriftSummary {
  /** Total drift amount (lbs) */
  totalDrift: number;

  /** Amount redistributed across remaining sessions (lbs) */
  redistributed: number;

  /** Amount forgiven (couldn't fit within 20% cap) (lbs) */
  forgiven: number;

  /** Volume added per remaining session (lbs) */
  additionPerSession: number;

  /** Percentage increase per session */
  percentageIncrease: number;

  /** Number of sessions this drift is spread across */
  sessionsAffected: number;
}

/**
 * Generate a complete drift summary
 */
export function generateDriftSummary(
  driftAmount: number,
  remainingSessions: number,
  sessionBaseVolume: number
): DriftSummary {
  const additionPerSession = distributeDrift(
    driftAmount,
    remainingSessions,
    sessionBaseVolume
  );

  const redistributed = additionPerSession * remainingSessions;
  const forgiven = driftAmount - redistributed;
  const percentageIncrease =
    sessionBaseVolume > 0 ? (additionPerSession / sessionBaseVolume) * 100 : 0;

  return {
    totalDrift: driftAmount,
    redistributed,
    forgiven,
    additionPerSession,
    percentageIncrease,
    sessionsAffected: remainingSessions,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if drift should be redistributed or forgiven
 */
export function shouldRedistributeDrift(
  driftAmount: number,
  plannedVolume: number
): boolean {
  // Only redistribute if drift is >= 10% of planned volume
  return driftAmount >= plannedVolume * DRIFT_ALGORITHM.FORGIVENESS_THRESHOLD;
}

/**
 * Calculate remaining sessions for a muscle group this week
 */
export function calculateRemainingSessions(
  totalSessionsThisWeek: number,
  completedSessionsThisWeek: number
): number {
  return Math.max(0, totalSessionsThisWeek - completedSessionsThisWeek);
}

// ============================================================================
// DRIFT VALIDATION
// ============================================================================

/**
 * Validate drift redistribution won't create impossible workouts
 */
export function validateDriftRedistribution(
  sessionBaseVolume: number,
  additionPerSession: number,
  userMaxVolume?: number
): { valid: boolean; reason?: string } {
  const newSessionVolume = sessionBaseVolume + additionPerSession;

  // Check if new volume exceeds user's max capacity (if known)
  if (userMaxVolume && newSessionVolume > userMaxVolume) {
    return {
      valid: false,
      reason: `Redistributed volume (${Math.round(newSessionVolume)} lbs) exceeds user max capacity (${userMaxVolume} lbs)`,
    };
  }

  // Check if increase is reasonable (max 50% increase as absolute safety)
  const percentageIncrease = (additionPerSession / sessionBaseVolume) * 100;
  if (percentageIncrease > 50) {
    return {
      valid: false,
      reason: `Increase (${Math.round(percentageIncrease)}%) exceeds safety limit (50%)`,
    };
  }

  return { valid: true };
}
