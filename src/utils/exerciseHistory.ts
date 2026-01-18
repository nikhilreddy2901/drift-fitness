/**
 * DRIFT FITNESS - EXERCISE HISTORY TRACKER
 * Track recently used exercises to avoid boring repetition
 */

import { db } from '../db/client';
import type { Exercise, MuscleGroup } from '../types';

const HISTORY_KEY_PREFIX = 'exercise_history_';
const MAX_HISTORY_PER_SLOT = 3; // Remember last 3 exercises per slot

interface ExerciseHistoryEntry {
  exerciseId: string;
  usedAt: string; // ISO timestamp
}

/**
 * Get exercise history for a specific muscle group and slot
 */
export async function getExerciseHistory(
  muscleGroup: MuscleGroup,
  slot: number
): Promise<string[]> {
  try {
    const key = `${HISTORY_KEY_PREFIX}${muscleGroup}_slot${slot}`;
    const result = await db.queryOne(
      'SELECT value FROM user_stats WHERE key = ?',
      [key]
    );

    if (!result) {
      return [];
    }

    const history: ExerciseHistoryEntry[] = JSON.parse((result as any).value);
    return history.map(h => h.exerciseId);
  } catch (error) {
    console.error('[ExerciseHistory] Error loading history:', error);
    return [];
  }
}

/**
 * Add an exercise to the history
 */
export async function addToExerciseHistory(
  muscleGroup: MuscleGroup,
  slot: number,
  exerciseId: string
): Promise<void> {
  try {
    const key = `${HISTORY_KEY_PREFIX}${muscleGroup}_slot${slot}`;

    // Load existing history
    const result = await db.queryOne(
      'SELECT value FROM user_stats WHERE key = ?',
      [key]
    );

    let history: ExerciseHistoryEntry[] = [];
    if (result) {
      history = JSON.parse((result as any).value);
    }

    // Add new entry
    history.unshift({
      exerciseId,
      usedAt: new Date().toISOString(),
    });

    // Keep only last N entries
    history = history.slice(0, MAX_HISTORY_PER_SLOT);

    // Save back to database
    await db.execute(
      `INSERT OR REPLACE INTO user_stats (key, value, updated_at)
       VALUES (?, ?, ?)`,
      [key, JSON.stringify(history), new Date().toISOString()]
    );

    console.log(`[ExerciseHistory] Added ${exerciseId} to ${muscleGroup} slot ${slot} history`);
  } catch (error) {
    console.error('[ExerciseHistory] Error saving history:', error);
  }
}

/**
 * Filter out recently used exercises from a list
 */
export function filterRecentExercises(
  exercises: Exercise[],
  recentExerciseIds: string[]
): Exercise[] {
  if (recentExerciseIds.length === 0) {
    return exercises;
  }

  const filtered = exercises.filter(ex => !recentExerciseIds.includes(ex.id));

  // If filtering removes ALL exercises, return the original list
  // (better to repeat than to have no options)
  if (filtered.length === 0) {
    console.log('[ExerciseHistory] All exercises were recent, returning full list');
    return exercises;
  }

  console.log(`[ExerciseHistory] Filtered ${exercises.length - filtered.length} recent exercises`);
  return filtered;
}

/**
 * Select an exercise with recency bias (avoids recent exercises)
 */
export async function selectExerciseWithVariety(
  exercises: Exercise[],
  muscleGroup: MuscleGroup,
  slot: number
): Promise<Exercise | null> {
  if (exercises.length === 0) {
    return null;
  }

  // Get recent exercise IDs
  const recentIds = await getExerciseHistory(muscleGroup, slot);

  // Filter out recent exercises
  const freshExercises = filterRecentExercises(exercises, recentIds);

  // Select randomly from fresh exercises
  const randomIndex = Math.floor(Math.random() * freshExercises.length);
  const selected = freshExercises[randomIndex];

  // Add to history
  await addToExerciseHistory(muscleGroup, slot, selected.id);

  return selected;
}
