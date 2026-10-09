/**
 * @file src/types/profile.ts
 * @description Strongly-typed schemas for student profile viewing, editing, and form validation.
 */

import { ProfileRow, UserRole } from './index';

/**
 * Payload allowed for student profile updates.
 * Security Note: Strictly excludes id, role, email, and created_at.
 */
export interface UpdateStudentProfileInput {
  full_name: string;
  phone?: string | null;
  matric_number?: string | null;
  institution?: string | null;
  department?: string | null;
  organisation?: string | null;
  siwes_start_date?: string | null;
  siwes_end_date?: string | null;
}

/**
 * Client-side form field state for editing student profile.
 */
export interface StudentProfileFormData {
  full_name: string;
  phone: string;
  matric_number: string;
  institution: string;
  department: string;
  organisation: string;
  siwes_start_date: string;
  siwes_end_date: string;
}

/**
 * Client-side form validation error map.
 */
export interface ProfileValidationErrors {
  full_name?: string;
  phone?: string;
  matric_number?: string;
  institution?: string;
  department?: string;
  organisation?: string;
  siwes_start_date?: string;
  siwes_end_date?: string;
  general?: string;
}

/**
 * Detailed profile summary model with calculated metrics.
 */
export interface StudentProfileSummary {
  profile: ProfileRow;
  role: UserRole;
  durationWeeks?: number | null;
  durationDays?: number | null;
  isDateRangeValid: boolean;
  completionPercentage: number;
}
