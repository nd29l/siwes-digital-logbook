/**
 * @file src/types/weeklyReport.ts
 * @description Strongly-typed schemas for Weekly Report compilation, submission workflow, and status validation.
 */

import { LogbookWeekRow, DailyActivityRow, DaySlotInfo, WeekStatus } from './index';

/**
 * Summary data for a weekly report including day slot mapping and activity counts.
 */
export interface WeeklyReportSummary {
  week: LogbookWeekRow;
  activities: DailyActivityRow[];
  daySlots: DaySlotInfo[];
  totalDaysLogged: number;
  isComplete: boolean; // all 5 days logged
  hasAtLeastOneActivity: boolean;
  isEditable: boolean; // status is 'draft' or 'returned'
  isSubmittable: boolean; // draft/returned AND hasAtLeastOneActivity
  weekStartDate: string; // Monday date
  weekEndDate: string; // Friday date
}

/**
 * Client submission payload with student confirmation.
 */
export interface WeeklySubmissionInput {
  weekId: string;
  confirmedDeclaration: boolean;
}

/**
 * Submission validation results with user guidance.
 */
export interface WeeklyReportValidation {
  canSubmit: boolean;
  warnings: string[];
  errors: string[];
}
