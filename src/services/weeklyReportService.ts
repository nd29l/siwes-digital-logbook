/**
 * @file src/services/weeklyReportService.ts
 * @description Service for managing student weekly report compilation, validation, and formal submission.
 * 
 * Architectural & Security Rules:
 * 1. Strictly client-safe: Operates through public Supabase client under Row-Level Security (RLS).
 * 2. Enforces Student Ownership: Always validates student_id = auth.uid().
 * 3. Enforces Status Lifecycle: Only 'draft' and 'returned' reports can be submitted.
 * 4. Submission Immutability: Once submitted, the report transitions to 'submitted' state with a timestamp.
 * 5. Minimum Submission Requirement: Requires at least one daily activity logged for the week.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  LogbookWeekRow,
  DailyActivityRow,
  ServiceResult,
  WeeklyReportValidation,
} from '@/types';
import { formatLogbookDatabaseError } from './logbookService';
import { notifyAdminsOnReportSubmission } from './notificationService';

/**
 * Validates a weekly report for readiness to submit.
 */
export function validateWeeklyReportSubmission(
  week: LogbookWeekRow | null | undefined,
  activities: DailyActivityRow[]
): WeeklyReportValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!week) {
    errors.push('No logbook week selected.');
    return { canSubmit: false, errors, warnings };
  }

  // 1. Status check: Can only submit draft or returned weeks
  if (week.status === 'submitted') {
    errors.push('This weekly report has already been submitted and is currently awaiting supervisor review.');
  } else if (week.status === 'approved') {
    errors.push('This weekly report has already been approved and endorsed. No further submissions are allowed.');
  } else if (week.status !== 'draft' && week.status !== 'returned') {
    errors.push(`Invalid report status "${week.status}". Only draft or returned reports may be submitted.`);
  }

  // 2. Minimum activity count check
  if (!activities || activities.length === 0) {
    errors.push('You must record at least one daily activity for this week before submitting your weekly report.');
  } else if (activities.length < 5) {
    warnings.push(
      `You have recorded ${activities.length} of 5 working days (Monday - Friday). If you had holidays or excused absences, you may proceed, but ensure all applicable tasks are documented.`
    );
  }

  return {
    canSubmit: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Submits a weekly logbook report for supervisor review and administrative endorsement.
 * Transitions status from 'draft' or 'returned' -> 'submitted', sets submitted_at timestamp,
 * and clears previous return remarks if resubmitting.
 */
export async function submitWeeklyReport(
  userId: string,
  weekId: string
): Promise<ServiceResult<LogbookWeekRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (!userId || !weekId) {
    return {
      data: null,
      error: 'Missing student ID or week ID parameter.',
      success: false,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      data: null,
      error: 'You are currently offline. Submitting weekly reports requires an active internet connection.',
      success: false,
    };
  }

  try {
    // 1. Fetch current week row to verify existence and ownership
    const { data: existingWeek, error: fetchError } = await supabase
      .from('logbook_weeks')
      .select('*')
      .eq('id', weekId)
      .eq('student_id', userId)
      .single();

    if (fetchError || !existingWeek) {
      return {
        data: null,
        error: fetchError ? formatLogbookDatabaseError(fetchError) : 'Logbook week not found.',
        success: false,
      };
    }

    const week = existingWeek as LogbookWeekRow;

    if (week.status === 'submitted') {
      return {
        data: null,
        error: 'This weekly report has already been submitted and is awaiting supervisor review.',
        success: false,
      };
    }

    if (week.status === 'approved') {
      return {
        data: null,
        error: 'This weekly report has already been approved and cannot be resubmitted.',
        success: false,
      };
    }

    // 2. Verify that at least one daily activity exists for this week
    const { data: activities, error: actError } = await supabase
      .from('daily_activities')
      .select('id')
      .eq('week_id', weekId)
      .eq('student_id', userId);

    if (actError) {
      return {
        data: null,
        error: formatLogbookDatabaseError(actError),
        success: false,
      };
    }

    if (!activities || activities.length === 0) {
      return {
        data: null,
        error: 'Cannot submit weekly report: You must log at least one daily activity before submitting.',
        success: false,
      };
    }

    // 3. Execute update to transition status to 'submitted'
    // Conforms with PostgreSQL check constraint check_submitted_metadata:
    // (status = 'draft' AND submitted_at IS NULL) OR (status IN ('submitted', 'approved', 'returned') AND submitted_at IS NOT NULL)
    // And complies with RLS policy: resets admin review columns when student transitions to submitted
    const updatePayload = {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      admin_remark: null,
      admin_feedback: null,
      reviewed_at: null,
      reviewed_by: null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedWeek, error: updateError } = await supabase
      .from('logbook_weeks')
      .update(updatePayload)
      .eq('id', weekId)
      .eq('student_id', userId)
      .select('*')
      .single();

    if (updateError) {
      return {
        data: null,
        error: formatLogbookDatabaseError(updateError),
        success: false,
      };
    }

    // Dispatch notification to administrators asynchronously
    try {
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      const studentName = studentProfile?.full_name || 'A student';
      await notifyAdminsOnReportSubmission(
        userId,
        studentName,
        week.week_number,
        weekId
      );
    } catch {
      // Non-blocking notification dispatch
    }

    return {
      data: updatedWeek as LogbookWeekRow,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatLogbookDatabaseError(err),
      success: false,
    };
  }
}
