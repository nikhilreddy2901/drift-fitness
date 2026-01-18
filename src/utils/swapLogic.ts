/**
 * DRIFT FITNESS - EXERCISE SWAP LOGIC
 * Intelligent exercise substitution with equipment prioritization
 */

import type { Exercise, EquipmentType } from "../types";
import { EQUIPMENT_ORDER } from "../types";

// ============================================================================
// SWAP FILTERING
// ============================================================================

/**
 * Get valid swap alternatives for an exercise
 *
 * Rules:
 * - Must match slot (intensity tier)
 * - Compounds: Match by movementPattern
 * - Isolations: Match by primaryMuscle
 * - Sorted by equipment priority (Barbell > Dumbbell > Machine > Cable > Bodyweight)
 */
export function getValidSwaps(
  originalExercise: Exercise,
  allExercises: Exercise[]
): Exercise[] {
  // Filter valid alternatives
  const validSwaps = allExercises.filter((ex) => {
    // Exclude the original exercise itself
    if (ex.id === originalExercise.id) {
      return false;
    }

    // Must match slot (intensity tier)
    if (ex.slot !== originalExercise.slot) {
      return false;
    }

    // Matching logic depends on exercise type
    if (originalExercise.type === "compound") {
      // Compounds match by movement pattern
      return (
        ex.type === "compound" &&
        ex.movementPattern === originalExercise.movementPattern
      );
    } else {
      // Isolations match by primary muscle
      return (
        ex.type === "isolation" &&
        ex.primaryMuscle === originalExercise.primaryMuscle
      );
    }
  });

  // Sort by equipment priority
  return sortByEquipmentPriority(validSwaps);
}

/**
 * Sort exercises by equipment priority
 * Order: Barbell > Dumbbell > Machine > Cable > Bodyweight > SmithMachine
 */
function sortByEquipmentPriority(exercises: Exercise[]): Exercise[] {
  return exercises.sort((a, b) => {
    const priorityA = EQUIPMENT_ORDER.indexOf(a.equipment);
    const priorityB = EQUIPMENT_ORDER.indexOf(b.equipment);
    return priorityA - priorityB;
  });
}

// ============================================================================
// GROUPED SWAPS (For UI Display)
// ============================================================================

export interface GroupedSwaps {
  equipment: string;
  exercises: Exercise[];
}

/**
 * Group swap options by equipment type
 * Useful for UI rendering (show equipment headers)
 */
export function groupSwapsByEquipment(swaps: Exercise[]): GroupedSwaps[] {
  const grouped: Record<EquipmentType, Exercise[]> = {
    barbell: [],
    dumbbell: [],
    machine: [],
    cable: [],
    bodyweight: [],
    smithMachine: [],
  };

  // Group exercises by equipment
  swaps.forEach((ex) => {
    grouped[ex.equipment].push(ex);
  });

  // Convert to array format, maintaining equipment priority order
  return EQUIPMENT_ORDER.map((equipment) => ({
    equipment: formatEquipmentName(equipment),
    exercises: grouped[equipment],
  })).filter((group) => group.exercises.length > 0); // Only include non-empty groups
}

/**
 * Format equipment name for display
 */
function formatEquipmentName(equipment: EquipmentType): string {
  const names: Record<EquipmentType, string> = {
    barbell: "Barbell",
    dumbbell: "Dumbbell",
    machine: "Machine",
    cable: "Cable",
    bodyweight: "Bodyweight",
    smithMachine: "Smith Machine",
  };
  return names[equipment];
}

// ============================================================================
// SWAP VALIDATION
// ============================================================================

/**
 * Check if a swap is biomechanically valid
 */
export function isValidSwap(
  originalExercise: Exercise,
  targetExercise: Exercise
): { valid: boolean; reason?: string } {
  // Can't swap to the same exercise
  if (originalExercise.id === targetExercise.id) {
    return { valid: false, reason: "Cannot swap to the same exercise" };
  }

  // Must match slot
  if (originalExercise.slot !== targetExercise.slot) {
    return {
      valid: false,
      reason: `Slot mismatch: ${originalExercise.slot} vs ${targetExercise.slot}`,
    };
  }

  // Compound exercises must match movement pattern
  if (originalExercise.type === "compound") {
    if (targetExercise.type !== "compound") {
      return {
        valid: false,
        reason: "Cannot swap compound exercise for isolation",
      };
    }
    if (originalExercise.movementPattern !== targetExercise.movementPattern) {
      return {
        valid: false,
        reason: `Movement pattern mismatch: ${originalExercise.movementPattern} vs ${targetExercise.movementPattern}`,
      };
    }
  }

  // Isolation exercises must match primary muscle
  if (originalExercise.type === "isolation") {
    if (targetExercise.type !== "isolation") {
      return {
        valid: false,
        reason: "Cannot swap isolation exercise for compound",
      };
    }
    if (originalExercise.primaryMuscle !== targetExercise.primaryMuscle) {
      return {
        valid: false,
        reason: `Primary muscle mismatch: ${originalExercise.primaryMuscle} vs ${targetExercise.primaryMuscle}`,
      };
    }
  }

  return { valid: true };
}

// ============================================================================
// SWAP SUGGESTIONS (Smart Recommendations)
// ============================================================================

/**
 * Get top 3 recommended swaps
 * Prioritizes similar equipment type for easier transition
 */
export function getRecommendedSwaps(
  originalExercise: Exercise,
  allExercises: Exercise[]
): Exercise[] {
  const validSwaps = getValidSwaps(originalExercise, allExercises);

  // Prioritize same equipment type first
  const sameEquipment = validSwaps.filter(
    (ex) => ex.equipment === originalExercise.equipment
  );
  const differentEquipment = validSwaps.filter(
    (ex) => ex.equipment !== originalExercise.equipment
  );

  // Combine: same equipment first, then others
  const prioritized = [...sameEquipment, ...differentEquipment];

  // Return top 3
  return prioritized.slice(0, 3);
}

/**
 * Get swaps for "Feeling Rough" mode
 * Prioritizes machines over free weights (easier on CNS)
 */
export function getEasySwaps(
  originalExercise: Exercise,
  allExercises: Exercise[]
): Exercise[] {
  const validSwaps = getValidSwaps(originalExercise, allExercises);

  // Prioritize machines and cables (easier)
  const machines = validSwaps.filter((ex) => ex.equipment === "machine");
  const cables = validSwaps.filter((ex) => ex.equipment === "cable");
  const others = validSwaps.filter(
    (ex) => ex.equipment !== "machine" && ex.equipment !== "cable"
  );

  return [...machines, ...cables, ...others];
}

// ============================================================================
// SWAP STATISTICS
// ============================================================================

export interface SwapStats {
  totalSwaps: number;
  byEquipment: Record<string, number>;
  hasMachineAlternative: boolean;
  hasBodyweightAlternative: boolean;
}

/**
 * Get statistics about available swaps
 * Useful for UI hints ("5 alternatives available")
 */
export function getSwapStats(swaps: Exercise[]): SwapStats {
  const byEquipment: Record<string, number> = {};

  swaps.forEach((ex) => {
    const equipmentName = formatEquipmentName(ex.equipment);
    byEquipment[equipmentName] = (byEquipment[equipmentName] || 0) + 1;
  });

  return {
    totalSwaps: swaps.length,
    byEquipment,
    hasMachineAlternative: swaps.some((ex) => ex.equipment === "machine"),
    hasBodyweightAlternative: swaps.some((ex) => ex.equipment === "bodyweight"),
  };
}
