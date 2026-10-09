/**
 * @file src/types/adminDashboard.ts
 * @description Strongly-typed schemas for Admin Dashboard statistics, metrics, and recent submission records.
 */

import { WeekStatus } from './index';

/**
 * Condensed student identity for admin submission tables and activity feeds.
 */
export interface AdminSubmissionStudentInfo {
  id: string;
  full_name: string;
  matric_number: string | null;
  department: string | null;
  institution: string | null;
  organisation: string | null;
  email: string;
}

/**
 * Single recent weekly report submission item displayed on the Admin Dashboard.
 */
export interface AdminRecentSubmission {
  id: string;
  week_number: number;
  status: WeekStatus;
  submitted_at: string | null;
  updated_at: string;
  student: AdminSubmissionStudentInfo | null;
}

/**
 * Institutional cohort department breakdown item.
 */
export interface DepartmentMetric {
  department: string;
  count: number;
  percentage: number;
}

/**
 * High-level system metrics aggregated for administrators.
 */
export interface AdminDashboardMetrics {
  totalStudents: number;
  totalWeeks: number;
  submittedReportsCount: number; // Pending review queue
  approvedReportsCount: number;
  returnedReportsCount: number;
  draftReportsCount: number;
  totalActivitiesLogged: number;
  recentSubmissions: AdminRecentSubmission[];
  departmentBreakdown: DepartmentMetric[];
}
