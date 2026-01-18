-- ============================================================================
-- DRIFT FITNESS - SUPABASE DATABASE SCHEMA
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================================

-- Enable UUID extension for generating IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- EXERCISES TABLE (Shared exercise library - not user-specific)
-- ============================================================================

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_slot ON exercises(slot);
CREATE INDEX IF NOT EXISTS idx_exercises_movement_pattern ON exercises(movement_pattern);
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises(primary_muscle);

-- ============================================================================
-- USER_PROFILE TABLE (Per-user data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bodyweight REAL NOT NULL,
  experience_level TEXT NOT NULL CHECK(experience_level IN ('beginner', 'intermediate', 'advanced')),
  training_days_per_week INTEGER NOT NULL,
  current_week INTEGER NOT NULL DEFAULT 1,
  week_start_date DATE NOT NULL,
  push_weekly_target REAL NOT NULL,
  pull_weekly_target REAL NOT NULL,
  legs_weekly_target REAL NOT NULL,
  push_starting_volume REAL NOT NULL,
  pull_starting_volume REAL NOT NULL,
  legs_starting_volume REAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);

-- ============================================================================
-- WORKING_WEIGHTS TABLE (Per-user, per-exercise working weights)
-- ============================================================================

CREATE TABLE IF NOT EXISTS working_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  weight REAL NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_working_weights_user_id ON working_weights(user_id);
CREATE INDEX IF NOT EXISTS idx_working_weights_exercise_id ON working_weights(exercise_id);

-- ============================================================================
-- WORKOUTS TABLE (Workout sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  muscle_group TEXT NOT NULL CHECK(muscle_group IN ('push', 'pull', 'legs')),
  target_volume REAL NOT NULL,
  actual_volume REAL NOT NULL DEFAULT 0,
  completion_percentage REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('planned', 'in_progress', 'completed', 'skipped')) DEFAULT 'planned',
  session_rpe INTEGER CHECK(session_rpe >= 1 AND session_rpe <= 10),
  check_in_mood TEXT CHECK(check_in_mood IN ('great', 'okay', 'rough')),
  check_in_good_sleep BOOLEAN,
  check_in_not_sore BOOLEAN,
  check_in_timestamp TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
CREATE INDEX IF NOT EXISTS idx_workouts_muscle_group ON workouts(muscle_group);
CREATE INDEX IF NOT EXISTS idx_workouts_status ON workouts(status);

-- ============================================================================
-- WORKOUT_EXERCISES TABLE (Exercises within a workout)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  exercise_name TEXT NOT NULL,
  prescribed_sets INTEGER NOT NULL,
  prescribed_reps INTEGER NOT NULL,
  prescribed_weight REAL NOT NULL,
  target_volume REAL NOT NULL,
  actual_volume REAL NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  exercise_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);

-- ============================================================================
-- LOGGED_SETS TABLE (Individual set logs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS logged_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  is_warmup BOOLEAN NOT NULL DEFAULT FALSE,
  rpe INTEGER CHECK(rpe >= 1 AND rpe <= 10),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logged_sets_workout_exercise_id ON logged_sets(workout_exercise_id);

-- ============================================================================
-- WEEKLY_PROGRESS TABLE (Bucket tracking per week)
-- ============================================================================

CREATE TABLE IF NOT EXISTS weekly_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_number INTEGER NOT NULL,
  is_deload_week BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'forgiven')) DEFAULT 'active',

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
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_progress_user_id ON weekly_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_progress_week_start_date ON weekly_progress(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_progress_status ON weekly_progress(status);

-- ============================================================================
-- DRIFT_ITEMS TABLE (Tracking missed volume redistribution)
-- ============================================================================

CREATE TABLE IF NOT EXISTS drift_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muscle_group TEXT NOT NULL CHECK(muscle_group IN ('push', 'pull', 'legs')),
  amount REAL NOT NULL,
  source_workout_id UUID NOT NULL REFERENCES workouts(id),
  redistributed BOOLEAN NOT NULL DEFAULT FALSE,
  redistributed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drift_items_user_id ON drift_items(user_id);
CREATE INDEX IF NOT EXISTS idx_drift_items_muscle_group ON drift_items(muscle_group);
CREATE INDEX IF NOT EXISTS idx_drift_items_redistributed ON drift_items(redistributed);

-- ============================================================================
-- USER_STATS TABLE (Key-value store for misc settings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- ============================================================================
-- EXERCISE_RATIOS TABLE (Fallback weight estimation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_ratios (
  exercise_id TEXT PRIMARY KEY NOT NULL REFERENCES exercises(id),
  base_exercise_id TEXT NOT NULL REFERENCES exercises(id),
  ratio REAL NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all user tables
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE logged_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- User Profile Policies
CREATE POLICY "Users can view their own profile" ON user_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profile
  FOR UPDATE USING (auth.uid() = user_id);

-- Working Weights Policies
CREATE POLICY "Users can view their own working weights" ON working_weights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own working weights" ON working_weights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own working weights" ON working_weights
  FOR UPDATE USING (auth.uid() = user_id);

-- Workouts Policies
CREATE POLICY "Users can view their own workouts" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" ON workouts
  FOR UPDATE USING (auth.uid() = user_id);

-- Workout Exercises Policies (via workout ownership)
CREATE POLICY "Users can view their own workout exercises" ON workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own workout exercises" ON workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own workout exercises" ON workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()
    )
  );

-- Logged Sets Policies (via workout exercise ownership)
CREATE POLICY "Users can view their own logged sets" ON logged_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = logged_sets.workout_exercise_id AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own logged sets" ON logged_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = logged_sets.workout_exercise_id AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own logged sets" ON logged_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = logged_sets.workout_exercise_id AND workouts.user_id = auth.uid()
    )
  );

-- Weekly Progress Policies
CREATE POLICY "Users can view their own weekly progress" ON weekly_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly progress" ON weekly_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly progress" ON weekly_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Drift Items Policies
CREATE POLICY "Users can view their own drift items" ON drift_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drift items" ON drift_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drift items" ON drift_items
  FOR UPDATE USING (auth.uid() = user_id);

-- User Stats Policies
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Exercises are public (everyone can read)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are viewable by everyone" ON exercises
  FOR SELECT USING (true);

-- Exercise ratios are public
ALTER TABLE exercise_ratios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercise ratios are viewable by everyone" ON exercise_ratios
  FOR SELECT USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profile
CREATE TRIGGER update_user_profile_updated_at
  BEFORE UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_stats
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
