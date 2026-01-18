/**
 * DRIFT FITNESS APP - TYPE DEFINITIONS (v3.2)
 * Complete TypeScript schema for the Adaptive Fitness App
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type MuscleGroup = "push" | "pull" | "legs";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type ExerciseSlot = 1 | 2 | 3;

export type ExerciseType = "compound" | "isolation";

export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "smithMachine";

export type LoadType = "bilateral" | "unilateral";

export type MovementPattern =
  | "squat"
  | "hinge"
  | "lunge"
  | "horizontalPush"
  | "verticalPush"
  | "verticalPull"
  | "horizontalPull"
  | "carry"
  | "core";

export type PrimaryMuscle =
  | "chest"
  | "back"
  | "quads"
  | "hamstrings"
  | "biceps"
  | "triceps"
  | "shoulders"
  | "calves"
  | "abs";

export type CheckInMood = "great" | "okay" | "rough";

// ============================================================================
// EXERCISE SCHEMA (v3.2 - Final)
// ============================================================================

export interface Exercise {
  /** Unique exercise identifier */
  id: string;

  /** Display name */
  name: string;

  /** Which muscle group bucket this fills */
  muscleGroup: MuscleGroup;

  /** Hierarchical programming slot (1 = Heavy, 2 = Moderate, 3 = Isolation) */
  slot: ExerciseSlot;

  /** Exercise type */
  type: ExerciseType;

  /** Equipment required */
  equipment: EquipmentType;

  /** Load type for volume calculation */
  loadType: LoadType;

  /** Target rep range for this slot [min, max] */
  repRange: [number, number];

  /** Movement pattern (REQUIRED for compound exercises) */
  movementPattern?: MovementPattern;

  /** Primary muscle (REQUIRED for isolation exercises) */
  primaryMuscle?: PrimaryMuscle;

  /** Bodyweight multiplier (for bodyweight exercises only) */
  bodyweightMultiplier?: number;
}

// ============================================================================
// USER PROFILE
// ============================================================================

export interface UserProfile {
  /** Firebase UID */
  uid: string;

  /** User's name */
  name?: string;

  /** User's bodyweight in lbs (for bodyweight exercise calculations) */
  bodyweight: number;

  /** Experience level (determines starting volume) */
  experienceLevel: ExperienceLevel;

  /** Training frequency per week */
  trainingDaysPerWeek: number;

  /** Current week number (for deload tracking) */
  currentWeek: number;

  /** Weekly volume targets in lbs (the "buckets") */
  weeklyTargets: {
    push: number;
    pull: number;
    legs: number;
  };

  /** Starting volume (for 2x cap check) */
  startingVolume: {
    push: number;
    pull: number;
    legs: number;
  };

  /** Per-exercise working weights (lbs) */
  workingWeights: Record<string, number>; // { "bench_press": 135, "squat": 225, ... }

  /** Week start date (Monday) */
  weekStartDate: string; // ISO date string

  /** Account created date */
  createdAt: string; // ISO date string

  /** Last updated */
  updatedAt: string; // ISO date string
}

// ============================================================================
// WORKOUT SESSION
// ============================================================================

export interface WorkoutSession {
  /** Unique session ID */
  id: string;

  /** User ID */
  userId: string;

  /** Session date */
  date: string; // ISO date string

  /** Which muscle group */
  muscleGroup: MuscleGroup;

  /** Target volume for this session (lbs) */
  targetVolume: number;

  /** Actual volume completed (lbs) */
  actualVolume: number;

  /** Completion percentage */
  completionPercentage: number;

  /** Check-in data (pre-workout) */
  checkIn: CheckInData;

  /** Exercises in this workout */
  exercises: WorkoutExercise[];

  /** Session RPE (1-10, recorded post-workout) */
  sessionRPE?: number;

  /** Session status */
  status: "planned" | "in_progress" | "completed" | "skipped";

  /** Started at timestamp */
  startedAt?: string; // ISO date string

  /** Completed at timestamp */
  completedAt?: string; // ISO date string
}

// ============================================================================
// WORKOUT EXERCISE (Within a Session)
// ============================================================================

export interface WorkoutExercise {
  /** Unique ID for this exercise instance */
  id: string;

  /** Reference to Exercise */
  exerciseId: string;

  /** Exercise name (denormalized for quick access) */
  exerciseName: string;

  /** Prescribed sets */
  prescribedSets: number;

  /** Prescribed reps */
  prescribedReps: number;

  /** Prescribed weight (lbs) */
  prescribedWeight: number;

  /** Target volume for this exercise (lbs) */
  targetVolume: number;

  /** Actual volume completed (lbs) */
  actualVolume: number;

  /** Logged sets */
  loggedSets: LoggedSet[];

  /** Completion status */
  completed: boolean;
}

// ============================================================================
// LOGGED SET
// ============================================================================

export interface LoggedSet {
  /** Set number (1, 2, 3, ...) */
  setNumber: number;

  /** Weight used (lbs) */
  weight: number;

  /** Reps completed */
  reps: number;

  /** Is this a warm-up set? (CRITICAL: warm-ups don't count toward volume) */
  isWarmup: boolean;

  /** Optional RPE for this set */
  rpe?: number;

  /** Timestamp when logged */
  loggedAt: string; // ISO date string
}

// ============================================================================
// CHECK-IN DATA (Pre-Workout)
// ============================================================================

export interface CheckInData {
  /** How the user feels overall */
  mood: CheckInMood;

  /** Sleep quality (true = good, false = poor) */
  goodSleep: boolean;

  /** Soreness level (true = not sore, false = sore) */
  notSore: boolean;

  /** Timestamp of check-in */
  timestamp: string; // ISO date string
}

// ============================================================================
// WEEKLY PROGRESS (Bucket Tracking)
// ============================================================================

export interface WeeklyProgress {
  /** User ID */
  userId: string;

  /** Week start date (Monday) */
  weekStartDate: string; // ISO date string

  /** Week number */
  weekNumber: number;

  /** Is this a deload week? */
  isDeloadWeek: boolean;

  /** Bucket progress */
  buckets: {
    push: BucketProgress;
    pull: BucketProgress;
    legs: BucketProgress;
  };

  /** Total weekly RPE average */
  averageRPE?: number;

  /** Week status */
  status: "active" | "completed" | "forgiven";

  /** Completion timestamp */
  completedAt?: string; // ISO date string
}

export interface BucketProgress {
  /** Target volume for the week (lbs) */
  targetVolume: number;

  /** Completed volume (lbs) */
  completedVolume: number;

  /** Completion percentage */
  completionPercentage: number;

  /** Number of sessions planned */
  sessionsPlanned: number;

  /** Number of sessions completed */
  sessionsCompleted: number;

  /** Current drift/debt (lbs) */
  driftAmount: number;
}

// ============================================================================
// DRIFT ITEM (Tracking Missed Volume)
// ============================================================================

export interface DriftItem {
  /** Unique drift ID */
  id: string;

  /** User ID */
  userId: string;

  /** Which muscle group */
  muscleGroup: MuscleGroup;

  /** Amount of volume missed (lbs) */
  amount: number;

  /** Source session where drift occurred */
  sourceSessionId: string;

  /** Date drift was created */
  createdAt: string; // ISO date string

  /** Has this drift been redistributed? */
  redistributed: boolean;

  /** Date redistributed (if applicable) */
  redistributedAt?: string; // ISO date string
}

// ============================================================================
// EXERCISE RATIO (For Fallback Weight Estimation)
// ============================================================================

export interface ExerciseRatio {
  /** The exercise being estimated */
  exerciseId: string;

  /** The base exercise to estimate from */
  baseExerciseId: string;

  /** Ratio multiplier (e.g., 0.7 for DB Bench vs Barbell Bench) */
  ratio: number;
}

// ============================================================================
// WORKOUT PRESCRIPTION (Output of Workout Generator)
// ============================================================================

export interface WorkoutPrescription {
  /** Exercise to perform */
  exercise: Exercise;

  /** Number of sets */
  sets: number;

  /** Number of reps per set */
  reps: number;

  /** Weight to use (lbs) */
  weight: number;

  /** Target volume for this exercise (lbs) */
  targetVolume: number;

  /** Actual volume (accounting for rounding) */
  actualVolume: number;
}

// ============================================================================
// DAILY LOG (For History/Progress Tracking)
// ============================================================================

export interface DailyLog {
  /** Date of the log */
  date: string; // ISO date string

  /** User ID */
  userId: string;

  /** Workouts completed today */
  workouts: WorkoutSession[];

  /** Total volume (lbs) */
  totalVolume: number;

  /** Training time (minutes) */
  trainingTime?: number;

  /** User notes */
  notes?: string;
}

// ============================================================================
// ONBOARDING DATA
// ============================================================================

export interface OnboardingData {
  /** Experience level */
  experienceLevel: ExperienceLevel;

  /** Training days per week */
  trainingDaysPerWeek: number;

  /** Bodyweight (lbs) */
  bodyweight: number;

  /** Benchmark lifts (for volume calibration) */
  benchmarkLifts: {
    squat?: number; // 5-rep max
    bench?: number; // 5-rep max
    deadlift?: number; // 5-rep max
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Rep range configuration per slot */
export const SLOT_REP_RANGES: Record<ExerciseSlot, [number, number]> = {
  1: [5, 8],   // Slot 1: Strength/Power
  2: [8, 12],  // Slot 2: Hypertrophy
  3: [12, 15], // Slot 3: Metabolic/Pump
};

/** Volume distribution per slot (%) */
export const SLOT_VOLUME_DISTRIBUTION = {
  1: 0.50, // 50% of session volume
  2: 0.30, // 30% of session volume
  3: 0.20, // 20% of session volume
};

/** Equipment display order */
export const EQUIPMENT_ORDER: EquipmentType[] = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "smithMachine",
];

/** Progressive overload percentages */
export const PROGRESSIVE_OVERLOAD = {
  WEEKS_1_4: {
    LOW_RPE: 0.05,    // +5% if RPE ≤ 6
    MID_RPE: 0.025,   // +2.5% if RPE 7-8
    HIGH_RPE: 0,      // 0% if RPE ≥ 9
  },
  WEEKS_5_PLUS: {
    LOW_RPE: 0.025,   // Capped at +2.5%
    MID_RPE: 0.025,
    HIGH_RPE: 0,
  },
  MAX_MULTIPLIER: 2, // Hard cap at 2x starting volume
};

/** Drift algorithm constants */
export const DRIFT_ALGORITHM = {
  FORGIVENESS_THRESHOLD: 0.10,  // 10% miss = forgiven
  SESSION_CAP: 0.20,            // Max +20% per session
  VOLUME_TOLERANCE: 0.10,       // ±10% for practical sets
};

/** Deload configuration */
export const DELOAD_CONFIG = {
  FREQUENCY: 4,        // Every 4th week
  REDUCTION: 0.40,     // 40% volume reduction
};
