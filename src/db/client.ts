/**
 * DRIFT FITNESS - SQLITE DATABASE CLIENT
 * Singleton pattern for database access
 */

import * as SQLite from "expo-sqlite";
import { ALL_CREATE_STATEMENTS, DROP_ALL_TABLES } from "./schema";

// ============================================================================
// DATABASE CLIENT (Singleton)
// ============================================================================

class DatabaseClient {
  private static instance: DatabaseClient;
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  /**
   * Initialize database (create tables if needed)
   */
  public async init(): Promise<void> {
    if (this.initialized) {
      console.log("[DB] Already initialized");
      return;
    }

    try {
      console.log("[DB] Opening database...");
      this.db = await SQLite.openDatabaseAsync("drift.db");

      console.log("[DB] Creating tables...");
      for (const statement of ALL_CREATE_STATEMENTS) {
        await this.db.execAsync(statement);
      }

      this.initialized = true;
      console.log("[DB] Database initialized successfully");
    } catch (error) {
      console.error("[DB] Initialization error:", error);
      throw error;
    }
  }

  /**
   * Reset database (dev/testing only)
   */
  public async reset(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    console.log("[DB] Resetting database...");
    await this.db.execAsync(DROP_ALL_TABLES);

    // Reset database version to 0 so migrations will run
    await this.db.execAsync('PRAGMA user_version = 0');

    // Reset the initialized flag so init() will recreate tables
    this.initialized = false;

    await this.init();
    console.log("[DB] Database reset complete");
  }

  /**
   * Get database instance (ensure initialized first)
   */
  public getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db || !this.initialized) {
      throw new Error("Database not initialized. Call init() first.");
    }
    return this.db;
  }

  /**
   * Execute a query that returns rows
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = this.getDatabase();
    try {
      const result = await db.getAllAsync<T>(sql, params);
      return result;
    } catch (error) {
      console.error("[DB] Query error:", error);
      console.error("[DB] SQL:", sql);
      console.error("[DB] Params:", params);
      throw error;
    }
  }

  /**
   * Execute a query that returns a single row
   */
  public async queryOne<T = any>(
    sql: string,
    params: any[] = []
  ): Promise<T | null> {
    const db = this.getDatabase();
    try {
      const result = await db.getFirstAsync<T>(sql, params);
      return result || null;
    } catch (error) {
      console.error("[DB] QueryOne error:", error);
      console.error("[DB] SQL:", sql);
      console.error("[DB] Params:", params);
      throw error;
    }
  }

  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE)
   */
  public async execute(sql: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
    const db = this.getDatabase();
    try {
      const result = await db.runAsync(sql, params);
      return result;
    } catch (error) {
      console.error("[DB] Execute error:", error);
      console.error("[DB] SQL:", sql);
      console.error("[DB] Params:", params);
      throw error;
    }
  }

  /**
   * Execute multiple statements in a transaction
   */
  public async transaction(callback: () => Promise<void>): Promise<void> {
    const db = this.getDatabase();
    try {
      await db.withTransactionAsync(async () => {
        await callback();
      });
    } catch (error) {
      console.error("[DB] Transaction error:", error);
      throw error;
    }
  }

  /**
   * Execute raw SQL (for complex operations)
   */
  public async execRaw(sql: string): Promise<void> {
    const db = this.getDatabase();
    try {
      await db.execAsync(sql);
    } catch (error) {
      console.error("[DB] ExecRaw error:", error);
      console.error("[DB] SQL:", sql);
      throw error;
    }
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const db = DatabaseClient.getInstance();

// ============================================================================
// HELPER FUNCTIONS (Repository Pattern)
// ============================================================================

/**
 * Exercises Repository
 */
export const ExercisesRepo = {
  async getAll() {
    return db.query("SELECT * FROM exercises ORDER BY muscle_group, slot, name");
  },

  async getById(id: string) {
    return db.queryOne("SELECT * FROM exercises WHERE id = ?", [id]);
  },

  async getByMuscleGroup(muscleGroup: string) {
    return db.query(
      "SELECT * FROM exercises WHERE muscle_group = ? ORDER BY slot, name",
      [muscleGroup]
    );
  },

  async getBySlot(muscleGroup: string, slot: number) {
    return db.query(
      "SELECT * FROM exercises WHERE muscle_group = ? AND slot = ? ORDER BY name",
      [muscleGroup, slot]
    );
  },

  async insert(exercise: any) {
    const sql = `
      INSERT INTO exercises (
        id, name, muscle_group, slot, type, equipment, load_type,
        rep_range_min, rep_range_max, movement_pattern, primary_muscle, bodyweight_multiplier
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return db.execute(sql, [
      exercise.id,
      exercise.name,
      exercise.muscleGroup,
      exercise.slot,
      exercise.type,
      exercise.equipment,
      exercise.loadType,
      exercise.repRange[0],
      exercise.repRange[1],
      exercise.movementPattern || null,
      exercise.primaryMuscle || null,
      exercise.bodyweightMultiplier || null,
    ]);
  },

  async upsert(exercise: any) {
    // Check if exercise exists
    const existing = await db.queryOne(
      "SELECT id FROM exercises WHERE id = ?",
      [exercise.id]
    );

    if (existing) {
      // Update existing
      const sql = `
        UPDATE exercises SET
          name = ?,
          muscle_group = ?,
          slot = ?,
          type = ?,
          equipment = ?,
          load_type = ?,
          rep_range_min = ?,
          rep_range_max = ?,
          movement_pattern = ?,
          primary_muscle = ?,
          bodyweight_multiplier = ?
        WHERE id = ?
      `;
      return db.execute(sql, [
        exercise.name,
        exercise.muscle_group,
        exercise.slot,
        exercise.type,
        exercise.equipment,
        exercise.load_type,
        exercise.rep_range_min,
        exercise.rep_range_max,
        exercise.movement_pattern || null,
        exercise.primary_muscle || null,
        exercise.bodyweight_multiplier || null,
        exercise.id,
      ]);
    } else {
      // Insert new
      const sql = `
        INSERT INTO exercises (
          id, name, muscle_group, slot, type, equipment, load_type,
          rep_range_min, rep_range_max, movement_pattern, primary_muscle, bodyweight_multiplier
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      return db.execute(sql, [
        exercise.id,
        exercise.name,
        exercise.muscle_group,
        exercise.slot,
        exercise.type,
        exercise.equipment,
        exercise.load_type,
        exercise.rep_range_min,
        exercise.rep_range_max,
        exercise.movement_pattern || null,
        exercise.primary_muscle || null,
        exercise.bodyweight_multiplier || null,
      ]);
    }
  },
};

/**
 * User Profile Repository
 */
export const UserProfileRepo = {
  async get() {
    return db.queryOne("SELECT * FROM user_profile WHERE id = 1");
  },

  async create(profile: any) {
    const sql = `
      INSERT INTO user_profile (
        id, name, bodyweight, experience_level, training_days_per_week, current_week, week_start_date,
        push_weekly_target, pull_weekly_target, legs_weekly_target,
        push_starting_volume, pull_starting_volume, legs_starting_volume
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return db.execute(sql, [
      profile.name || null,
      profile.bodyweight,
      profile.experienceLevel,
      profile.trainingDaysPerWeek,
      profile.currentWeek,
      profile.weekStartDate,
      profile.weeklyTargets.push,
      profile.weeklyTargets.pull,
      profile.weeklyTargets.legs,
      profile.startingVolume.push,
      profile.startingVolume.pull,
      profile.startingVolume.legs,
    ]);
  },

  async update(profile: any) {
    const sql = `
      UPDATE user_profile SET
        name = ?,
        bodyweight = ?,
        experience_level = ?,
        training_days_per_week = ?,
        current_week = ?,
        week_start_date = ?,
        push_weekly_target = ?,
        pull_weekly_target = ?,
        legs_weekly_target = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `;
    return db.execute(sql, [
      profile.name || null,
      profile.bodyweight,
      profile.experienceLevel,
      profile.trainingDaysPerWeek,
      profile.currentWeek,
      profile.weekStartDate,
      profile.weeklyTargets.push,
      profile.weeklyTargets.pull,
      profile.weeklyTargets.legs,
    ]);
  },
};

/**
 * Working Weights Repository
 */
export const WorkingWeightsRepo = {
  async getAll() {
    return db.query("SELECT * FROM working_weights");
  },

  async getByExerciseId(exerciseId: string) {
    return db.queryOne(
      "SELECT * FROM working_weights WHERE exercise_id = ?",
      [exerciseId]
    );
  },

  async upsert(exerciseId: string, weight: number) {
    const sql = `
      INSERT INTO working_weights (exercise_id, weight)
      VALUES (?, ?)
      ON CONFLICT(exercise_id) DO UPDATE SET
        weight = excluded.weight,
        last_updated = CURRENT_TIMESTAMP
    `;
    return db.execute(sql, [exerciseId, weight]);
  },
};

/**
 * Workouts Repository
 */
export const WorkoutsRepo = {
  async getAll() {
    return db.query("SELECT * FROM workouts ORDER BY date DESC");
  },

  async getById(id: string) {
    return db.queryOne("SELECT * FROM workouts WHERE id = ?", [id]);
  },

  async getByDateRange(startDate: string, endDate: string) {
    return db.query(
      "SELECT * FROM workouts WHERE date >= ? AND date <= ? ORDER BY date",
      [startDate, endDate]
    );
  },

  async insert(workout: any) {
    const sql = `
      INSERT INTO workouts (
        id, date, muscle_group, target_volume, actual_volume, completion_percentage,
        status, check_in_mood, check_in_good_sleep, check_in_not_sore, check_in_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return db.execute(sql, [
      workout.id,
      workout.date,
      workout.muscleGroup,
      workout.targetVolume,
      workout.actualVolume || 0,
      workout.completionPercentage || 0,
      workout.status || "planned",
      workout.checkIn?.mood || null,
      workout.checkIn?.goodSleep ? 1 : 0,
      workout.checkIn?.notSore ? 1 : 0,
      workout.checkIn?.timestamp || null,
    ]);
  },

  async update(id: string, updates: any) {
    const sql = `
      UPDATE workouts SET
        actual_volume = ?,
        completion_percentage = ?,
        status = ?,
        session_rpe = ?,
        completed_at = ?
      WHERE id = ?
    `;
    return db.execute(sql, [
      updates.actualVolume,
      updates.completionPercentage,
      updates.status,
      updates.sessionRPE || null,
      updates.completedAt || null,
      id,
    ]);
  },
};

/**
 * Weekly Progress Repository
 */
export const WeeklyProgressRepo = {
  async getByWeekStartDate(weekStartDate: string) {
    return db.queryOne(
      "SELECT * FROM weekly_progress WHERE week_start_date = ?",
      [weekStartDate]
    );
  },

  async getCurrentWeek() {
    return db.queryOne(
      "SELECT * FROM weekly_progress WHERE status = 'active' ORDER BY week_start_date DESC LIMIT 1"
    );
  },

  async insert(progress: any) {
    const sql = `
      INSERT INTO weekly_progress (
        id, week_start_date, week_number, is_deload_week, status, planned_schedule,
        push_target_volume, push_sessions_planned,
        pull_target_volume, pull_sessions_planned,
        legs_target_volume, legs_sessions_planned
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return db.execute(sql, [
      progress.id,
      progress.weekStartDate,
      progress.weekNumber,
      progress.isDeloadWeek ? 1 : 0,
      'active', // Set status to 'active' by default
      progress.plannedSchedule || null, // Smart weekly schedule (JSON)
      progress.buckets.push.targetVolume,
      progress.buckets.push.sessionsPlanned,
      progress.buckets.pull.targetVolume,
      progress.buckets.pull.sessionsPlanned,
      progress.buckets.legs.targetVolume,
      progress.buckets.legs.sessionsPlanned,
    ]);
  },

  async upsert(progress: any) {
    // Check if progress with this ID already exists
    const existing = await db.queryOne(
      "SELECT id FROM weekly_progress WHERE id = ?",
      [progress.id]
    );

    if (existing) {
      // Update existing record
      const sql = `
        UPDATE weekly_progress SET
          week_start_date = ?,
          week_number = ?,
          is_deload_week = ?,
          status = ?,
          push_target_volume = ?,
          push_completed_volume = ?,
          push_completion_percentage = ?,
          push_sessions_planned = ?,
          push_sessions_completed = ?,
          push_drift_amount = ?,
          pull_target_volume = ?,
          pull_completed_volume = ?,
          pull_completion_percentage = ?,
          pull_sessions_planned = ?,
          pull_sessions_completed = ?,
          pull_drift_amount = ?,
          legs_target_volume = ?,
          legs_completed_volume = ?,
          legs_completion_percentage = ?,
          legs_sessions_planned = ?,
          legs_sessions_completed = ?,
          legs_drift_amount = ?
        WHERE id = ?
      `;
      return db.execute(sql, [
        progress.weekStartDate,
        progress.weekNumber,
        progress.isDeloadWeek ? 1 : 0,
        progress.status || 'active',
        progress.buckets.push.targetVolume,
        progress.buckets.push.completedVolume || 0,
        progress.buckets.push.completionPercentage || 0,
        progress.buckets.push.sessionsPlanned,
        progress.buckets.push.sessionsCompleted || 0,
        progress.buckets.push.driftAmount || 0,
        progress.buckets.pull.targetVolume,
        progress.buckets.pull.completedVolume || 0,
        progress.buckets.pull.completionPercentage || 0,
        progress.buckets.pull.sessionsPlanned,
        progress.buckets.pull.sessionsCompleted || 0,
        progress.buckets.pull.driftAmount || 0,
        progress.buckets.legs.targetVolume,
        progress.buckets.legs.completedVolume || 0,
        progress.buckets.legs.completionPercentage || 0,
        progress.buckets.legs.sessionsPlanned,
        progress.buckets.legs.sessionsCompleted || 0,
        progress.buckets.legs.driftAmount || 0,
        progress.id,
      ]);
    } else {
      // Insert new record
      const sql = `
        INSERT INTO weekly_progress (
          id, week_start_date, week_number, is_deload_week, status,
          push_target_volume, push_completed_volume, push_completion_percentage,
          push_sessions_planned, push_sessions_completed, push_drift_amount,
          pull_target_volume, pull_completed_volume, pull_completion_percentage,
          pull_sessions_planned, pull_sessions_completed, pull_drift_amount,
          legs_target_volume, legs_completed_volume, legs_completion_percentage,
          legs_sessions_planned, legs_sessions_completed, legs_drift_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      return db.execute(sql, [
        progress.id,
        progress.weekStartDate,
        progress.weekNumber,
        progress.isDeloadWeek ? 1 : 0,
        progress.status || 'active',
        progress.buckets.push.targetVolume,
        progress.buckets.push.completedVolume || 0,
        progress.buckets.push.completionPercentage || 0,
        progress.buckets.push.sessionsPlanned,
        progress.buckets.push.sessionsCompleted || 0,
        progress.buckets.push.driftAmount || 0,
        progress.buckets.pull.targetVolume,
        progress.buckets.pull.completedVolume || 0,
        progress.buckets.pull.completionPercentage || 0,
        progress.buckets.pull.sessionsPlanned,
        progress.buckets.pull.sessionsCompleted || 0,
        progress.buckets.pull.driftAmount || 0,
        progress.buckets.legs.targetVolume,
        progress.buckets.legs.completedVolume || 0,
        progress.buckets.legs.completionPercentage || 0,
        progress.buckets.legs.sessionsPlanned,
        progress.buckets.legs.sessionsCompleted || 0,
        progress.buckets.legs.driftAmount || 0,
      ]);
    }
  },
};

/**
 * Drift Items Repository
 */
export const DriftItemsRepo = {
  async insert(driftItem: any) {
    const sql = `
      INSERT INTO drift_items (
        id, muscle_group, amount, source_workout_id, redistributed, redistributed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    return db.execute(sql, [
      driftItem.id,
      driftItem.muscleGroup,
      driftItem.amount,
      driftItem.sourceWorkoutId,
      driftItem.redistributed ? 1 : 0,
      driftItem.redistributedAt || null,
    ]);
  },

  async getUnredistributed(muscleGroup: string) {
    return db.query(
      "SELECT * FROM drift_items WHERE muscle_group = ? AND redistributed = 0 ORDER BY created_at ASC",
      [muscleGroup]
    );
  },

  async markAsRedistributed(id: string) {
    return db.execute(
      "UPDATE drift_items SET redistributed = 1, redistributed_at = ? WHERE id = ?",
      [new Date().toISOString(), id]
    );
  },

  async getByWeek(weekStartDate: string) {
    return db.query(
      `SELECT di.* FROM drift_items di
       JOIN workouts w ON di.source_workout_id = w.id
       WHERE w.date >= ? AND w.date < date(?, '+7 days')
       ORDER BY di.created_at DESC`,
      [weekStartDate, weekStartDate]
    );
  },
};
