/**
 * @file src/types/logbook.ts
 * @description Strongly-typed schemas for Logbook Weeks, Daily Activities, and Form Validation.
 */

import { LogbookWeekRow, DailyActivityRow, SiwesDay, WeekStatus } from './index';

/**
 * Payload for recording a new daily activity in a specific week.
 * Enforces ownership and relationship to the student's week.
 */
export interface CreateDailyActivityInput {
  week_id: string;
  day: SiwesDay;
  activity_date: string; // ISO Date YYYY-MM-DD
  title: string;
  activity: string;
  equipment_used?: string | null;
}

/**
 * Payload for updating an existing daily activity.
 * Note: day and activity_date remain tied to the designated cycle slot.
 */
export interface UpdateDailyActivityInput {
  title: string;
  activity: string;
  equipment_used?: string | null;
}

/**
 * Client-side form state for recording or modifying daily technical work.
 */
export interface DailyActivityFormData {
  title: string;
  activity: string;
  equipment_used: string;
  activity_date: string;
  day: SiwesDay;
}

/**
 * Client-side field-level validation errors for daily activity entry.
 */
export interface ActivityValidationErrors {
  title?: string;
  activity?: string;
  equipment_used?: string;
  activity_date?: string;
  day?: string;
  general?: string;
}

/**
 * Complete weekly bundle with activities mapped across the 5 working days.
 */
export interface WeekWithActivities {
  week: LogbookWeekRow;
  activities: DailyActivityRow[];
  isEditable: boolean;
}

/**
 * Slot representation for each of the 5 work days (Monday - Friday).
 */
export interface DaySlotInfo {
  day: SiwesDay;
  dateStr: string; // ISO YYYY-MM-DD
  formattedDate: string;
  activity: DailyActivityRow | null;
  isLogged: boolean;
}

/**
 * Status filter or navigation state for logbook weeks.
 */
export interface LogbookNavigationState {
  selectedWeekNumber: number;
  availableWeeks: LogbookWeekRow[];
  currentWeek: LogbookWeekRow | null;
  weekStatus: WeekStatus | null;
  isEditable: boolean;
}
