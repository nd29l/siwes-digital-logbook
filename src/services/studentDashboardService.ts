/**
 * @file src/services/studentDashboardService.ts
 * @description Service for querying student dashboard metrics, logbook progress summaries,
 * and computing real-time SIWES timeline milestones.
 * 
 * Architectural & Security Rules:
 * 1. Strictly client-safe: Uses public Supabase client under Row-Level Security (RLS).
 * 2. Scoped to authenticated student: Always enforces student_id = auth.uid().
 * 3. Minimal data transfer: Fetches only summary data and week metadata; avoids loading heavy daily logs.
 * 4. Error normalization: Translates raw network/DB exceptions into clean user-friendly feedback.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  LogbookWeekRow,
  ProfileRow,
  ServiceResult,
  StudentDashboardMetrics,
  SiwesTimelineInfo,
  SiwesTimelineStatus,
} from '@/types';

/**
 * Normalizes database error codes into user-friendly error messages.
 */
export function formatDashboardDatabaseError(error: unknown): string {
  if (!error) return 'An unexpected error occurred while loading dashboard metrics.';

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  if (code === '42501' || message.includes('row-level security') || message.includes('policy')) {
    return 'Security policy: You can only view logbook data belonging to your student account.';
  }

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to reach the database server. Please check your network connection and try again.';
  }

  return message;
}

/**
 * Parses an ISO date string (YYYY-MM-DD) into a timezone-neutral Date at midnight.
 */
function parseIsoDateToLocalMidnight(dateStr: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const d = new Date(year, month, day, 0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Computes the real-time SIWES placement timeline metrics, elapsed days,
 * remaining days, percentage completed, and current internship week number.
 */
export function calculateSiwesTimeline(
  startDateStr: string | null | undefined,
  endDateStr: string | null | undefined
): SiwesTimelineInfo {
  if (!startDateStr || !endDateStr) {
    return {
      status: 'not_configured',
      statusLabel: 'Placement Dates Not Set',
      startDate: null,
      endDate: null,
      totalWeeks: 0,
      totalDays: 0,
      elapsedDays: 0,
      remainingDays: 0,
      percentElapsed: 0,
      currentWeekNumber: null,
    };
  }

  const start = parseIsoDateToLocalMidnight(startDateStr);
  const end = parseIsoDateToLocalMidnight(endDateStr);

  if (!start || !end || end < start) {
    return {
      status: 'not_configured',
      statusLabel: 'Invalid Date Range',
      startDate: startDateStr,
      endDate: endDateStr,
      totalWeeks: 0,
      totalDays: 0,
      elapsedDays: 0,
      remainingDays: 0,
      percentElapsed: 0,
      currentWeekNumber: null,
    };
  }

  // Today at midnight
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const oneDayMs = 1000 * 60 * 60 * 24;
  const totalDays = Math.round((end.getTime() - start.getTime()) / oneDayMs) + 1; // inclusive
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

  let status: SiwesTimelineStatus;
  let statusLabel: string;
  let elapsedDays: number;
  let remainingDays: number;
  let percentElapsed: number;
  let currentWeekNumber: number | null;

  if (today < start) {
    // Upcoming placement
    status = 'upcoming';
    const daysUntil = Math.round((start.getTime() - today.getTime()) / oneDayMs);
    statusLabel = daysUntil === 1 ? 'Starts tomorrow' : `Starts in ${daysUntil} days`;
    elapsedDays = 0;
    remainingDays = totalDays;
    percentElapsed = 0;
    currentWeekNumber = null;
  } else if (today > end) {
    // Completed placement
    status = 'completed';
    statusLabel = 'Placement Completed';
    elapsedDays = totalDays;
    remainingDays = 0;
    percentElapsed = 100;
    currentWeekNumber = totalWeeks;
  } else {
    // In progress
    status = 'in_progress';
    elapsedDays = Math.round((today.getTime() - start.getTime()) / oneDayMs) + 1;
    remainingDays = Math.max(0, Math.round((end.getTime() - today.getTime()) / oneDayMs));
    percentElapsed = Math.min(100, Math.max(1, Math.round((elapsedDays / totalDays) * 100)));
    currentWeekNumber = Math.min(totalWeeks, Math.floor((elapsedDays - 1) / 7) + 1);
    statusLabel = `Active — Week ${currentWeekNumber} of ${totalWeeks}`;
  }

  return {
    status,
    statusLabel,
    startDate: startDateStr,
    endDate: endDateStr,
    totalWeeks,
    totalDays,
    elapsedDays,
    remainingDays,
    percentElapsed,
    currentWeekNumber,
  };
}

/**
 * Evaluates profile completeness and flags missing required or recommended fields.
 */
export function checkStudentProfileCompleteness(profile: ProfileRow | null | undefined): {
  isComplete: boolean;
  missingFields: string[];
} {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: ['Full Profile Record'],
    };
  }

  const missing: string[] = [];

  if (!profile.matric_number?.trim()) missing.push('Matriculation Number');
  if (!profile.institution?.trim()) missing.push('Institution');
  if (!profile.department?.trim()) missing.push('Department');
  if (!profile.organisation?.trim()) missing.push('Placement Organisation');
  if (!profile.siwes_start_date?.trim()) missing.push('SIWES Start Date');
  if (!profile.siwes_end_date?.trim()) missing.push('SIWES End Date');
  if (!profile.phone?.trim()) missing.push('Phone Number');

  return {
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Fetches aggregated student dashboard metrics:
 * - Total daily activities count
 * - Total weekly reports count
 * - Status counts (draft, submitted, approved, returned)
 * - Up to 5 recent weekly reports
 */
export async function getStudentDashboardMetrics(
  userId: string
): Promise<ServiceResult<StudentDashboardMetrics>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (!userId) {
    return {
      data: null,
      error: 'Missing student user identification.',
      success: false,
    };
  }

  try {
    // 1. Fetch weekly reports metadata for this student
    const weeksQuery = await supabase
      .from('logbook_weeks')
      .select('id, student_id, week_number, status, submitted_at, reviewed_at, reviewed_by, admin_remark, admin_feedback, created_at, updated_at')
      .eq('student_id', userId)
      .order('week_number', { ascending: false });

    if (weeksQuery.error) {
      return {
        data: null,
        error: formatDashboardDatabaseError(weeksQuery.error),
        success: false,
      };
    }

    const weeks = (weeksQuery.data || []) as LogbookWeekRow[];

    // 2. Fetch total count of daily activities recorded by this student
    const activitiesQuery = await supabase
      .from('daily_activities')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', userId);

    if (activitiesQuery.error) {
      return {
        data: null,
        error: formatDashboardDatabaseError(activitiesQuery.error),
        success: false,
      };
    }

    const totalActivities = activitiesQuery.count || 0;

    // 3. Compute metric distributions
    const draftCount = weeks.filter((w) => w.status === 'draft').length;
    const submittedCount = weeks.filter((w) => w.status === 'submitted').length;
    const approvedCount = weeks.filter((w) => w.status === 'approved').length;
    const returnedCount = weeks.filter((w) => w.status === 'returned').length;

    const metrics: StudentDashboardMetrics = {
      totalActivitiesLogged: totalActivities,
      totalWeeksCreated: weeks.length,
      draftWeeksCount: draftCount,
      submittedWeeksCount: submittedCount,
      approvedWeeksCount: approvedCount,
      returnedWeeksCount: returnedCount,
      recentWeeks: weeks.slice(0, 5),
    };

    return {
      data: metrics,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatDashboardDatabaseError(err),
      success: false,
    };
  }
}
