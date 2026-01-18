/**
 * DRIFT FITNESS - EXERCISE RATIOS FOR FALLBACK WEIGHT ESTIMATION
 * Used when user has never done an exercise before
 */

import type { ExerciseRatio } from "../../types";

/**
 * Exercise weight estimation ratios
 *
 * Format: If user has never done exercise X, estimate based on exercise Y
 * Example: DB Bench = Barbell Bench × 0.75 (per dumbbell)
 */
export const EXERCISE_RATIOS: ExerciseRatio[] = [
  // ============================================================================
  // PUSH - Horizontal Push Variants
  // ============================================================================
  {
    exerciseId: "db_bench",
    baseExerciseId: "barbell_bench",
    ratio: 0.75, // DB bench per hand ≈ 75% of barbell bench total
  },
  {
    exerciseId: "machine_chest_press",
    baseExerciseId: "barbell_bench",
    ratio: 0.85,
  },
  {
    exerciseId: "incline_db_press",
    baseExerciseId: "incline_barbell_press",
    ratio: 0.75,
  },
  {
    exerciseId: "incline_barbell_press",
    baseExerciseId: "barbell_bench",
    ratio: 0.85, // Incline is typically lighter than flat
  },
  {
    exerciseId: "decline_press",
    baseExerciseId: "barbell_bench",
    ratio: 1.05, // Decline is typically slightly heavier
  },
  {
    exerciseId: "cable_press",
    baseExerciseId: "db_bench",
    ratio: 1.0,
  },
  {
    exerciseId: "smith_bench",
    baseExerciseId: "barbell_bench",
    ratio: 0.90, // Smith machine removes stabilization
  },

  // ============================================================================
  // PUSH - Vertical Push Variants
  // ============================================================================
  {
    exerciseId: "db_shoulder_press",
    baseExerciseId: "barbell_ohp",
    ratio: 0.70,
  },
  {
    exerciseId: "machine_shoulder_press",
    baseExerciseId: "barbell_ohp",
    ratio: 0.80,
  },
  {
    exerciseId: "landmine_press",
    baseExerciseId: "barbell_ohp",
    ratio: 0.75,
  },

  // ============================================================================
  // PUSH - Isolation Estimates (based on compound lifts)
  // ============================================================================
  {
    exerciseId: "cable_fly",
    baseExerciseId: "db_bench",
    ratio: 0.35, // Flys are much lighter than pressing
  },
  {
    exerciseId: "db_fly",
    baseExerciseId: "db_bench",
    ratio: 0.30,
  },
  {
    exerciseId: "pec_deck",
    baseExerciseId: "machine_chest_press",
    ratio: 0.40,
  },
  {
    exerciseId: "lateral_raise",
    baseExerciseId: "db_shoulder_press",
    ratio: 0.20, // Lateral raises are very light
  },
  {
    exerciseId: "front_raise",
    baseExerciseId: "db_shoulder_press",
    ratio: 0.25,
  },
  {
    exerciseId: "tricep_pushdown",
    baseExerciseId: "barbell_bench",
    ratio: 0.25,
  },
  {
    exerciseId: "overhead_tricep_ext",
    baseExerciseId: "barbell_bench",
    ratio: 0.20,
  },

  // ============================================================================
  // PULL - Horizontal Pull Variants
  // ============================================================================
  {
    exerciseId: "db_row",
    baseExerciseId: "barbell_row",
    ratio: 0.70,
  },
  {
    exerciseId: "cable_row",
    baseExerciseId: "barbell_row",
    ratio: 0.80,
  },
  {
    exerciseId: "machine_row",
    baseExerciseId: "barbell_row",
    ratio: 0.85,
  },
  {
    exerciseId: "chest_supported_row",
    baseExerciseId: "barbell_row",
    ratio: 0.75,
  },
  {
    exerciseId: "pendlay_row",
    baseExerciseId: "barbell_row",
    ratio: 0.90,
  },
  {
    exerciseId: "tbar_row",
    baseExerciseId: "barbell_row",
    ratio: 0.80,
  },

  // ============================================================================
  // PULL - Vertical Pull Variants
  // ============================================================================
  {
    exerciseId: "lat_pulldown",
    baseExerciseId: "weighted_pullup",
    ratio: 0.80, // Pulldown is easier than pull-up
  },
  {
    exerciseId: "underhand_lat_pulldown",
    baseExerciseId: "weighted_chinup",
    ratio: 0.80,
  },

  // ============================================================================
  // PULL - Isolation Estimates
  // ============================================================================
  {
    exerciseId: "db_curl",
    baseExerciseId: "barbell_curl",
    ratio: 0.75,
  },
  {
    exerciseId: "hammer_curl",
    baseExerciseId: "db_curl",
    ratio: 1.10, // Hammer curls are typically slightly heavier
  },
  {
    exerciseId: "cable_curl",
    baseExerciseId: "barbell_curl",
    ratio: 0.80,
  },
  {
    exerciseId: "preacher_curl",
    baseExerciseId: "barbell_curl",
    ratio: 0.70, // Preacher curls are stricter form
  },
  {
    exerciseId: "rear_delt_fly",
    baseExerciseId: "lateral_raise",
    ratio: 0.80,
  },
  {
    exerciseId: "shrugs",
    baseExerciseId: "barbell_deadlift",
    ratio: 0.40,
  },

  // ============================================================================
  // LEGS - Squat Pattern Variants
  // ============================================================================
  {
    exerciseId: "front_squat",
    baseExerciseId: "back_squat",
    ratio: 0.80, // Front squats are typically lighter
  },
  {
    exerciseId: "leg_press",
    baseExerciseId: "back_squat",
    ratio: 1.50, // Leg press can be heavier (less stabilization)
  },
  {
    exerciseId: "hack_squat",
    baseExerciseId: "back_squat",
    ratio: 1.20,
  },
  {
    exerciseId: "smith_squat",
    baseExerciseId: "back_squat",
    ratio: 0.90,
  },
  {
    exerciseId: "goblet_squat",
    baseExerciseId: "back_squat",
    ratio: 0.40, // Goblet squats are much lighter
  },

  // ============================================================================
  // LEGS - Hinge Pattern Variants
  // ============================================================================
  {
    exerciseId: "romanian_deadlift",
    baseExerciseId: "barbell_deadlift",
    ratio: 0.70, // RDLs are lighter than conventional deadlifts
  },
  {
    exerciseId: "db_rdl",
    baseExerciseId: "romanian_deadlift",
    ratio: 0.70,
  },

  // ============================================================================
  // LEGS - Lunge Pattern Variants
  // ============================================================================
  {
    exerciseId: "db_lunges",
    baseExerciseId: "back_squat",
    ratio: 0.35, // Lunges per dumbbell
  },
  {
    exerciseId: "walking_lunges",
    baseExerciseId: "db_lunges",
    ratio: 0.90,
  },
  {
    exerciseId: "barbell_lunges",
    baseExerciseId: "back_squat",
    ratio: 0.60,
  },
  {
    exerciseId: "bulgarian_split_squat",
    baseExerciseId: "db_lunges",
    ratio: 1.10, // BSS can be slightly heavier
  },
  {
    exerciseId: "step_ups",
    baseExerciseId: "db_lunges",
    ratio: 0.85,
  },

  // ============================================================================
  // LEGS - Isolation Estimates
  // ============================================================================
  {
    exerciseId: "leg_extension",
    baseExerciseId: "leg_press",
    ratio: 0.35,
  },
  {
    exerciseId: "leg_curl",
    baseExerciseId: "leg_press",
    ratio: 0.30,
  },
  {
    exerciseId: "seated_leg_curl",
    baseExerciseId: "leg_curl",
    ratio: 0.90,
  },
  {
    exerciseId: "calf_raise",
    baseExerciseId: "leg_press",
    ratio: 0.50,
  },
  {
    exerciseId: "seated_calf_raise",
    baseExerciseId: "calf_raise",
    ratio: 0.70,
  },
  {
    exerciseId: "hip_thrust",
    baseExerciseId: "romanian_deadlift",
    ratio: 0.80,
  },
];

/**
 * Get estimated working weight for an exercise based on known exercises
 */
export function getEstimatedWeight(
  exerciseId: string,
  knownWeights: Record<string, number>
): number | null {
  // Check if we have a direct ratio
  const ratio = EXERCISE_RATIOS.find((r) => r.exerciseId === exerciseId);

  if (!ratio) {
    return null; // No ratio defined for this exercise
  }

  // Check if user has working weight for the base exercise
  const baseWeight = knownWeights[ratio.baseExerciseId];

  if (!baseWeight) {
    return null; // User hasn't done the base exercise either
  }

  // Calculate estimated weight
  return Math.round(baseWeight * ratio.ratio);
}
