/**
 * DRIFT FITNESS - PR (Personal Record) DETECTION
 * Detect when users hit new personal bests
 */

import { db } from '../db/client';

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | 'volume';
  newValue: number;
  oldValue: number;
  reps?: number; // For weight PRs
  weight?: number; // For reps PRs
  date: string;
}

interface PRData {
  exerciseId: string;
  maxWeight: number;
  maxWeightReps: number;
  maxReps: number;
  maxRepsWeight: number;
  maxVolume: number;
  lastUpdated: string;
}

/**
 * Check if a logged set is a new PR and update records
 */
export async function checkAndRecordPR(
  exerciseId: string,
  exerciseName: string,
  weight: number,
  reps: number
): Promise<PersonalRecord | null> {
  try {
    // Get current PR data for this exercise
    const currentPR = await getPRData(exerciseId);
    const volume = weight * reps;

    let prDetected: PersonalRecord | null = null;

    // Check for weight PR (more weight for same or more reps)
    if (weight > currentPR.maxWeight) {
      prDetected = {
        exerciseId,
        exerciseName,
        type: 'weight',
        newValue: weight,
        oldValue: currentPR.maxWeight,
        reps,
        date: new Date().toISOString(),
      };
    }
    // Check for reps PR (more reps at same or higher weight)
    else if (reps > currentPR.maxReps && weight >= currentPR.maxRepsWeight) {
      prDetected = {
        exerciseId,
        exerciseName,
        type: 'reps',
        newValue: reps,
        oldValue: currentPR.maxReps,
        weight,
        date: new Date().toISOString(),
      };
    }
    // Check for volume PR (highest weight × reps)
    else if (volume > currentPR.maxVolume) {
      prDetected = {
        exerciseId,
        exerciseName,
        type: 'volume',
        newValue: volume,
        oldValue: currentPR.maxVolume,
        reps,
        weight,
        date: new Date().toISOString(),
      };
    }

    // Update PR records
    await updatePRData(exerciseId, weight, reps, volume);

    if (prDetected) {
      console.log('[PR Detection] New PR detected:', prDetected);
      // Store PR in history
      await savePRToHistory(prDetected);
    }

    return prDetected;
  } catch (error) {
    console.error('[PR Detection] Error checking PR:', error);
    return null;
  }
}

/**
 * Get current PR data for an exercise
 */
async function getPRData(exerciseId: string): Promise<PRData> {
  const key = `pr_data_${exerciseId}`;
  const result = await db.queryOne(
    'SELECT value FROM user_stats WHERE key = ?',
    [key]
  );

  if (!result) {
    // No PR data yet, return zeros
    return {
      exerciseId,
      maxWeight: 0,
      maxWeightReps: 0,
      maxReps: 0,
      maxRepsWeight: 0,
      maxVolume: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  return JSON.parse((result as any).value);
}

/**
 * Update PR data for an exercise
 */
async function updatePRData(
  exerciseId: string,
  weight: number,
  reps: number,
  volume: number
): Promise<void> {
  const key = `pr_data_${exerciseId}`;
  const current = await getPRData(exerciseId);

  // Update maxes
  const updated: PRData = {
    exerciseId,
    maxWeight: Math.max(current.maxWeight, weight),
    maxWeightReps: weight > current.maxWeight ? reps : current.maxWeightReps,
    maxReps: Math.max(current.maxReps, reps),
    maxRepsWeight: reps > current.maxReps ? weight : current.maxRepsWeight,
    maxVolume: Math.max(current.maxVolume, volume),
    lastUpdated: new Date().toISOString(),
  };

  await db.execute(
    `INSERT OR REPLACE INTO user_stats (key, value, updated_at)
     VALUES (?, ?, ?)`,
    [key, JSON.stringify(updated), new Date().toISOString()]
  );
}

/**
 * Save PR to history (for displaying in insights)
 */
async function savePRToHistory(pr: PersonalRecord): Promise<void> {
  const key = 'recent_prs';
  const result = await db.queryOne(
    'SELECT value FROM user_stats WHERE key = ?',
    [key]
  );

  let history: PersonalRecord[] = [];
  if (result) {
    history = JSON.parse((result as any).value);
  }

  // Add new PR to front
  history.unshift(pr);

  // Keep last 10 PRs
  history = history.slice(0, 10);

  await db.execute(
    `INSERT OR REPLACE INTO user_stats (key, value, updated_at)
     VALUES (?, ?, ?)`,
    [key, JSON.stringify(history), new Date().toISOString()]
  );
}

/**
 * Get recent PRs
 */
export async function getRecentPRs(limit: number = 5): Promise<PersonalRecord[]> {
  try {
    const key = 'recent_prs';
    const result = await db.queryOne(
      'SELECT value FROM user_stats WHERE key = ?',
      [key]
    );

    if (!result) {
      return [];
    }

    const history: PersonalRecord[] = JSON.parse((result as any).value);
    return history.slice(0, limit);
  } catch (error) {
    console.error('[PR Detection] Error getting recent PRs:', error);
    return [];
  }
}

/**
 * Get PR data for display
 */
export async function getPRsForExercise(exerciseId: string): Promise<PRData | null> {
  try {
    return await getPRData(exerciseId);
  } catch (error) {
    console.error('[PR Detection] Error getting PR data:', error);
    return null;
  }
}
