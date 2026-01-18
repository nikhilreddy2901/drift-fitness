/**
 * DRIFT FITNESS - CHECK-IN STORE
 * Manages pre-workout check-in data (mood, sleep, soreness)
 */

import { create } from "zustand";
import type { CheckInData } from "../types";

// ============================================================================
// STORE STATE
// ============================================================================

interface CheckInStore {
  // State
  checkIn: CheckInData;

  // Actions
  setMood: (mood: "great" | "okay" | "rough") => void;
  setGoodSleep: (goodSleep: boolean) => void;
  setNotSore: (notSore: boolean) => void;
  setCheckIn: (checkIn: Partial<CheckInData>) => void;
  resetCheckIn: () => void;
  getCheckInData: () => CheckInData;
}

// ============================================================================
// DEFAULT CHECK-IN STATE
// ============================================================================

const defaultCheckIn: CheckInData = {
  mood: "great",
  goodSleep: true,
  notSore: true,
  timestamp: new Date().toISOString(),
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useCheckInStore = create<CheckInStore>((set, get) => ({
  // Initial state (default to "feeling great")
  checkIn: defaultCheckIn,

  // ============================================================================
  // SET MOOD
  // ============================================================================

  setMood: (mood) => {
    set((state) => ({
      checkIn: {
        ...state.checkIn,
        mood,
        timestamp: new Date().toISOString(),
      },
    }));
    console.log(`[CheckInStore] Mood set to: ${mood}`);
  },

  // ============================================================================
  // SET GOOD SLEEP
  // ============================================================================

  setGoodSleep: (goodSleep) => {
    set((state) => ({
      checkIn: {
        ...state.checkIn,
        goodSleep,
        timestamp: new Date().toISOString(),
      },
    }));
    console.log(`[CheckInStore] Good sleep: ${goodSleep}`);
  },

  // ============================================================================
  // SET NOT SORE
  // ============================================================================

  setNotSore: (notSore) => {
    set((state) => ({
      checkIn: {
        ...state.checkIn,
        notSore,
        timestamp: new Date().toISOString(),
      },
    }));
    console.log(`[CheckInStore] Not sore: ${notSore}`);
  },

  // ============================================================================
  // SET CHECK-IN (Bulk Update)
  // ============================================================================

  setCheckIn: (checkInData) => {
    set((state) => ({
      checkIn: {
        ...state.checkIn,
        ...checkInData,
        timestamp: new Date().toISOString(),
      },
    }));
    console.log("[CheckInStore] Check-in updated:", checkInData);
  },

  // ============================================================================
  // RESET CHECK-IN
  // ============================================================================

  resetCheckIn: () => {
    set({
      checkIn: {
        ...defaultCheckIn,
        timestamp: new Date().toISOString(),
      },
    });
    console.log("[CheckInStore] Check-in reset to defaults");
  },

  // ============================================================================
  // GET CHECK-IN DATA
  // ============================================================================

  getCheckInData: () => {
    return get().checkIn;
  },
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Derive mood from sleep and soreness
 * Useful for auto-suggesting mood based on other inputs
 */
export function deriveMood(
  goodSleep: boolean,
  notSore: boolean
): "great" | "okay" | "rough" {
  if (goodSleep && notSore) {
    return "great";
  } else if (!goodSleep && !notSore) {
    return "rough";
  } else {
    return "okay";
  }
}

/**
 * Get a human-readable summary of check-in
 */
export function getCheckInSummary(checkIn: CheckInData): string {
  const { mood, goodSleep, notSore } = checkIn;

  const parts: string[] = [];

  if (mood === "great") {
    parts.push("Feeling great");
  } else if (mood === "okay") {
    parts.push("Feeling okay");
  } else {
    parts.push("Feeling rough");
  }

  if (!goodSleep) {
    parts.push("poor sleep");
  }

  if (!notSore) {
    parts.push("sore");
  }

  return parts.join(", ");
}
