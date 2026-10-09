/**
 * @file src/types/remarksFeedback.ts
 * @description Strongly-typed schemas for Admin & Student Remarks, Feedback, and Supervisor Endorsements.
 */

import { WeekStatus, ProfileRow } from './index';
import { ReportStudentSummary } from './reportReview';

/**
 * Enhanced report feedback record for administrative tracking and management.
 */
export interface AdminFeedbackItem {
  id: string; // week ID
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
  reviewer_name?: string | null;
}

/**
 * Student-facing feedback record detailing supervisor comments on a specific report.
 */
export interface StudentFeedbackItem {
  week_id: string;
  week_number: number;
  status: WeekStatus;
  admin_remark: string | null;
  admin_feedback: string | null;
  reviewed_at: string | null;
  reviewer_name: string | null;
}

/**
 * Input payload for creating or updating administrative remarks on a report.
 */
export interface UpdateReportRemarksInput {
  weekId: string;
  admin_remark?: string | null;
  admin_feedback?: string | null;
}

/**
 * Filter criteria for the administrative remarks & feedback directory.
 */
export interface FeedbackFilterOptions {
  searchQuery: string;
  feedbackType: 'all' | 'returned' | 'approved' | 'all_with_feedback';
  department: string;
  sortBy: 'reviewed_desc' | 'reviewed_asc' | 'week_desc' | 'student_asc';
}
