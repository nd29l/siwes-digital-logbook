/**
 * @file src/types/reportReview.ts
 * @description Strongly-typed schemas for Admin Weekly Report Review, endorsement,
 * returning for correction, status filtering, and activity inspection.
 */

import { WeekStatus, DailyActivityRow, ProfileRow } from './index';

/**
 * Condensed student info attached to a weekly report for review list.
 */
export interface ReportStudentSummary {
  id: string;
  full_name: string;
  matric_number: string | null;
  department: string | null;
  institution: string | null;
  organisation: string | null;
  email: string;
  siwes_start_date: string | null;
  siwes_end_date: string | null;
}

/**
 * Weekly report item displayed in the Administrator Review Queue table.
 */
export interface AdminReportReviewItem {
  id: string;
  student_id: string;
  week_number: number;
  status: WeekStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_remark: string | null;
  admin_feedback: string | null;
  created_at: string;
  updated_at: string;
  student: ReportStudentSummary | null;
  activity_count: number;
}

/**
 * Deep inspection payload for an administrator reviewing a single weekly report.
 */
export interface AdminReportDetailView {
  id: string;
  student_id: string;
  week_number: number;
  status: WeekStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_remark: string | null;
  admin_feedback: string | null;
  created_at: string;
  updated_at: string;
  student: ReportStudentSummary | null;
  activities: DailyActivityRow[];
  reviewer: ProfileRow | null;
}

/**
 * Allowed status filter values for the review queue.
 */
export type ReportFilterStatus = 'all' | 'submitted' | 'approved' | 'returned' | 'draft';

/**
 * Filter and search criteria for the admin report review list.
 */
export interface ReportFilterOptions {
  searchQuery: string;
  status: ReportFilterStatus;
  department: string;
  sortBy: 'submitted_desc' | 'submitted_asc' | 'week_desc' | 'student_asc';
}

/**
 * Input payload for approving a weekly report.
 */
export interface ApproveReportInput {
  weekId: string;
  adminRemark?: string;
}

/**
 * Input payload for returning a weekly report for student correction.
 */
export interface ReturnReportInput {
  weekId: string;
  returnReason: string;
}
