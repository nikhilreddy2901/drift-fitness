-- Migration: Add planned_schedule column to weekly_progress table
-- Created: 2025-01-08
-- Description: Adds smart weekly scheduling feature

ALTER TABLE weekly_progress
ADD COLUMN IF NOT EXISTS planned_schedule TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN weekly_progress.planned_schedule IS 'JSON object storing smart weekly schedule: {push: [{dayOfWeek, date, muscleGroup, dayName}], pull: [...], legs: [...]}';
