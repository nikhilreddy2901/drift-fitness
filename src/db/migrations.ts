/**
 * Database Migration System
 * Automatically applies schema changes on app startup
 */

import { db } from './client';

// Current database version
const CURRENT_VERSION = 3;

interface Migration {
  version: number;
  name: string;
  up: () => Promise<void>;
}

// Define all migrations here
const migrations: Migration[] = [
  {
    version: 1,
    name: 'Initial schema',
    up: async () => {
      // Initial schema is already created by schema.ts
      console.log('[Migrations] Version 1: Initial schema already exists');
    },
  },
  {
    version: 2,
    name: 'Add planned_schedule to weekly_progress',
    up: async () => {
      console.log('[Migrations] Version 2: Adding planned_schedule column...');

      // Check if column already exists
      const tableInfo = await db.query(
        "PRAGMA table_info(weekly_progress)"
      );

      const hasColumn = (tableInfo as any[]).some(
        (col: any) => col.name === 'planned_schedule'
      );

      if (!hasColumn) {
        await db.execute(
          'ALTER TABLE weekly_progress ADD COLUMN planned_schedule TEXT'
        );
        console.log('[Migrations] Version 2: planned_schedule column added');
      } else {
        console.log('[Migrations] Version 2: planned_schedule column already exists');
      }
    },
  },
  {
    version: 3,
    name: 'Add name to user_profile',
    up: async () => {
      console.log('[Migrations] Version 3: Adding name column to user_profile...');

      // Check if column already exists
      const tableInfo = await db.query(
        "PRAGMA table_info(user_profile)"
      );

      const hasColumn = (tableInfo as any[]).some(
        (col: any) => col.name === 'name'
      );

      if (!hasColumn) {
        await db.execute(
          'ALTER TABLE user_profile ADD COLUMN name TEXT'
        );
        console.log('[Migrations] Version 3: name column added');
      } else {
        console.log('[Migrations] Version 3: name column already exists');
      }
    },
  },
];

/**
 * Get current database version from user_version pragma
 */
async function getCurrentVersion(): Promise<number> {
  const result = await db.query('PRAGMA user_version');
  return (result[0] as any).user_version || 0;
}

/**
 * Set database version
 */
async function setVersion(version: number): Promise<void> {
  await db.execute(`PRAGMA user_version = ${version}`);
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    const currentVersion = await getCurrentVersion();
    console.log(`[Migrations] Current database version: ${currentVersion}`);
    console.log(`[Migrations] Target database version: ${CURRENT_VERSION}`);

    if (currentVersion === CURRENT_VERSION) {
      console.log('[Migrations] Database is up to date');
      return;
    }

    if (currentVersion > CURRENT_VERSION) {
      console.warn(
        '[Migrations] Database version is newer than app version! This may cause issues.'
      );
      return;
    }

    // Run pending migrations
    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        console.log(`[Migrations] Running migration ${migration.version}: ${migration.name}`);
        await migration.up();
        await setVersion(migration.version);
        console.log(`[Migrations] Migration ${migration.version} completed`);
      }
    }

    console.log('[Migrations] All migrations completed successfully');
  } catch (error) {
    console.error('[Migrations] Migration failed:', error);
    throw error;
  }
}
