-- ============================================================================
-- MIGRATION: Add name field to user_profile table
-- Date: 2025-12-08
-- ============================================================================

-- ============================================================================
-- FOR SUPABASE (PostgreSQL) - RUN THIS MANUALLY:
-- ============================================================================
-- Copy and paste this into your Supabase SQL Editor and execute it:

ALTER TABLE user_profile ADD COLUMN name TEXT;

-- ============================================================================
-- FOR LOCAL SQLite DATABASE:
-- ============================================================================
-- This migration is handled automatically by the app's migration system
-- (see src/db/migrations.ts - Version 3)
-- No manual action needed for local database!
