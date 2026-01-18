/**
 * DRIFT FITNESS - VOLUME MATHEMATICS
 * Handles all volume calculations with v3.2 rules
 */

import type { LoggedSet, Exercise, WorkoutPrescription } from "../types";
import { SLOT_REP_RANGES, DRIFT_ALGORITHM } from "../types";

// ============================================================================
// VOLUME CALCULATION
// ============================================================================

/**
 * Calculate volume for a single set
 *
 * Rules:
 * - Warm-up sets = 0 volume
 * - Unilateral exercises = weight × reps × 2
 * - Bodyweight exercises = (bodyweight × multiplier) × reps
 * - Standard = weight × reps
 */
export function calculateVolume(
  set: LoggedSet,
  exercise: Exercise,
  userBodyweight?: number
): number {
  // Rule 1: Warm-up sets don't count
  if (set.isWarmup) {
    return 0;
  }

  // Rule 2: Bodyweight exercises use bodyweight multiplier
  if (exercise.equipment === "bodyweight") {
    if (!exercise.bodyweightMultiplier || !userBodyweight) {
      throw new Error(
        `Bodyweight exercise ${exercise.id} requires bodyweightMultiplier and userBodyweight`
      );
    }
    return userBodyweight * exercise.bodyweightMultiplier * set.reps;
  }

  // Rule 3: Unilateral exercises count both sides
  if (exercise.loadType === "unilateral") {
    return set.weight * set.reps * 2;
  }

  // Rule 4: Standard volume calculation
  return set.weight * set.reps;
}

/**
 * Calculate total volume from multiple sets
 */
export function calculateTotalVolume(
  sets: LoggedSet[],
  exercise: Exercise,
  userBodyweight?: number
): number {
  return sets.reduce(
    (total, set) => total + calculateVolume(set, exercise, userBodyweight),
    0
  );
}

// ============================================================================
// REVERSE ENGINEERING: VOLUME → SETS/REPS
// ============================================================================

/**
 * Convert target volume into sets/reps/weight prescription
 *
 * Process:
 * 1. Determine target reps based on slot (Slot 1: 6, Slot 2: 10, Slot 3: 13)
 * 2. Calculate total reps needed: targetVolume / workingWeight
 * 3. Calculate sets: totalReps / targetReps
 * 4. Apply ±10% tolerance for practical sets (whole numbers)
 * 5. Return prescription
 */
export function calculateSetsReps(
  targetVolume: number,
  workingWeight: number,
  exercise: Exercise
): WorkoutPrescription {
  // Step 1: Get target reps for this slot
  const [minReps, maxReps] = exercise.repRange;
  const targetReps = getTargetRepsForSlot(exercise.slot);

  // Step 2: Account for unilateral load type
  const effectiveWeight =
    exercise.loadType === "unilateral" ? workingWeight * 2 : workingWeight;

  // Step 3: Calculate total reps needed
  const totalReps = targetVolume / effectiveWeight;

  // Step 4: Calculate ideal sets
  const idealSets = totalReps / targetReps;

  // Step 5: Round to whole sets
  let sets = Math.round(idealSets);

  // Ensure at least 1 set
  if (sets < 1) sets = 1;

  // Step 6: Calculate final reps per set
  const repsPerSet = Math.round(totalReps / sets);

  // Step 7: Clamp reps to slot's rep range
  const finalReps = Math.max(minReps, Math.min(repsPerSet, maxReps));

  // Step 8: Calculate actual volume achieved
  const actualVolume = sets * finalReps * effectiveWeight;

  // Step 9: Check if within ±10% tolerance
  const variance = Math.abs(actualVolume - targetVolume) / targetVolume;

  if (variance > DRIFT_ALGORITHM.VOLUME_TOLERANCE) {
    // If variance too high, adjust sets slightly
    const adjustedSets = Math.round(targetVolume / (finalReps * effectiveWeight));
    return {
      exercise,
      sets: Math.max(1, adjustedSets),
      reps: finalReps,
      weight: workingWeight,
      targetVolume,
      actualVolume: Math.max(1, adjustedSets) * finalReps * effectiveWeight,
    };
  }

  return {
    exercise,
    sets,
    reps: finalReps,
    weight: workingWeight,
    targetVolume,
    actualVolume,
  };
}

/**
 * Get target reps for a given slot
 * Slot 1: 6 reps (strength)
 * Slot 2: 10 reps (hypertrophy)
 * Slot 3: 13 reps (metabolic)
 */
function getTargetRepsForSlot(slot: 1 | 2 | 3): number {
  const repRange = SLOT_REP_RANGES[slot];
  const [min, max] = repRange;
  return Math.floor((min + max) / 2);
}

// ============================================================================
// VOLUME ADJUSTMENT (For "Feeling Rough" Mode)
// ============================================================================

/**
 * Reduce volume based on check-in data
 */
export function adjustVolumeForCheckIn(
  baseVolume: number,
  mood: "great" | "okay" | "rough"
): number {
  switch (mood) {
    case "great":
      return baseVolume; // No adjustment
    case "okay":
      return baseVolume * 0.90; // 10% reduction
    case "rough":
      return baseVolume * 0.80; // 20% reduction
    default:
      return baseVolume;
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if a workout prescription is achievable
 */
export function isPrescriptionAchievable(prescription: WorkoutPrescription): {
  achievable: boolean;
  reason?: string;
} {
  const { sets, reps, exercise } = prescription;

  // Check if reps are within slot's rep range
  const [minReps, maxReps] = exercise.repRange;
  if (reps < minReps || reps > maxReps) {
    return {
      achievable: false,
      reason: `Reps (${reps}) outside slot ${exercise.slot} range (${minReps}-${maxReps})`,
    };
  }

  // Check if sets are reasonable (max 10 sets)
  if (sets > 10) {
    return {
      achievable: false,
      reason: `Too many sets (${sets}), max is 10`,
    };
  }

  // Check if reps are reasonable (max 30 reps for isolations)
  if (exercise.slot === 3 && reps > 30) {
    return {
      achievable: false,
      reason: `Too many reps (${reps}) for isolation exercise`,
    };
  }

  return { achievable: true };
}
