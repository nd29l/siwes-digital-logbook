/**
 * @file src/services/remarksFeedbackService.ts
 * @description Dedicated service for querying, creating, and updating supervisor remarks and
 * student correction feedback backed by the logbook_weeks table under Row-Level Security.
 * 
 * Architectural & Security Rules:
 * 1. Strictly client-safe: Operates through public Supabase client under Row-Level Security (RLS).
 * 2. Administrative authorization: Updating remarks/feedback requires public.is_admin() privilege.
 * 3. Student isolation: Students can only read feedback records associated with their own student_id.
 * 4. Data integrity: Does not duplicate tables; utilizes existing admin_remark and admin_feedback columns.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  AdminFeedbackItem,
  StudentFeedbackItem,
  UpdateReportRemarksInput,
  FeedbackFilterOptions,
  ReportStudentSummary,
  ServiceResult,
  LogbookWeekRow,
} from '@/types';
import { notifyStudentOnFeedbackAdded } from './notificationService';

/**
 * Normalizes PostgreSQL errors into user-friendly messages.
 */
export function formatFeedbackError(error: unknown): string {
  if (!error) return 'An unexpected error occurred while processing remarks and feedback.';

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
    return 'Security Policy: Only authorized supervisors and SIWES administrators may create or edit remarks.';
  }

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to connect to the database server. Please check your network connection and try again.';
  }

  return message;
}

/**
 * Retrieves the directory of supervisor remarks and student correction feedback for administrators.
 */
export async function getAdminRemarksList(
  filters?: Partial<FeedbackFilterOptions>
): Promise<ServiceResult<AdminFeedbackItem[]>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  try {
    // 1. Fetch weeks that have feedback or have been reviewed/submitted
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

    // Status / type filter at DB query level if specific
    if (filters?.feedbackType === 'returned') {
      query = query.eq('status', 'returned');
    } else if (filters?.feedbackType === 'approved') {
      query = query.eq('status', 'approved');
    }

    const { data: rawWeeks, error: queryError } = await query.order('updated_at', {
      ascending: false,
    });

    if (queryError) {
      return {
        data: null,
        error: formatFeedbackError(queryError),
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

    // 2. Fetch reviewer profiles in batch for reviewer names
    const reviewerIds = Array.from(
      new Set(rawWeeks.map((w) => w.reviewed_by).filter(Boolean))
    ) as string[];

    const reviewerMap = new Map<string, string>();
    if (reviewerIds.length > 0) {
      const { data: reviewers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', reviewerIds);

      (reviewers || []).forEach((r) => {
        reviewerMap.set(r.id, r.full_name);
      });
    }

    // 3. Transform to AdminFeedbackItem
    let items: AdminFeedbackItem[] = rawWeeks.map((row) => {
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
        reviewer_name: row.reviewed_by ? reviewerMap.get(row.reviewed_by) || 'Supervisor' : null,
      };
    });

    // 4. Apply feedbackType filter if 'all_with_feedback'
    if (filters?.feedbackType === 'all_with_feedback') {
      items = items.filter((item) => Boolean(item.admin_remark || item.admin_feedback));
    }

    // 5. In-memory Search & Department Filters
    if (filters) {
      const { searchQuery, department, sortBy } = filters;

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        items = items.filter((item) => {
          const nameMatch = item.student?.full_name?.toLowerCase().includes(q) ?? false;
          const matricMatch = item.student?.matric_number?.toLowerCase().includes(q) ?? false;
          const deptMatch = item.student?.department?.toLowerCase().includes(q) ?? false;
          const remarkMatch = item.admin_remark?.toLowerCase().includes(q) ?? false;
          const feedbackMatch = item.admin_feedback?.toLowerCase().includes(q) ?? false;
          const weekMatch = `week ${item.week_number}`.includes(q) || `${item.week_number}` === q;

          return nameMatch || matricMatch || deptMatch || remarkMatch || feedbackMatch || weekMatch;
        });
      }

      if (department && department !== 'all') {
        items = items.filter((item) => item.student?.department === department);
      }

      if (sortBy) {
        items.sort((a, b) => {
          switch (sortBy) {
            case 'reviewed_asc': {
              const dateA = a.reviewed_at ? new Date(a.reviewed_at).getTime() : 0;
              const dateB = b.reviewed_at ? new Date(b.reviewed_at).getTime() : 0;
              return dateA - dateB;
            }
            case 'week_desc':
              return b.week_number - a.week_number;
            case 'student_asc':
              return (a.student?.full_name || '').localeCompare(b.student?.full_name || '');
            case 'reviewed_desc':
            default: {
              const dateA = a.reviewed_at
                ? new Date(a.reviewed_at).getTime()
                : new Date(a.updated_at).getTime();
              const dateB = b.reviewed_at
                ? new Date(b.reviewed_at).getTime()
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
      error: formatFeedbackError(err),
      success: false,
    };
  }
}

/**
 * Updates administrator remarks and/or correction feedback on a weekly report.
 * Validates administrative permissions and preserves existing report activities.
 */
export async function updateReportRemarks(
  adminUserId: string,
  input: UpdateReportRemarksInput
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
      error: 'Missing administrator identification or week ID parameter.',
      success: false,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      data: null,
      error: 'You are currently offline. Saving supervisor remarks requires an active internet connection.',
      success: false,
    };
  }

  try {
    // 1. Fetch current week to ensure existence and preserve metadata
    const { data: currentWeek, error: checkError } = await supabase
      .from('logbook_weeks')
      .select('id, student_id, week_number, status, submitted_at, reviewed_at')
      .eq('id', input.weekId)
      .single();

    if (checkError || !currentWeek) {
      return {
        data: null,
        error: checkError ? formatFeedbackError(checkError) : 'Report record not found.',
        success: false,
      };
    }

    // Review timestamp: preserve existing or set to now
    const reviewedTimestamp = currentWeek.reviewed_at || new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      admin_remark: input.admin_remark !== undefined ? (input.admin_remark?.trim() || null) : undefined,
      admin_feedback: input.admin_feedback !== undefined ? (input.admin_feedback?.trim() || null) : undefined,
      reviewed_at: reviewedTimestamp,
      reviewed_by: adminUserId,
      updated_at: new Date().toISOString(),
    };

    // Clean undefined keys
    Object.keys(updatePayload).forEach((k) => {
      if (updatePayload[k] === undefined) delete updatePayload[k];
    });

    const { data: updatedWeek, error: updateError } = await supabase
      .from('logbook_weeks')
      .update(updatePayload)
      .eq('id', input.weekId)
      .select('*')
      .single();

    if (updateError) {
      return {
        data: null,
        error: formatFeedbackError(updateError),
        success: false,
      };
    }

    // Dispatch feedback notification to student asynchronously
    const remarksSnippet = input.admin_remark || input.admin_feedback || 'New remarks added.';
    notifyStudentOnFeedbackAdded(
      currentWeek.student_id,
      adminUserId,
      currentWeek.week_number,
      input.weekId,
      remarksSnippet
    ).catch(() => {});

    return {
      data: updatedWeek as LogbookWeekRow,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatFeedbackError(err),
      success: false,
    };
  }
}

/**
 * Retrieves the full feedback history for an authenticated student's own reports.
 * Enforces RLS student_id = auth.uid().
 */
export async function getStudentFeedbackHistory(
  studentId: string
): Promise<ServiceResult<StudentFeedbackItem[]>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (!studentId) {
    return {
      data: null,
      error: 'Missing student identifier.',
      success: false,
    };
  }

  try {
    const { data: weeks, error } = await supabase
      .from('logbook_weeks')
      .select('id, week_number, status, admin_remark, admin_feedback, reviewed_at, reviewed_by')
      .eq('student_id', studentId)
      .or('admin_remark.is.not.null,admin_feedback.is.not.null,status.in.(returned,approved)')
      .order('week_number', { ascending: false });

    if (error) {
      return {
        data: null,
        error: formatFeedbackError(error),
        success: false,
      };
    }

    if (!weeks || weeks.length === 0) {
      return {
        data: [],
        error: null,
        success: true,
      };
    }

    // Fetch reviewer names in batch
    const reviewerIds = Array.from(new Set(weeks.map((w) => w.reviewed_by).filter(Boolean))) as string[];
    const reviewerMap = new Map<string, string>();

    if (reviewerIds.length > 0) {
      const { data: reviewers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', reviewerIds);

      (reviewers || []).forEach((r) => {
        reviewerMap.set(r.id, r.full_name);
      });
    }

    const items: StudentFeedbackItem[] = weeks.map((w) => ({
      week_id: w.id,
      week_number: w.week_number,
      status: w.status,
      admin_remark: w.admin_remark,
      admin_feedback: w.admin_feedback,
      reviewed_at: w.reviewed_at,
      reviewer_name: w.reviewed_by ? reviewerMap.get(w.reviewed_by) || 'Institutional Supervisor' : null,
    }));

    return {
      data: items,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatFeedbackError(err),
      success: false,
    };
  }
}
