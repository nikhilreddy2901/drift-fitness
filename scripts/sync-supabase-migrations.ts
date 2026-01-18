/**
 * Development Script: Auto-apply pending Supabase migrations
 *
 * Usage: npm run migrate:supabase
 *
 * This script automatically applies any pending migrations in supabase/migrations/
 * to your local/remote Supabase instance during development.
 *
 * For production, you should still manually review and apply migrations.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Admin key

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables: EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Migration {
  file: string;
  version: number;
  name: string;
  sql: string;
}

/**
 * Get all migration files from supabase/migrations/
 */
function getMigrationFiles(): Migration[] {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found');
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Alphabetical = chronological (001_, 002_, etc.)

  return files.map(file => {
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) {
      throw new Error(`Invalid migration filename: ${file}`);
    }

    const [, version, name] = match;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    return {
      file,
      version: parseInt(version, 10),
      name,
      sql,
    };
  });
}

/**
 * Get applied migrations from Supabase
 * (Supabase tracks migrations in schema_migrations table)
 */
async function getAppliedMigrations(): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .order('version');

    if (error) {
      // Table doesn't exist yet - create it
      if (error.code === '42P01') {
        console.log('📋 Creating schema_migrations table...');
        await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS schema_migrations (
              version INTEGER PRIMARY KEY,
              name TEXT NOT NULL,
              applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        });
        return [];
      }
      throw error;
    }

    return data?.map(d => d.version) || [];
  } catch (error) {
    console.error('❌ Error fetching applied migrations:', error);
    return [];
  }
}

/**
 * Apply a single migration
 */
async function applyMigration(migration: Migration): Promise<void> {
  console.log(`📝 Applying migration ${migration.version}: ${migration.name}...`);

  try {
    // Execute the migration SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: migration.sql
    });

    if (sqlError) {
      throw sqlError;
    }

    // Record migration as applied
    const { error: recordError } = await supabase
      .from('schema_migrations')
      .insert({
        version: migration.version,
        name: migration.name,
      });

    if (recordError) {
      throw recordError;
    }

    console.log(`✅ Migration ${migration.version} applied successfully`);
  } catch (error) {
    console.error(`❌ Failed to apply migration ${migration.version}:`, error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Syncing Supabase migrations...\n');

  // Get all migrations
  const allMigrations = getMigrationFiles();
  console.log(`📁 Found ${allMigrations.length} migration file(s)`);

  if (allMigrations.length === 0) {
    console.log('✨ No migrations to apply');
    return;
  }

  // Get applied migrations
  const appliedVersions = await getAppliedMigrations();
  console.log(`✅ ${appliedVersions.length} migration(s) already applied\n`);

  // Find pending migrations
  const pendingMigrations = allMigrations.filter(
    m => !appliedVersions.includes(m.version)
  );

  if (pendingMigrations.length === 0) {
    console.log('✨ Database is up to date');
    return;
  }

  console.log(`🔄 Applying ${pendingMigrations.length} pending migration(s)...\n`);

  // Apply each pending migration
  for (const migration of pendingMigrations) {
    await applyMigration(migration);
  }

  console.log('\n✨ All migrations applied successfully!');
}

// Run the script
main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
