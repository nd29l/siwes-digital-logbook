/**
 * @file src/types/dashboard.ts
 * @description Strongly-typed schemas for Student Dashboard metrics, SIWES timeline calculations, and status overviews.
 */

import { LogbookWeekRow } from './database';

/**
 * High-level logbook metrics aggregated for the authenticated student.
 */
export interface StudentDashboardMetrics {
  totalActivitiesLogged: number;
  totalWeeksCreated: number;
  draftWeeksCount: number;
  submittedWeeksCount: number;
  approvedWeeksCount: number;
  returnedWeeksCount: number;
  recentWeeks: LogbookWeekRow[];
}

/**
 * Calculated SIWES placement timeline metrics and progress status.
 */
export type SiwesTimelineStatus = 'not_configured' | 'upcoming' | 'in_progress' | 'completed';

export interface SiwesTimelineInfo {
  status: SiwesTimelineStatus;
  statusLabel: string;
  startDate: string | null;
  endDate: string | null;
  totalWeeks: number;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  percentElapsed: number;
  currentWeekNumber: number | null;
}

/**
 * Complete dashboard state bundle loaded on landing.
 */
export interface StudentDashboardData {
  metrics: StudentDashboardMetrics;
  timeline: SiwesTimelineInfo;
  isProfileComplete: boolean;
  missingProfileFields: string[];
}
