/**
 * DRIFT FITNESS - DATABASE INITIALIZATION
 * Handles first-time setup and migrations
 */

import { db, ExercisesRepo, UserProfileRepo, WeeklyProgressRepo } from "./client";
import { INITIAL_EXERCISES, EXERCISE_STATS } from "./seeds/exercises";
import { runMigrations } from "./migrations";

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize database on app first launch
 */
export async function initializeDatabase(): Promise<void> {
  console.log("[DB Init] Starting database initialization...");

  try {
    // Step 1: Initialize database (create tables)
    await db.init();

    // Step 2: Run migrations (schema changes)
    await runMigrations();

    // Step 2: Check if exercises are already seeded
    const exercises = await ExercisesRepo.getAll();
    if (exercises.length === 0) {
      console.log("[DB Init] Seeding exercises...");
      await seedExercises();
    } else {
      console.log(`[DB Init] Exercises already seeded (${exercises.length} found)`);
    }

    // Step 3: Check if user profile exists
    const profile = await UserProfileRepo.get();
    if (!profile) {
      console.log("[DB Init] No user profile found - onboarding required");
    } else {
      console.log("[DB Init] User profile exists");
    }

    console.log("[DB Init] Database initialization complete");
  } catch (error) {
    console.error("[DB Init] Initialization failed:", error);
    throw error;
  }
}

/**
 * Reset database and reinitialize (for sign out)
 */
export async function resetDatabase(): Promise<void> {
  console.log("[DB Init] Resetting database...");

  try {
    // Step 1: Reset database (drop all tables)
    await db.reset();

    // Step 2: Run migrations
    await runMigrations();

    // Step 3: Seed exercises
    console.log("[DB Init] Seeding exercises after reset...");
    await seedExercises();

    console.log("[DB Init] Database reset complete");
  } catch (error) {
    console.error("[DB Init] Reset failed:", error);
    throw error;
  }
}

// ============================================================================
// SEED DATA
// ============================================================================

/**
 * Seed exercise database with full library
 */
async function seedExercises(): Promise<void> {
  console.log(`[DB Init] Seeding ${EXERCISE_STATS.total} exercises...`);
  console.log(`[DB Init] Distribution:`, EXERCISE_STATS.byMuscleGroup);

  let inserted = 0;
  let skipped = 0;

  for (const exercise of INITIAL_EXERCISES) {
    try {
      // Check if exercise already exists
      const existing = await ExercisesRepo.getById(exercise.id);
      if (existing) {
        skipped++;
        continue;
      }

      // Insert new exercise
      await ExercisesRepo.insert(exercise);
      inserted++;
    } catch (error) {
      console.error(`[DB Init] Failed to insert exercise ${exercise.id}:`, error);
    }
  }

  console.log(`[DB Init] Seeding complete: ${inserted} inserted, ${skipped} skipped`);
}

/**
 * Create user profile (called from onboarding)
 */
export async function createUserProfile(data: {
  bodyweight: number;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  trainingDaysPerWeek: number;
  weeklyTargets: { push: number; pull: number; legs: number };
}): Promise<void> {
  const weekStartDate = getMonday(new Date()).toISOString().split("T")[0];

  const profile = {
    bodyweight: data.bodyweight,
    experienceLevel: data.experienceLevel,
    trainingDaysPerWeek: data.trainingDaysPerWeek,
    currentWeek: 1,
    weekStartDate,
    weeklyTargets: data.weeklyTargets,
    startingVolume: data.weeklyTargets, // Starting = current for week 1
  };

  // Create profile
  await UserProfileRepo.create(profile);
  console.log("[DB Init] User profile created");

  // Create first week's progress
  await createFirstWeek(data.weeklyTargets, weekStartDate, data.trainingDaysPerWeek);
  console.log("[DB Init] First week initialized");
}

/**
 * Create the first week's progress entry
 */
async function createFirstWeek(
  weeklyTargets: { push: number; pull: number; legs: number },
  weekStartDate: string,
  trainingDaysPerWeek: number
): Promise<void> {
  // Calculate sessions per muscle group (simple split based on training days)
  let sessionsPerGroup = { push: 1, pull: 1, legs: 1 };

  if (trainingDaysPerWeek >= 4) {
    sessionsPerGroup = { push: 2, pull: 2, legs: 1 };
  } else if (trainingDaysPerWeek >= 5) {
    sessionsPerGroup = { push: 2, pull: 2, legs: 2 };
  }

  const weeklyProgress = {
    id: `week-${Date.now()}`,
    weekStartDate,
    weekNumber: 1,
    isDeloadWeek: false,
    buckets: {
      push: {
        targetVolume: weeklyTargets.push,
        completedVolume: 0,
        completionPercentage: 0,
        sessionsPlanned: sessionsPerGroup.push,
        sessionsCompleted: 0,
        driftAmount: 0,
      },
      pull: {
        targetVolume: weeklyTargets.pull,
        completedVolume: 0,
        completionPercentage: 0,
        sessionsPlanned: sessionsPerGroup.pull,
        sessionsCompleted: 0,
        driftAmount: 0,
      },
      legs: {
        targetVolume: weeklyTargets.legs,
        completedVolume: 0,
        completionPercentage: 0,
        sessionsPlanned: sessionsPerGroup.legs,
        sessionsCompleted: 0,
        driftAmount: 0,
      },
    },
  };

  await WeeklyProgressRepo.insert(weeklyProgress);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the Monday of the current week
 */
function getMonday(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}
