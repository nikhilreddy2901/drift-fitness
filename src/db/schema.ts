/**
 * DRIFT FITNESS - SQLITE DATABASE SCHEMA
 * Local-first architecture for offline gym usage
 */

// ============================================================================
// EXERCISES TABLE (Pre-populated exercise library)
// ============================================================================

export const CREATE_EXERCISES_TABLE = `
  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL CHECK(muscle_group IN ('push', 'pull', 'legs')),
    slot INTEGER NOT NULL CHECK(slot IN (1, 2, 3)),
    type TEXT NOT NULL CHECK(type IN ('compound', 'isolation')),
    equipment TEXT NOT NULL CHECK(equipment IN ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'smithMachine')),
    load_type TEXT NOT NULL CHECK(load_type IN ('bilateral', 'unilateral')),
    rep_range_min INTEGER NOT NULL,
    rep_range_max INTEGER NOT NULL,
    movement_pattern TEXT CHECK(movement_pattern IN ('squat', 'hinge', 'lunge', 'horizontalPush', 'verticalPush', 'verticalPull', 'horizontalPull', 'carry', 'core')),
    primary_muscle TEXT CHECK(primary_muscle IN ('chest', 'back', 'quads', 'hamstrings', 'biceps', 'triceps', 'shoulders', 'calves', 'abs')),
    bodyweight_multiplier REAL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_EXERCISES_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
  CREATE INDEX IF NOT EXISTS idx_exercises_slot ON exercises(slot);
  CREATE INDEX IF NOT EXISTS idx_exercises_movement_pattern ON exercises(movement_pattern);
  CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises(primary_muscle);
`;

// ============================================================================
// USER_PROFILE TABLE (Single row - user data)
// ============================================================================

export const CREATE_USER_PROFILE_TABLE = `
  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    name TEXT,
    bodyweight REAL NOT NULL,
    experience_level TEXT NOT NULL CHECK(experience_level IN ('beginner', 'intermediate', 'advanced')),
    training_days_per_week INTEGER NOT NULL,
    current_week INTEGER NOT NULL DEFAULT 1,
    week_start_date TEXT NOT NULL,
    push_weekly_target REAL NOT NULL,
    pull_weekly_target REAL NOT NULL,
    legs_weekly_target REAL NOT NULL,
    push_starting_volume REAL NOT NULL,
    pull_starting_volume REAL NOT NULL,
    legs_starting_volume REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

// ============================================================================
// WORKING_WEIGHTS TABLE (Per-exercise working weights)
// ============================================================================

export const CREATE_WORKING_WEIGHTS_TABLE = `
  CREATE TABLE IF NOT EXISTS working_weights (
    exercise_id TEXT PRIMARY KEY NOT NULL,
    weight REAL NOT NULL,
    last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
  );
`;

// ============================================================================
// WORKOUTS TABLE (Workout sessions)
// ============================================================================

export const CREATE_WORKOUTS_TABLE = `
  CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    muscle_group TEXT NOT NULL CHECK(muscle_group IN ('push', 'pull', 'legs')),
    target_volume REAL NOT NULL,
    actual_volume REAL NOT NULL DEFAULT 0,
    completion_percentage REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('planned', 'in_progress', 'completed', 'skipped')) DEFAULT 'planned',
    session_rpe INTEGER CHECK(session_rpe >= 1 AND session_rpe <= 10),
    check_in_mood TEXT CHECK(check_in_mood IN ('great', 'okay', 'rough')),
    check_in_good_sleep INTEGER CHECK(check_in_good_sleep IN (0, 1)),
    check_in_not_sore INTEGER CHECK(check_in_not_sore IN (0, 1)),
    check_in_timestamp TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_WORKOUTS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
  CREATE INDEX IF NOT EXISTS idx_workouts_muscle_group ON workouts(muscle_group);
  CREATE INDEX IF NOT EXISTS idx_workouts_status ON workouts(status);
`;

// ============================================================================
// WORKOUT_EXERCISES TABLE (Exercises within a workout)
// ============================================================================

export const CREATE_WORKOUT_EXERCISES_TABLE = `
  CREATE TABLE IF NOT EXISTS workout_exercises (
    id TEXT PRIMARY KEY NOT NULL,
    workout_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    prescribed_sets INTEGER NOT NULL,
    prescribed_reps INTEGER NOT NULL,
    prescribed_weight REAL NOT NULL,
    target_volume REAL NOT NULL,
    actual_volume REAL NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
    exercise_order INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
  );
`;

export const CREATE_WORKOUT_EXERCISES_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
  CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);
`;

// ============================================================================
// LOGGED_SETS TABLE (Individual set logs)
// ============================================================================

export const CREATE_LOGGED_SETS_TABLE = `
  CREATE TABLE IF NOT EXISTS logged_sets (
    id TEXT PRIMARY KEY NOT NULL,
    workout_exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL,
    is_warmup INTEGER NOT NULL DEFAULT 0 CHECK(is_warmup IN (0, 1)),
    rpe INTEGER CHECK(rpe >= 1 AND rpe <= 10),
    logged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
  );
`;

export const CREATE_LOGGED_SETS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_logged_sets_workout_exercise_id ON logged_sets(workout_exercise_id);
`;

// ============================================================================
// WEEKLY_PROGRESS TABLE (Bucket tracking per week)
// ============================================================================

export const CREATE_WEEKLY_PROGRESS_TABLE = `
  CREATE TABLE IF NOT EXISTS weekly_progress (
    id TEXT PRIMARY KEY NOT NULL,
    week_start_date TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    is_deload_week INTEGER NOT NULL DEFAULT 0 CHECK(is_deload_week IN (0, 1)),
    status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'forgiven')) DEFAULT 'active',

    -- Smart weekly schedule (JSON: {push: [{dayOfWeek, date, muscleGroup, dayName}], pull: [...], legs: [...]})
    planned_schedule TEXT,

    -- Push bucket
    push_target_volume REAL NOT NULL,
    push_completed_volume REAL NOT NULL DEFAULT 0,
    push_completion_percentage REAL NOT NULL DEFAULT 0,
    push_sessions_planned INTEGER NOT NULL,
    push_sessions_completed INTEGER NOT NULL DEFAULT 0,
    push_drift_amount REAL NOT NULL DEFAULT 0,

    -- Pull bucket
    pull_target_volume REAL NOT NULL,
    pull_completed_volume REAL NOT NULL DEFAULT 0,
    pull_completion_percentage REAL NOT NULL DEFAULT 0,
    pull_sessions_planned INTEGER NOT NULL,
    pull_sessions_completed INTEGER NOT NULL DEFAULT 0,
    pull_drift_amount REAL NOT NULL DEFAULT 0,

    -- Legs bucket
    legs_target_volume REAL NOT NULL,
    legs_completed_volume REAL NOT NULL DEFAULT 0,
    legs_completion_percentage REAL NOT NULL DEFAULT 0,
    legs_sessions_planned INTEGER NOT NULL,
    legs_sessions_completed INTEGER NOT NULL DEFAULT 0,
    legs_drift_amount REAL NOT NULL DEFAULT 0,

    average_rpe REAL,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_WEEKLY_PROGRESS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_weekly_progress_week_start_date ON weekly_progress(week_start_date);
  CREATE INDEX IF NOT EXISTS idx_weekly_progress_status ON weekly_progress(status);
`;

// ============================================================================
// DRIFT_ITEMS TABLE (Tracking missed volume redistribution)
// ============================================================================

export const CREATE_DRIFT_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS drift_items (
    id TEXT PRIMARY KEY NOT NULL,
    muscle_group TEXT NOT NULL CHECK(muscle_group IN ('push', 'pull', 'legs')),
    amount REAL NOT NULL,
    source_workout_id TEXT NOT NULL,
    redistributed INTEGER NOT NULL DEFAULT 0 CHECK(redistributed IN (0, 1)),
    redistributed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_workout_id) REFERENCES workouts(id)
  );
`;

export const CREATE_DRIFT_ITEMS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_drift_items_muscle_group ON drift_items(muscle_group);
  CREATE INDEX IF NOT EXISTS idx_drift_items_redistributed ON drift_items(redistributed);
`;

// ============================================================================
// USER_STATS TABLE (Key-value store for misc settings)
// ============================================================================

export const CREATE_USER_STATS_TABLE = `
  CREATE TABLE IF NOT EXISTS user_stats (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

// ============================================================================
// EXERCISE_RATIOS TABLE (Fallback weight estimation)
// ============================================================================

export const CREATE_EXERCISE_RATIOS_TABLE = `
  CREATE TABLE IF NOT EXISTS exercise_ratios (
    exercise_id TEXT PRIMARY KEY NOT NULL,
    base_exercise_id TEXT NOT NULL,
    ratio REAL NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id),
    FOREIGN KEY (base_exercise_id) REFERENCES exercises(id)
  );
`;

// ============================================================================
// ALL CREATE STATEMENTS (For initialization)
// ============================================================================

export const ALL_CREATE_STATEMENTS = [
  CREATE_EXERCISES_TABLE,
  CREATE_EXERCISES_INDEXES,
  CREATE_USER_PROFILE_TABLE,
  CREATE_WORKING_WEIGHTS_TABLE,
  CREATE_WORKOUTS_TABLE,
  CREATE_WORKOUTS_INDEXES,
  CREATE_WORKOUT_EXERCISES_TABLE,
  CREATE_WORKOUT_EXERCISES_INDEXES,
  CREATE_LOGGED_SETS_TABLE,
  CREATE_LOGGED_SETS_INDEXES,
  CREATE_WEEKLY_PROGRESS_TABLE,
  CREATE_WEEKLY_PROGRESS_INDEXES,
  CREATE_DRIFT_ITEMS_TABLE,
  CREATE_DRIFT_ITEMS_INDEXES,
  CREATE_USER_STATS_TABLE,
  CREATE_EXERCISE_RATIOS_TABLE,
];

// ============================================================================
// DROP STATEMENTS (For dev/testing)
// ============================================================================

export const DROP_ALL_TABLES = `
  DROP TABLE IF EXISTS logged_sets;
  DROP TABLE IF EXISTS workout_exercises;
  DROP TABLE IF EXISTS workouts;
  DROP TABLE IF EXISTS drift_items;
  DROP TABLE IF EXISTS weekly_progress;
  DROP TABLE IF EXISTS working_weights;
  DROP TABLE IF EXISTS exercise_ratios;
  DROP TABLE IF EXISTS user_stats;
  DROP TABLE IF EXISTS user_profile;
  DROP TABLE IF EXISTS exercises;
`;
