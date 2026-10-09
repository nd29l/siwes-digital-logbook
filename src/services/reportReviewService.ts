/**
 * @file src/services/reportReviewService.ts
 * @description Directorate service for querying submitted weekly reports, deep activity inspection,
 * approving reports, and returning reports for student corrections under Row-Level Security.
 * 
 * Architectural & Security Rules:
 * 1. Strictly client-safe: Operates through public Supabase client under Row-Level Security (RLS).
 * 2. Strictly Admin-Authorized: Enforces public.is_admin() checks in PostgreSQL RLS.
 * 3. Status Lifecycle Enforcement:
 *    - Only 'submitted' (or 'returned') reports can be approved.
 *    - Only 'submitted' reports can be returned for corrections.
 *    - Returned reports require an explicit return reason in admin_feedback.
 *    - Approved reports are sealed and cannot be approved repeatedly.
 * 4. Data Preservation: Preserves historical daily activities and student logbook entries.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  AdminReportReviewItem,
  AdminReportDetailView,
  ApproveReportInput,
  ReturnReportInput,
  ReportFilterOptions,
  ReportStudentSummary,
  ServiceResult,
  LogbookWeekRow,
  DailyActivityRow,
  ProfileRow,
} from '@/types';
import {
  notifyStudentOnReportApproval,
  notifyStudentOnReportReturn,
} from './notificationService';

/**
 * Normalizes PostgreSQL database and RLS errors into clear administrative guidance.
 */
export function formatReportReviewError(error: unknown): string {
  if (!error) return 'An unexpected error occurred while processing the report review.';

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

  // RLS error: caller is not an administrator
  if (code === '42501' || message.includes('row-level security') || message.includes('policy')) {
    return 'Security Policy: Access restricted to authorized SIWES Directorate administrators. Students cannot review or endorse reports.';
  }

  // Check constraint violations on metadata
  if (code === '23514' && message.includes('check_review_metadata')) {
    return 'Invalid review metadata: Review timestamp and administrator ID must both be recorded.';
  }

  if (code === '23514' && message.includes('check_submitted_metadata')) {
    return 'Invalid submission status: Submitted or reviewed reports must maintain their submission timestamp.';
  }

  // Network error
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to reach the database server. Please check your network connection and try again.';
  }

  return message;
}

/**
 * Retrieves the list of weekly reports for review with student details, activity counts,
 * and filtering options.
 */
export async function getAdminReportsList(
  filters?: Partial<ReportFilterOptions>
): Promise<ServiceResult<AdminReportReviewItem[]>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  try {
    // 1. Query weekly reports joined with student profiles
    let query = supabase
      .from('logbook_weeks')
      .select(`
        id,
        student_id,
        week_number,
        status,
        submitted_at,
        reviewed_at,
        reviewed_by,
        admin_remark,
        admin_feedback,
        created_at,
        updated_at,
        student:profiles!logbook_weeks_student_id_fkey (
          id,
          full_name,
          matric_number,
          department,
          institution,
          organisation,
          email,
          siwes_start_date,
          siwes_end_date
        )
      `);

    // Apply database-level status filter if specified and not 'all'
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data: rawWeeks, error: weeksError } = await query.order('updated_at', {
      ascending: false,
    });

    if (weeksError) {
      return {
        data: null,
        error: formatReportReviewError(weeksError),
        success: false,
      };
    }

    if (!rawWeeks || rawWeeks.length === 0) {
      return {
        data: [],
        error: null,
        success: true,
      };
    }

    // 2. Fetch daily activity counts for all fetched weeks in one query
    const weekIds = rawWeeks.map((w) => w.id);
    const { data: activities, error: actError } = await supabase
      .from('daily_activities')
      .select('week_id')
      .in('week_id', weekIds);

    if (actError) {
      console.warn('[reportReviewService] Failed to load activity counts:', actError.message);
    }

    // Map activity counts by week_id
    const countByWeek = new Map<string, number>();
    (activities || []).forEach((a) => {
      countByWeek.set(a.week_id, (countByWeek.get(a.week_id) || 0) + 1);
    });

    // 3. Transform to AdminReportReviewItem
    let items: AdminReportReviewItem[] = rawWeeks.map((row) => {
      const studentObj = Array.isArray(row.student)
        ? row.student[0] || null
        : row.student || null;

      const studentSummary: ReportStudentSummary | null = studentObj
        ? {
            id: studentObj.id,
            full_name: studentObj.full_name,
            matric_number: studentObj.matric_number,
            department: studentObj.department,
            institution: studentObj.institution,
            organisation: studentObj.organisation,
            email: studentObj.email,
            siwes_start_date: studentObj.siwes_start_date,
            siwes_end_date: studentObj.siwes_end_date,
          }
        : null;

      return {
        id: row.id,
        student_id: row.student_id,
        week_number: row.week_number,
        status: row.status,
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        reviewed_by: row.reviewed_by,
        admin_remark: row.admin_remark,
        admin_feedback: row.admin_feedback,
        created_at: row.created_at,
        updated_at: row.updated_at,
        student: studentSummary,
        activity_count: countByWeek.get(row.id) || 0,
      };
    });

    // 4. Apply in-memory search and department filters
    if (filters) {
      const { searchQuery, department, sortBy } = filters;

      // Search Query filter
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        items = items.filter((item) => {
          const nameMatch = item.student?.full_name?.toLowerCase().includes(q) ?? false;
          const emailMatch = item.student?.email?.toLowerCase().includes(q) ?? false;
          const matricMatch = item.student?.matric_number?.toLowerCase().includes(q) ?? false;
          const deptMatch = item.student?.department?.toLowerCase().includes(q) ?? false;
          const orgMatch = item.student?.organisation?.toLowerCase().includes(q) ?? false;
          const weekMatch = `week ${item.week_number}`.includes(q) || `${item.week_number}` === q;

          return nameMatch || emailMatch || matricMatch || deptMatch || orgMatch || weekMatch;
        });
      }

      // Department filter
      if (department && department !== 'all') {
        items = items.filter((item) => item.student?.department === department);
      }

      // Sorting
      if (sortBy) {
        items.sort((a, b) => {
          switch (sortBy) {
            case 'submitted_asc': {
              const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
              const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
              return dateA - dateB;
            }
            case 'week_desc':
              return b.week_number - a.week_number;
            case 'student_asc': {
              const nameA = a.student?.full_name || '';
              const nameB = b.student?.full_name || '';
              return nameA.localeCompare(nameB);
            }
            case 'submitted_desc':
            default: {
              const dateA = a.submitted_at
                ? new Date(a.submitted_at).getTime()
                : new Date(a.updated_at).getTime();
              const dateB = b.submitted_at
                ? new Date(b.submitted_at).getTime()
                : new Date(b.updated_at).getTime();
              return dateB - dateA;
            }
          }
        });
      }
    }

    return {
      data: items,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatReportReviewError(err),
      success: false,
    };
  }
}

/**
 * Retrieves full details of a specific weekly report including all recorded daily activities
 * and reviewer information for deep inspection.
 */
export async function getAdminReportDetails(
  weekId: string
): Promise<ServiceResult<AdminReportDetailView>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (!weekId) {
    return {
      data: null,
      error: 'Missing report week identifier.',
      success: false,
    };
  }

  try {
    // 1. Fetch weekly report row with student profile
    const { data: weekRow, error: weekError } = await supabase
      .from('logbook_weeks')
      .select(`
        id,
        student_id,
        week_number,
        status,
        submitted_at,
        reviewed_at,
        reviewed_by,
        admin_remark,
        admin_feedback,
        created_at,
        updated_at,
        student:profiles!logbook_weeks_student_id_fkey (
          id,
          full_name,
          matric_number,
          department,
          institution,
          organisation,
          email,
          siwes_start_date,
          siwes_end_date
        )
      `)
      .eq('id', weekId)
      .single();

    if (weekError || !weekRow) {
      return {
        data: null,
        error: weekError ? formatReportReviewError(weekError) : 'Report record not found.',
        success: false,
      };
    }

    // 2. Fetch daily activities for this week
    const { data: activities, error: actError } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('week_id', weekId)
      .order('activity_date', { ascending: true });

    if (actError) {
      return {
        data: null,
        error: `Failed to load daily activities: ${actError.message}`,
        success: false,
      };
    }

    // 3. Fetch reviewer profile if report was reviewed
    let reviewerProfile: ProfileRow | null = null;
    if (weekRow.reviewed_by) {
      const { data: reviewerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', weekRow.reviewed_by)
        .maybeSingle();

      reviewerProfile = (reviewerData as ProfileRow) || null;
    }

    const studentObj = Array.isArray(weekRow.student)
      ? weekRow.student[0] || null
      : weekRow.student || null;

    const studentSummary: ReportStudentSummary | null = studentObj
      ? {
          id: studentObj.id,
          full_name: studentObj.full_name,
          matric_number: studentObj.matric_number,
          department: studentObj.department,
          institution: studentObj.institution,
          organisation: studentObj.organisation,
          email: studentObj.email,
          siwes_start_date: studentObj.siwes_start_date,
          siwes_end_date: studentObj.siwes_end_date,
        }
      : null;

    const detailView: AdminReportDetailView = {
      id: weekRow.id,
      student_id: weekRow.student_id,
      week_number: weekRow.week_number,
      status: weekRow.status,
      submitted_at: weekRow.submitted_at,
      reviewed_at: weekRow.reviewed_at,
      reviewed_by: weekRow.reviewed_by,
      admin_remark: weekRow.admin_remark,
      admin_feedback: weekRow.admin_feedback,
      created_at: weekRow.created_at,
      updated_at: weekRow.updated_at,
      student: studentSummary,
      activities: (activities || []) as DailyActivityRow[],
      reviewer: reviewerProfile,
    };

    return {
      data: detailView,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatReportReviewError(err),
      success: false,
    };
  }
}

/**
 * Endorses and approves an eligible weekly logbook report.
 * Enforces status transition: only 'submitted' (or previously 'returned') reports can be approved.
 * Updates status to 'approved', sets reviewed_at to current timestamp, and sets reviewed_by to administrator ID.
 */
export async function approveWeeklyReport(
  adminUserId: string,
  input: ApproveReportInput
): Promise<ServiceResult<LogbookWeekRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (!adminUserId || !input.weekId) {
    return {
      data: null,
      error: 'Missing required administrator user or week identifier.',
      success: false,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      data: null,
      error: 'You are currently offline. Approving weekly reports requires an active internet connection.',
      success: false,
    };
  }

  try {
    // 1. Fetch current status to enforce valid lifecycle transition
    const { data: currentWeek, error: checkError } = await supabase
      .from('logbook_weeks')
      .select('id, student_id, week_number, status, submitted_at')
      .eq('id', input.weekId)
      .single();

    if (checkError || !currentWeek) {
      return {
        data: null,
        error: checkError ? formatReportReviewError(checkError) : 'Report not found.',
        success: false,
      };
    }

    if (currentWeek.status === 'approved') {
      return {
        data: null,
        error: 'This weekly report has already been endorsed and approved.',
        success: false,
      };
    }

    if (currentWeek.status === 'draft') {
      return {
        data: null,
        error: 'Cannot approve a draft report. The student must formally compile and submit the weekly report first.',
        success: false,
      };
    }

    // Ensure submitted_at is preserved to satisfy database constraint check_submitted_metadata
    const submittedTimestamp = currentWeek.submitted_at || new Date().toISOString();

    // 2. Perform administrative approval update
    const updatePayload: Record<string, unknown> = {
      status: 'approved',
      submitted_at: submittedTimestamp,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
      admin_remark: input.adminRemark?.trim() ? input.adminRemark.trim() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedWeek, error: updateError } = await supabase
      .from('logbook_weeks')
      .update(updatePayload)
      .eq('id', input.weekId)
      .select('*')
      .single();

    if (updateError) {
      return {
        data: null,
        error: formatReportReviewError(updateError),
        success: false,
      };
    }

    // Dispatch approval notification to student asynchronously
    notifyStudentOnReportApproval(
      currentWeek.student_id,
      adminUserId,
      currentWeek.week_number,
      input.weekId,
      input.adminRemark
    ).catch(() => {});

    return {
      data: updatedWeek as LogbookWeekRow,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatReportReviewError(err),
      success: false,
    };
  }
}

/**
 * Returns a weekly logbook report to the student for corrections.
 * Enforces status transition: only 'submitted' reports can be returned.
 * Requires a constructive return reason explaining required revisions.
 */
export async function returnWeeklyReport(
  adminUserId: string,
  input: ReturnReportInput
): Promise<ServiceResult<LogbookWeekRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (!adminUserId || !input.weekId) {
    return {
      data: null,
      error: 'Missing required administrator user or week identifier.',
      success: false,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      data: null,
      error: 'You are currently offline. Returning weekly reports requires an active internet connection.',
      success: false,
    };
  }

  const reason = input.returnReason?.trim();
  if (!reason || reason.length < 5) {
    return {
      data: null,
      error: 'Please provide a clear reason for returning the report (minimum 5 characters).',
      success: false,
    };
  }

  try {
    // 1. Fetch current status to enforce valid lifecycle transition
    const { data: currentWeek, error: checkError } = await supabase
      .from('logbook_weeks')
      .select('id, student_id, week_number, status, submitted_at')
      .eq('id', input.weekId)
      .single();

    if (checkError || !currentWeek) {
      return {
        data: null,
        error: checkError ? formatReportReviewError(checkError) : 'Report not found.',
        success: false,
      };
    }

    if (currentWeek.status === 'draft') {
      return {
        data: null,
        error: 'Cannot return a draft report. The student has not submitted this report yet.',
        success: false,
      };
    }

    if (currentWeek.status === 'approved') {
      return {
        data: null,
        error: 'Cannot return a finalized, approved report without directorate re-evaluation.',
        success: false,
      };
    }

    const submittedTimestamp = currentWeek.submitted_at || new Date().toISOString();

    // 2. Perform administrative return update
    const updatePayload: Record<string, unknown> = {
      status: 'returned',
      submitted_at: submittedTimestamp,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
      admin_feedback: reason,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedWeek, error: updateError } = await supabase
      .from('logbook_weeks')
      .update(updatePayload)
      .eq('id', input.weekId)
      .select('*')
      .single();

    if (updateError) {
      return {
        data: null,
        error: formatReportReviewError(updateError),
        success: false,
      };
    }

    // Dispatch return notification to student asynchronously
    notifyStudentOnReportReturn(
      currentWeek.student_id,
      adminUserId,
      currentWeek.week_number,
      input.weekId,
      reason
    ).catch(() => {});

    return {
      data: updatedWeek as LogbookWeekRow,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatReportReviewError(err),
      success: false,
    };
  }
}
