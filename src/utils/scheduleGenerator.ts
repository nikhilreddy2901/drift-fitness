/**
 * Smart Weekly Schedule Generator
 * Generates an intelligent training schedule based on user preferences
 */

import { addDays, format } from 'date-fns';
import type { MuscleGroup } from '../types';

export interface PlannedSession {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  date: string; // YYYY-MM-DD format
  muscleGroup: MuscleGroup;
  dayName: string; // "Mon", "Tue", etc.
}

export interface WeeklySchedule {
  push: PlannedSession[];
  pull: PlannedSession[];
  legs: PlannedSession[];
}

/**
 * Generates a smart weekly training schedule based on user's goal
 *
 * @param weekStartDate - ISO string of week start (Monday)
 * @param trainingDaysPerWeek - Number of training days (3-7)
 * @param goal - User's fitness goal (strength, hypertrophy, endurance, general)
 * @returns WeeklySchedule with planned sessions for each muscle group
 */
export function generateWeeklySchedule(
  weekStartDate: string,
  trainingDaysPerWeek: number,
  goal: string = 'hypertrophy'
): WeeklySchedule {
  const startDate = new Date(weekStartDate);

  // Goal-based schedule templates
  // Key format: "goal-days" (e.g., "strength-4")
  const scheduleTemplates: Record<string, MuscleGroup[]> = {
    // STRENGTH: Prioritize compound lifts (legs + push heavy movements)
    'strength-3': ['legs', 'push', 'pull'],
    'strength-4': ['legs', 'push', 'pull', 'legs'],
    'strength-5': ['legs', 'push', 'pull', 'legs', 'push'],
    'strength-6': ['legs', 'push', 'pull', 'legs', 'push', 'pull'],
    'strength-7': ['legs', 'push', 'pull', 'legs', 'push', 'pull', 'legs'],

    // HYPERTROPHY: Balanced split for muscle growth
    'hypertrophy-3': ['push', 'pull', 'legs'],
    'hypertrophy-4': ['push', 'pull', 'legs', 'push'],
    'hypertrophy-5': ['push', 'pull', 'legs', 'push', 'pull'],
    'hypertrophy-6': ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
    'hypertrophy-7': ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'push'],

    // ENDURANCE: Higher frequency, balanced distribution
    'endurance-3': ['push', 'pull', 'legs'],
    'endurance-4': ['push', 'pull', 'legs', 'pull'],
    'endurance-5': ['push', 'pull', 'legs', 'push', 'pull'],
    'endurance-6': ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
    'endurance-7': ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'pull'],

    // GENERAL FITNESS: Balanced, lower-body emphasis for functional fitness
    'general-3': ['push', 'pull', 'legs'],
    'general-4': ['push', 'pull', 'legs', 'legs'],
    'general-5': ['push', 'pull', 'legs', 'push', 'legs'],
    'general-6': ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
    'general-7': ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'legs'],
  };

  // Get the template for this goal and training frequency
  const templateKey = `${goal}-${trainingDaysPerWeek}`;
  const template = scheduleTemplates[templateKey] || scheduleTemplates[`hypertrophy-${trainingDaysPerWeek}`] || scheduleTemplates['hypertrophy-6'];

  // Generate planned sessions
  const schedule: WeeklySchedule = {
    push: [],
    pull: [],
    legs: [],
  };

  template.forEach((muscleGroup, index) => {
    const sessionDate = addDays(startDate, index);
    const dayOfWeek = sessionDate.getDay();
    const dayName = format(sessionDate, 'EEE'); // Mon, Tue, Wed, etc.
    const dateString = format(sessionDate, 'yyyy-MM-dd');

    const session: PlannedSession = {
      dayOfWeek,
      date: dateString,
      muscleGroup,
      dayName,
    };

    schedule[muscleGroup].push(session);
  });

  return schedule;
}

/**
 * Converts a WeeklySchedule to a JSON-serializable format for database storage
 */
export function serializeSchedule(schedule: WeeklySchedule): string {
  return JSON.stringify(schedule);
}

/**
 * Parses a stored schedule from JSON
 */
export function deserializeSchedule(scheduleJson: string): WeeklySchedule {
  try {
    return JSON.parse(scheduleJson);
  } catch (error) {
    console.error('[ScheduleGenerator] Failed to parse schedule:', error);
    // Return empty schedule as fallback
    return { push: [], pull: [], legs: [] };
  }
}
