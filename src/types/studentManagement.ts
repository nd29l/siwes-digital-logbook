/**
 * @file src/types/studentManagement.ts
 * @description Strongly-typed schemas for Admin Student Account Management, directory listings,
 * filtering, student provisioning, and administrative profile updates.
 */

import { ProfileRow, LogbookWeekRow } from './index';

/**
 * Summary metrics of a student's SIWES training progress.
 */
export interface StudentSiwesStats {
  totalWeeksInitialized: number;
  submittedWeeksCount: number;
  approvedWeeksCount: number;
  returnedWeeksCount: number;
  draftWeeksCount: number;
  totalActivitiesCount: number;
  placementStatus: 'not_configured' | 'pending' | 'in_progress' | 'completed';
  statusLabel: string;
}

/**
 * Enhanced student record displayed in the Admin Student Directory list.
 */
export interface AdminStudentListItem {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  matric_number: string | null;
  institution: string | null;
  department: string | null;
  organisation: string | null;
  siwes_start_date: string | null;
  siwes_end_date: string | null;
  created_at: string;
  updated_at: string;
  stats: StudentSiwesStats;
}

/**
 * Full details of a student account loaded for the deep-dive inspection drawer.
 */
export interface AdminStudentDetailView {
  profile: ProfileRow;
  stats: StudentSiwesStats;
  weeks: LogbookWeekRow[];
}

/**
 * Input payload for provisioning a new student account by an administrator.
 */
export interface CreateStudentAccountInput {
  email: string;
  password: string;
  full_name: string;
  matric_number: string;
  phone?: string;
  institution?: string;
  department?: string;
  organisation?: string;
  siwes_start_date?: string;
  siwes_end_date?: string;
}

/**
 * Input payload for updating permitted student fields by an administrator.
 */
export interface UpdateStudentAdminInput {
  full_name: string;
  matric_number: string;
  phone?: string;
  institution?: string;
  department?: string;
  organisation?: string;
  siwes_start_date?: string;
  siwes_end_date?: string;
}

/**
 * Filter and search options for the student directory.
 */
export interface StudentFilterOptions {
  searchQuery: string;
  department: string;
  placementStatus: 'all' | 'configured' | 'pending';
  sortBy: 'name_asc' | 'name_desc' | 'created_desc' | 'matric_asc';
}

/**
 * Client-side validation errors for student account management forms.
 */
export interface StudentManagementValidationErrors {
  email?: string;
  password?: string;
  full_name?: string;
  matric_number?: string;
  phone?: string;
  institution?: string;
  department?: string;
  organisation?: string;
  siwes_start_date?: string;
  siwes_end_date?: string;
  general?: string;
}
