/**
 * DRIFT FITNESS - WORKOUT GENERATOR
 * Slot Theory implementation: 50/30/20 volume distribution
 */

import type {
  Exercise,
  MuscleGroup,
  WorkoutSession,
  WorkoutExercise,
  CheckInData,
} from "../types";
import { SLOT_VOLUME_DISTRIBUTION } from "../types";
import { calculateSetsReps, adjustVolumeForCheckIn } from "./volumeMath";
import { getEstimatedWeight } from "../db/seeds/exerciseRatios";
import { getEasySwaps } from "./swapLogic";
import { selectExerciseWithVariety } from "./exerciseHistory";

// ============================================================================
// WORKOUT GENERATION
// ============================================================================

export interface GenerateWorkoutParams {
  /** Which muscle group to train */
  muscleGroup: MuscleGroup;

  /** Target volume for this session (lbs) */
  targetVolume: number;

  /** Available exercises for this muscle group */
  exercises: Exercise[];

  /** User's working weights per exercise */
  workingWeights: Record<string, number>;

  /** User's bodyweight (for bodyweight exercises) */
  userBodyweight: number;

  /** Optional check-in data (for volume adjustment) */
  checkIn?: CheckInData;

  /** Optional drift to add to this session */
  additionalDrift?: number;
}

/**
 * Generate a complete workout session using Slot Theory
 *
 * Process:
 * 1. Adjust base volume if user is feeling rough
 * 2. Add any drift volume
 * 3. Distribute total volume: 50% Slot 1, 30% Slot 2, 20% Slot 3
 * 4. Select exercises (1 from Slot 1, 1 from Slot 2, 1-2 from Slot 3)
 * 5. Calculate sets/reps for each exercise
 * 6. Return WorkoutSession
 */
export async function generateWorkout(
  params: GenerateWorkoutParams
): Promise<WorkoutSession> {
  const {
    muscleGroup,
    targetVolume,
    exercises,
    workingWeights,
    userBodyweight,
    checkIn,
    additionalDrift = 0,
  } = params;

  // Step 1: Adjust base volume based on check-in mood
  let adjustedVolume = targetVolume;
  if (checkIn?.mood) {
    adjustedVolume = adjustVolumeForCheckIn(targetVolume, checkIn.mood);
  }

  // Step 2: Add drift volume
  const totalVolume = adjustedVolume + additionalDrift;

  // Step 3: Distribute volume across slots (50/30/20)
  const slot1Volume = totalVolume * SLOT_VOLUME_DISTRIBUTION[1];
  const slot2Volume = totalVolume * SLOT_VOLUME_DISTRIBUTION[2];
  const slot3Volume = totalVolume * SLOT_VOLUME_DISTRIBUTION[3];

  // Step 4: Filter exercises by muscle group and slot
  console.log(`[WorkoutGenerator] Total exercises:`, exercises.length);
  console.log(`[WorkoutGenerator] Filtering for muscleGroup: ${muscleGroup}`);

  const slot1Exercises = exercises.filter(
    (ex) => ex.muscleGroup === muscleGroup && ex.slot === 1
  );
  const slot2Exercises = exercises.filter(
    (ex) => ex.muscleGroup === muscleGroup && ex.slot === 2
  );
  const slot3Exercises = exercises.filter(
    (ex) => ex.muscleGroup === muscleGroup && ex.slot === 3
  );

  console.log(`[WorkoutGenerator] Slot 1 exercises:`, slot1Exercises.length);
  console.log(`[WorkoutGenerator] Slot 2 exercises:`, slot2Exercises.length);
  console.log(`[WorkoutGenerator] Slot 3 exercises:`, slot3Exercises.length);

  // Step 5: Select exercises (with variety logic - avoids recent repeats)
  let selectedSlot1 = await selectExerciseWithVariety(slot1Exercises, muscleGroup, 1);
  let selectedSlot2 = await selectExerciseWithVariety(slot2Exercises, muscleGroup, 2);
  let selectedSlot3 = await selectExerciseWithVariety(slot3Exercises, muscleGroup, 3);

  if (!selectedSlot1 || !selectedSlot2 || !selectedSlot3) {
    throw new Error(
      `Insufficient exercises for ${muscleGroup} workout (need at least 1 per slot)`
    );
  }

  // Step 5b: Smart swaps based on check-in (if feeling rough or poor sleep)
  const needsEasySwaps = checkIn && (
    checkIn.mood === 'rough' ||
    checkIn.goodSleep === false ||
    checkIn.notSore === false
  );

  if (needsEasySwaps) {
    console.log('[WorkoutGenerator] User needs easy swaps - prioritizing machines/cables');

    // Try to swap to easier alternatives (machines/cables over barbells)
    const easySlot1Options = getEasySwaps(selectedSlot1, exercises);
    const easySlot2Options = getEasySwaps(selectedSlot2, exercises);

    // Only swap if easier alternatives exist
    if (easySlot1Options.length > 0) {
      selectedSlot1 = easySlot1Options[0];
      console.log(`[WorkoutGenerator] Swapped Slot 1 to easier: ${selectedSlot1.name}`);
    }

    if (easySlot2Options.length > 0) {
      selectedSlot2 = easySlot2Options[0];
      console.log(`[WorkoutGenerator] Swapped Slot 2 to easier: ${selectedSlot2.name}`);
    }

    // Slot 3 is already isolation exercises, typically easier, so no swap needed
  }

  // Step 6: Get or estimate working weights
  const slot1Weight = getWorkingWeight(
    selectedSlot1.id,
    workingWeights,
    exercises
  );
  const slot2Weight = getWorkingWeight(
    selectedSlot2.id,
    workingWeights,
    exercises
  );
  const slot3Weight = getWorkingWeight(
    selectedSlot3.id,
    workingWeights,
    exercises
  );

  // Step 7: Calculate sets/reps for each exercise
  const slot1Prescription = calculateSetsReps(
    slot1Volume,
    slot1Weight,
    selectedSlot1
  );
  const slot2Prescription = calculateSetsReps(
    slot2Volume,
    slot2Weight,
    selectedSlot2
  );
  const slot3Prescription = calculateSetsReps(
    slot3Volume,
    slot3Weight,
    selectedSlot3
  );

  // Step 8: Create WorkoutExercise objects
  const workoutExercises: WorkoutExercise[] = [
    createWorkoutExercise(slot1Prescription, 1),
    createWorkoutExercise(slot2Prescription, 2),
    createWorkoutExercise(slot3Prescription, 3),
  ];

  // Step 9: Create WorkoutSession
  const workoutSession: WorkoutSession = {
    id: generateId(),
    userId: "local", // Single-user app
    date: new Date().toISOString(),
    muscleGroup,
    targetVolume: totalVolume,
    actualVolume: 0,
    completionPercentage: 0,
    checkIn: checkIn || {
      mood: "great",
      goodSleep: true,
      notSore: true,
      timestamp: new Date().toISOString(),
    },
    exercises: workoutExercises,
    status: "planned",
  };

  return workoutSession;
}

// ============================================================================
// EXERCISE SELECTION
// ============================================================================

/**
 * Select a random exercise from a list
 * TODO: Add smarter selection (avoid repeating recent exercises)
 */
function selectRandomExercise(exercises: Exercise[]): Exercise | null {
  if (exercises.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * exercises.length);
  return exercises[randomIndex];
}

/**
 * Get working weight for an exercise (with fallback estimation)
 */
function getWorkingWeight(
  exerciseId: string,
  workingWeights: Record<string, number>,
  allExercises: Exercise[]
): number {
  // Direct lookup
  if (workingWeights[exerciseId]) {
    return workingWeights[exerciseId];
  }

  // Try ratio estimation
  const estimated = getEstimatedWeight(exerciseId, workingWeights);
  if (estimated) {
    return estimated;
  }

  // Last resort: Conservative default based on exercise type
  const exercise = allExercises.find((ex) => ex.id === exerciseId);
  if (exercise) {
    // Conservative defaults by slot
    const defaults = {
      1: 135, // Slot 1: Empty barbell
      2: 95, // Slot 2: Lighter
      3: 45, // Slot 3: Very light
    };
    return defaults[exercise.slot];
  }

  return 45; // Absolute fallback
}

/**
 * Create a WorkoutExercise from a prescription
 */
function createWorkoutExercise(
  prescription: {
    exercise: Exercise;
    sets: number;
    reps: number;
    weight: number;
    targetVolume: number;
    actualVolume: number;
  },
  order: number
): WorkoutExercise {
  return {
    id: generateId(),
    exerciseId: prescription.exercise.id,
    exerciseName: prescription.exercise.name,
    prescribedSets: prescription.sets,
    prescribedReps: prescription.reps,
    prescribedWeight: prescription.weight,
    targetVolume: prescription.targetVolume,
    actualVolume: 0,
    loggedSets: [],
    completed: false,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate recommended sessions per week for a muscle group
 */
export function calculateSessionsPerWeek(
  trainingDaysPerWeek: number
): { push: number; pull: number; legs: number } {
  // Simple distribution based on total training days
  if (trainingDaysPerWeek <= 3) {
    return { push: 1, pull: 1, legs: 1 }; // Full body split
  } else if (trainingDaysPerWeek <= 4) {
    return { push: 1, pull: 1, legs: 2 }; // Upper/Lower with leg emphasis
  } else if (trainingDaysPerWeek <= 5) {
    return { push: 2, pull: 2, legs: 1 }; // Push/Pull emphasis
  } else {
    return { push: 2, pull: 2, legs: 2 }; // Balanced PPL
  }
}

/**
 * Calculate base volume per session
 */
export function calculateSessionVolume(
  weeklyTarget: number,
  sessionsPerWeek: number
): number {
  return Math.round(weeklyTarget / sessionsPerWeek);
}
