/**
 * @file src/services/profileService.ts
 * @description Student Profile service managing Supabase queries, updates, validation, and duration calculations.
 * 
 * Architectural & Security Rules:
 * 1. Operates solely using client-safe public Supabase anon key under Row Level Security (RLS).
 * 2. Whitelist updates: Never attempts to update 'id', 'role', 'email', or 'created_at'.
 * 3. Sanitizes all inputs (trims whitespace, maps empty strings to null).
 * 4. Normalizes database constraint errors (unique matric, date inversion, RLS rejections) into user-friendly messages.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  ProfileRow,
  ServiceResult,
  UpdateStudentProfileInput,
  StudentProfileFormData,
  ProfileValidationErrors,
} from '@/types';

/**
 * Normalizes PostgreSQL / Supabase errors from the profiles table into clean user messages.
 */
export function formatProfileDatabaseError(error: unknown): string {
  if (!error) return 'An unexpected error occurred while saving your profile.';

  const message = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String((error as { message: unknown }).message) : String(error);
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';

  // Unique constraint violation (e.g., matric_number)
  if (code === '23505' || message.toLowerCase().includes('matric_number') || message.includes('profiles_matric_number_key')) {
    return 'The matriculation number entered is already registered to another student account.';
  }

  // Check constraint: SIWES end date cannot be before start date
  if (code === '23514' && (message.includes('check_siwes_dates') || message.includes('siwes_end_date'))) {
    return 'SIWES completion date must be on or after the commencement date.';
  }

  // Check constraint: matric required for student
  if (code === '23514' && message.includes('check_matric_if_student')) {
    return 'A valid matriculation number is required for student profiles.';
  }

  // Row Level Security (RLS) violation
  if (code === '42501' || message.includes('row-level security') || message.includes('violates row-level security policy')) {
    return 'Security policy violation: You are only authorized to update your own student profile.';
  }

  // Network or connectivity issue
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to connect to the database. Please check your network connection and try again.';
  }

  return message;
}

/**
 * Retrieves the full profile record for a student by their Supabase user ID.
 */
export async function getStudentProfile(userId: string): Promise<ServiceResult<ProfileRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: formatProfileDatabaseError(error),
        success: false,
      };
    }

    if (!data) {
      return {
        data: null,
        error: 'Profile record not found for this student account.',
        success: false,
      };
    }

    return {
      data: data as ProfileRow,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatProfileDatabaseError(err),
      success: false,
    };
  }
}

/**
 * Updates a student profile record subject to strict schema constraints and RLS.
 * Enforces field whitelisting to safeguard immutable fields (id, role, email).
 */
export async function updateStudentProfile(
  userId: string,
  input: UpdateStudentProfileInput
): Promise<ServiceResult<ProfileRow>> {
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
      error: 'Cannot update profile: Missing authenticated user identification.',
      success: false,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      data: null,
      error: 'You are currently offline. Updating your student profile requires an active internet connection.',
      success: false,
    };
  }

  try {
    // Sanitization & Whitelisting:
    // Strictly extract permitted editable fields, trimming whitespace and normalizing empty strings to null
    const sanitizedPayload: Record<string, unknown> = {
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() ? input.phone.trim() : null,
      matric_number: input.matric_number?.trim() ? input.matric_number.trim() : null,
      institution: input.institution?.trim() ? input.institution.trim() : null,
      department: input.department?.trim() ? input.department.trim() : null,
      organisation: input.organisation?.trim() ? input.organisation.trim() : null,
      siwes_start_date: input.siwes_start_date?.trim() ? input.siwes_start_date.trim() : null,
      siwes_end_date: input.siwes_end_date?.trim() ? input.siwes_end_date.trim() : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(sanitizedPayload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      return {
        data: null,
        error: formatProfileDatabaseError(error),
        success: false,
      };
    }

    return {
      data: data as ProfileRow,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatProfileDatabaseError(err),
      success: false,
    };
  }
}

/**
 * Validates the student profile form data client-side prior to network submission.
 */
export function validateStudentProfileForm(
  formData: StudentProfileFormData
): { isValid: boolean; errors: ProfileValidationErrors } {
  const errors: ProfileValidationErrors = {};

  // 1. Full Name Validation
  const trimmedName = formData.full_name.trim();
  if (!trimmedName) {
    errors.full_name = 'Full name is required.';
  } else if (trimmedName.length < 2) {
    errors.full_name = 'Full name must be at least 2 characters.';
  } else if (trimmedName.length > 100) {
    errors.full_name = 'Full name cannot exceed 100 characters.';
  }

  // 2. Matriculation Number Validation (Required for students)
  const trimmedMatric = formData.matric_number.trim();
  if (!trimmedMatric) {
    errors.matric_number = 'Matriculation number is required for student accounts.';
  } else if (trimmedMatric.length < 3) {
    errors.matric_number = 'Matriculation number must be at least 3 characters.';
  } else if (trimmedMatric.length > 50) {
    errors.matric_number = 'Matriculation number cannot exceed 50 characters.';
  }

  // 3. Phone Number Validation (Optional, but validated if supplied)
  const trimmedPhone = formData.phone.trim();
  if (trimmedPhone) {
    // Allows standard national and international formats (e.g. +234 803 123 4567 or 08031234567)
    const phoneRegex = /^[+]?[\d\s-]{7,20}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      errors.phone = 'Please enter a valid telephone number (e.g. 08012345678 or +2348012345678).';
    }
  }

  // 4. Institution Validation
  const trimmedInstitution = formData.institution.trim();
  if (trimmedInstitution && trimmedInstitution.length > 150) {
    errors.institution = 'Institution name cannot exceed 150 characters.';
  }

  // 5. Department Validation
  const trimmedDepartment = formData.department.trim();
  if (trimmedDepartment && trimmedDepartment.length > 120) {
    errors.department = 'Department name cannot exceed 120 characters.';
  }

  // 6. Placement Organisation Validation
  const trimmedOrganisation = formData.organisation.trim();
  if (trimmedOrganisation && trimmedOrganisation.length > 150) {
    errors.organisation = 'Organisation name cannot exceed 150 characters.';
  }

  // 7. Date Validation (ISO YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (formData.siwes_start_date && !dateRegex.test(formData.siwes_start_date)) {
    errors.siwes_start_date = 'Commencement date must be a valid date in YYYY-MM-DD format.';
  }

  if (formData.siwes_end_date && !dateRegex.test(formData.siwes_end_date)) {
    errors.siwes_end_date = 'Completion date must be a valid date in YYYY-MM-DD format.';
  }

  // Compare dates if both are provided and well-formed
  if (
    formData.siwes_start_date &&
    formData.siwes_end_date &&
    dateRegex.test(formData.siwes_start_date) &&
    dateRegex.test(formData.siwes_end_date)
  ) {
    const start = new Date(formData.siwes_start_date);
    const end = new Date(formData.siwes_end_date);

    if (isNaN(start.getTime())) {
      errors.siwes_start_date = 'Invalid calendar date for commencement.';
    }
    if (isNaN(end.getTime())) {
      errors.siwes_end_date = 'Invalid calendar date for completion.';
    }

    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
      errors.siwes_end_date = 'Completion date cannot precede the SIWES commencement date.';
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}

/**
 * Calculates SIWES duration in weeks and days given start and end date strings.
 */
export function calculateSiwesDuration(
  startDateStr: string | null | undefined,
  endDateStr: string | null | undefined
): {
  weeks: number;
  days: number;
  totalDays: number;
  isValid: boolean;
  summaryText: string;
} {
  if (!startDateStr || !endDateStr) {
    return {
      weeks: 0,
      days: 0,
      totalDays: 0,
      isValid: false,
      summaryText: 'Dates not specified',
    };
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return {
      weeks: 0,
      days: 0,
      totalDays: 0,
      isValid: false,
      summaryText: 'Invalid date sequence',
    };
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of end date
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  let summaryText: string;
  if (weeks > 0 && days > 0) {
    summaryText = `${weeks} ${weeks === 1 ? 'week' : 'weeks'}, ${days} ${days === 1 ? 'day' : 'days'} (${totalDays} days)`;
  } else if (weeks > 0) {
    summaryText = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} (${totalDays} days)`;
  } else {
    summaryText = `${days} ${days === 1 ? 'day' : 'days'}`;
  }

  return {
    weeks,
    days,
    totalDays,
    isValid: true,
    summaryText,
  };
}
