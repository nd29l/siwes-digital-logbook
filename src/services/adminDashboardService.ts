/**
 * @file src/services/adminDashboardService.ts
 * @description Service for querying institutional SIWES metrics, report submission queues,
 * and student cohort statistics for the Admin Dashboard.
 * 
 * Architectural & Security Rules:
 * 1. Strictly client-safe: Operates through public Supabase client under Row-Level Security (RLS).
 * 2. Strictly Admin-Authorized: Enforces public.is_admin() database RLS policy checks.
 * 3. Efficient Aggregations: Leverages Supabase head/count queries to minimize network transfer.
 * 4. Error Normalization: Converts raw database and permission exceptions into clean guidance.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  AdminDashboardMetrics,
  AdminRecentSubmission,
  DepartmentMetric,
  ServiceResult,
  WeekStatus,
} from '@/types';

/**
 * Normalizes PostgreSQL error codes and constraints into clear user guidance.
 */
export function formatAdminDatabaseError(error: unknown): string {
  if (!error) return 'An unexpected error occurred while loading administrative metrics.';

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

  // RLS violation: user is not an administrator
  if (code === '42501' || message.includes('row-level security') || message.includes('policy')) {
    return 'Security Policy: Access restricted to authorized SIWES administrators. Student accounts cannot view Directorate metrics.';
  }

  // Network error
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to reach the database server. Please check your network connection and try again.';
  }

  return message;
}

/**
 * Retrieves aggregate system metrics, submission counts, and recent submission records
 * for the Administrator Dashboard.
 */
export async function getAdminDashboardMetrics(
  adminUserId: string
): Promise<ServiceResult<AdminDashboardMetrics>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (!adminUserId) {
    return {
      data: null,
      error: 'Missing administrator user identification.',
      success: false,
    };
  }

  try {
    // Execute parallel queries for counts and recent activity
    const [
      studentsCountRes,
      totalWeeksRes,
      submittedWeeksRes,
      approvedWeeksRes,
      returnedWeeksRes,
      draftWeeksRes,
      totalActivitiesRes,
      recentSubmissionsRes,
      departmentsRes,
    ] = await Promise.all([
      // 1. Total registered students
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student'),

      // 2. Total logbook weeks initialized
      supabase
        .from('logbook_weeks')
        .select('*', { count: 'exact', head: true }),

      // 3. Pending submitted reports awaiting review
      supabase
        .from('logbook_weeks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted'),

      // 4. Approved reports
      supabase
        .from('logbook_weeks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved'),

      // 5. Returned reports requiring corrections
      supabase
        .from('logbook_weeks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'returned'),

      // 6. Draft reports in progress
      supabase
        .from('logbook_weeks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft'),

      // 7. Total daily technical activities recorded
      supabase
        .from('daily_activities')
        .select('*', { count: 'exact', head: true }),

      // 8. Recent report submissions & logbook activity
      supabase
        .from('logbook_weeks')
        .select(`
          id,
          week_number,
          status,
          submitted_at,
          updated_at,
          student_id,
          student:profiles!logbook_weeks_student_id_fkey (
            id,
            full_name,
            matric_number,
            department,
            institution,
            organisation,
            email
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(10),

      // 9. Department distribution for students
      supabase
        .from('profiles')
        .select('department')
        .eq('role', 'student'),
    ]);

    // Check for fatal errors in primary count queries
    if (studentsCountRes.error) {
      return {
        data: null,
        error: formatAdminDatabaseError(studentsCountRes.error),
        success: false,
      };
    }

    if (totalWeeksRes.error) {
      return {
        data: null,
        error: formatAdminDatabaseError(totalWeeksRes.error),
        success: false,
      };
    }

    // Process recent submissions safely
    const rawSubmissions = (recentSubmissionsRes.data || []) as Array<{
      id: string;
      week_number: number;
      status: WeekStatus;
      submitted_at: string | null;
      updated_at: string;
      student_id: string;
      student: {
        id: string;
        full_name: string;
        matric_number: string | null;
        department: string | null;
        institution: string | null;
        organisation: string | null;
        email: string;
      } | Array<{
        id: string;
        full_name: string;
        matric_number: string | null;
        department: string | null;
        institution: string | null;
        organisation: string | null;
        email: string;
      }> | null;
    }>;

    const recentSubmissions: AdminRecentSubmission[] = rawSubmissions.map((row) => {
      // Normalize student object if Supabase returns single or array
      const studentObj = Array.isArray(row.student)
        ? row.student[0] || null
        : row.student || null;

      return {
        id: row.id,
        week_number: row.week_number,
        status: row.status,
        submitted_at: row.submitted_at,
        updated_at: row.updated_at,
        student: studentObj,
      };
    });

    // Compute department distribution
    const departmentCounts: Record<string, number> = {};
    const studentProfiles = departmentsRes.data || [];
    const totalStudentRows = studentProfiles.length;

    studentProfiles.forEach((p) => {
      const dept = p.department?.trim() || 'General / Unspecified';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    const departmentBreakdown: DepartmentMetric[] = Object.entries(departmentCounts)
      .map(([department, count]) => ({
        department,
        count,
        percentage: totalStudentRows > 0 ? Math.round((count / totalStudentRows) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const metrics: AdminDashboardMetrics = {
      totalStudents: studentsCountRes.count ?? 0,
      totalWeeks: totalWeeksRes.count ?? 0,
      submittedReportsCount: submittedWeeksRes.count ?? 0,
      approvedReportsCount: approvedWeeksRes.count ?? 0,
      returnedReportsCount: returnedWeeksRes.count ?? 0,
      draftReportsCount: draftWeeksRes.count ?? 0,
      totalActivitiesLogged: totalActivitiesRes.count ?? 0,
      recentSubmissions,
      departmentBreakdown,
    };

    return {
      data: metrics,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatAdminDatabaseError(err),
      success: false,
    };
  }
}
