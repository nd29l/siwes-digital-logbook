/**
 * @file src/services/studentManagementService.ts
 * @description Administrative service for managing student accounts, querying directory cohorts,
 * provisioning new student Auth/Profile accounts, and updating permitted profile fields.
 * 
 * Architectural & Security Rules:
 * 1. Strictly client-safe: Operates through public Supabase client under Row-Level Security (RLS).
 * 2. Administrative authorization: Enforces public.is_admin() checks.
 * 3. Auth provisioning: Attempts secure server-side Edge Function ('create-student') first,
 *    falling back to ephemeral non-persisted client registration without clobbering admin session.
 * 4. Password safety: Never writes passwords to public.profiles; passwords solely reside in auth.users.
 * 5. Data integrity: Preserves historical logbook weeks and daily activities on profile updates.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  AdminStudentListItem,
  AdminStudentDetailView,
  CreateStudentAccountInput,
  UpdateStudentAdminInput,
  StudentFilterOptions,
  StudentManagementValidationErrors,
  StudentSiwesStats,
  ServiceResult,
  ProfileRow,
  LogbookWeekRow,
} from '@/types';
import { formatProfileDatabaseError } from './profileService';

/**
 * Normalizes student account database and auth errors into friendly user messages.
 */
export function formatStudentManagementError(error: unknown): string {
  if (!error) return 'An unexpected error occurred while processing student record.';

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

  // Duplicate matric number
  if (
    code === '23505' &&
    (message.includes('matric_number') || message.includes('profiles_matric_number_key'))
  ) {
    return 'The matriculation number entered is already assigned to another student.';
  }

  // Duplicate email
  if (
    message.includes('User already registered') ||
    message.includes('already exists') ||
    (code === '23505' && message.includes('email'))
  ) {
    return 'A student account with this email address already exists.';
  }

  // Check constraint: SIWES end date must be after start date
  if (code === '23514' && message.includes('check_siwes_dates')) {
    return 'SIWES completion date must be on or after the commencement date.';
  }

  // Check constraint: matric required
  if (code === '23514' && message.includes('check_matric_if_student')) {
    return 'A valid matriculation number is required for student profiles.';
  }

  // RLS error
  if (code === '42501' || message.includes('row-level security') || message.includes('policy')) {
    return 'Security policy: Only authorized administrators can manage student accounts.';
  }

  // Network error
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to reach the database server. Please check your network connection and try again.';
  }

  return message;
}

/**
 * Helper to compute SIWES training statistics for a student from their logbook weeks.
 */
function computeStudentSiwesStats(
  profile: ProfileRow,
  weeks: LogbookWeekRow[]
): StudentSiwesStats {
  const totalWeeks = weeks.length;
  const submittedWeeks = weeks.filter((w) => w.status === 'submitted').length;
  const approvedWeeks = weeks.filter((w) => w.status === 'approved').length;
  const returnedWeeks = weeks.filter((w) => w.status === 'returned').length;
  const draftWeeks = weeks.filter((w) => w.status === 'draft').length;

  const isConfigured = Boolean(
    profile.organisation?.trim() &&
    profile.siwes_start_date &&
    profile.siwes_end_date
  );

  let placementStatus: StudentSiwesStats['placementStatus'];
  let statusLabel: string;

  if (!isConfigured) {
    placementStatus = 'pending';
    statusLabel = 'Placement Unset';
  } else if (approvedWeeks >= 20 || (totalWeeks > 0 && approvedWeeks === totalWeeks)) {
    placementStatus = 'completed';
    statusLabel = 'Completed';
  } else if (totalWeeks > 0 || submittedWeeks > 0) {
    placementStatus = 'in_progress';
    statusLabel = 'In Progress';
  } else {
    placementStatus = 'in_progress';
    statusLabel = 'Ready to Log';
  }

  return {
    totalWeeksInitialized: totalWeeks,
    submittedWeeksCount: submittedWeeks,
    approvedWeeksCount: approvedWeeks,
    returnedWeeksCount: returnedWeeks,
    draftWeeksCount: draftWeeks,
    totalActivitiesCount: totalWeeks * 5, // Estimated baseline
    placementStatus,
    statusLabel,
  };
}

/**
 * Retrieves the comprehensive student directory for administrators with search,
 * department filters, placement status filters, and logbook metrics.
 */
export async function getAdminStudentsList(
  filters?: Partial<StudentFilterOptions>
): Promise<ServiceResult<AdminStudentListItem[]>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  try {
    // 1. Fetch student profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return {
        data: null,
        error: formatStudentManagementError(profilesError),
        success: false,
      };
    }

    if (!profiles || profiles.length === 0) {
      return {
        data: [],
        error: null,
        success: true,
      };
    }

    // 2. Fetch logbook weeks for all students in one query
    const studentIds = profiles.map((p) => p.id);
    const { data: allWeeks, error: weeksError } = await supabase
      .from('logbook_weeks')
      .select('id, student_id, week_number, status, submitted_at, reviewed_at')
      .in('student_id', studentIds);

    if (weeksError) {
      console.warn('[studentManagementService] Failed to load student week statistics:', weeksError.message);
    }

    // Group weeks by student_id
    const weeksByStudent = new Map<string, LogbookWeekRow[]>();
    (allWeeks || []).forEach((w) => {
      const existing = weeksByStudent.get(w.student_id) || [];
      existing.push(w as LogbookWeekRow);
      weeksByStudent.set(w.student_id, existing);
    });

    // 3. Map to AdminStudentListItem
    let items: AdminStudentListItem[] = profiles.map((p) => {
      const studentWeeks = weeksByStudent.get(p.id) || [];
      const stats = computeStudentSiwesStats(p as ProfileRow, studentWeeks);

      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        phone: p.phone,
        matric_number: p.matric_number,
        institution: p.institution,
        department: p.department,
        organisation: p.organisation,
        siwes_start_date: p.siwes_start_date,
        siwes_end_date: p.siwes_end_date,
        created_at: p.created_at,
        updated_at: p.updated_at,
        stats,
      };
    });

    // 4. Apply filters client-side
    if (filters) {
      const { searchQuery, department, placementStatus, sortBy } = filters;

      // Search Query filter
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        items = items.filter((item) => {
          return (
            item.full_name.toLowerCase().includes(query) ||
            item.email.toLowerCase().includes(query) ||
            (item.matric_number && item.matric_number.toLowerCase().includes(query)) ||
            (item.department && item.department.toLowerCase().includes(query)) ||
            (item.organisation && item.organisation.toLowerCase().includes(query)) ||
            (item.institution && item.institution.toLowerCase().includes(query))
          );
        });
      }

      // Department filter
      if (department && department !== 'all') {
        items = items.filter((item) => item.department === department);
      }

      // Placement status filter
      if (placementStatus && placementStatus !== 'all') {
        if (placementStatus === 'configured') {
          items = items.filter((item) => Boolean(item.organisation && item.siwes_start_date));
        } else if (placementStatus === 'pending') {
          items = items.filter((item) => !item.organisation || !item.siwes_start_date);
        }
      }

      // Sorting
      if (sortBy) {
        items.sort((a, b) => {
          switch (sortBy) {
            case 'name_asc':
              return a.full_name.localeCompare(b.full_name);
            case 'name_desc':
              return b.full_name.localeCompare(a.full_name);
            case 'matric_asc':
              return (a.matric_number || '').localeCompare(b.matric_number || '');
            case 'created_desc':
            default:
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
      error: formatStudentManagementError(err),
      success: false,
    };
  }
}

/**
 * Retrieves the full profile, SIWES placement info, and logbook weeks for a specific student.
 */
export async function getAdminStudentDetails(
  studentId: string
): Promise<ServiceResult<AdminStudentDetailView>> {
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
    // 1. Fetch student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .eq('role', 'student')
      .single();

    if (profileError || !profile) {
      return {
        data: null,
        error: profileError ? formatStudentManagementError(profileError) : 'Student account not found.',
        success: false,
      };
    }

    // 2. Fetch student's logbook weeks
    const { data: weeks, error: weeksError } = await supabase
      .from('logbook_weeks')
      .select('*')
      .eq('student_id', studentId)
      .order('week_number', { ascending: true });

    if (weeksError) {
      return {
        data: null,
        error: formatStudentManagementError(weeksError),
        success: false,
      };
    }

    const logbookWeeks = (weeks || []) as LogbookWeekRow[];
    const stats = computeStudentSiwesStats(profile as ProfileRow, logbookWeeks);

    return {
      data: {
        profile: profile as ProfileRow,
        stats,
        weeks: logbookWeeks,
      },
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatStudentManagementError(err),
      success: false,
    };
  }
}

/**
 * Client-side validation for creating a student account.
 */
export function validateCreateStudentForm(
  input: CreateStudentAccountInput
): { isValid: boolean; errors: StudentManagementValidationErrors } {
  const errors: StudentManagementValidationErrors = {};

  // 1. Full name
  const name = input.full_name?.trim();
  if (!name) {
    errors.full_name = 'Student full name is required.';
  } else if (name.length < 2) {
    errors.full_name = 'Name must be at least 2 characters.';
  }

  // 2. Email
  const email = input.email?.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Please provide a valid email format (e.g. student@institution.edu).';
  }

  // 3. Matriculation Number
  const matric = input.matric_number?.trim();
  if (!matric) {
    errors.matric_number = 'Matriculation number is required.';
  } else if (matric.length < 3) {
    errors.matric_number = 'Matriculation number must be at least 3 characters.';
  }

  // 4. Password
  const password = input.password;
  if (!password) {
    errors.password = 'Initial password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  // 5. SIWES Date Range
  if (input.siwes_start_date && input.siwes_end_date) {
    if (new Date(input.siwes_end_date) < new Date(input.siwes_start_date)) {
      errors.siwes_end_date = 'SIWES end date cannot precede the start date.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Client-side validation for updating a student account.
 */
export function validateUpdateStudentForm(
  input: UpdateStudentAdminInput
): { isValid: boolean; errors: StudentManagementValidationErrors } {
  const errors: StudentManagementValidationErrors = {};

  const name = input.full_name?.trim();
  if (!name) {
    errors.full_name = 'Student full name is required.';
  } else if (name.length < 2) {
    errors.full_name = 'Name must be at least 2 characters.';
  }

  const matric = input.matric_number?.trim();
  if (!matric) {
    errors.matric_number = 'Matriculation number is required.';
  } else if (matric.length < 3) {
    errors.matric_number = 'Matriculation number must be at least 3 characters.';
  }

  if (input.siwes_start_date && input.siwes_end_date) {
    if (new Date(input.siwes_end_date) < new Date(input.siwes_start_date)) {
      errors.siwes_end_date = 'SIWES end date cannot precede the start date.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Provisions a new student account.
 * Uses Edge Function 'create-student' when available.
 * If the Edge Function is unconfigured/offline, gracefully provisions via an ephemeral
 * non-persisted client without clobbering the administrator's active session.
 */
export async function createStudentAccount(
  adminUserId: string,
  input: CreateStudentAccountInput
): Promise<ServiceResult<ProfileRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      data: null,
      error: 'You are currently offline. Provisioning student accounts requires an active internet connection.',
      success: false,
    };
  }

  const validation = validateCreateStudentForm(input);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    return {
      data: null,
      error: firstError || 'Please correct the validation errors in the form.',
      success: false,
    };
  }

  try {
    // 1. Check if matriculation number is already in use
    const { data: existingMatric, error: matricCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('matric_number', input.matric_number.trim())
      .maybeSingle();

    if (existingMatric) {
      return {
        data: null,
        error: `A student account with matriculation number "${input.matric_number.trim()}" already exists.`,
        success: false,
      };
    }

    // 2. Check if email is already in use
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', input.email.trim().toLowerCase())
      .maybeSingle();

    if (existingEmail) {
      return {
        data: null,
        error: `A user account with email "${input.email.trim().toLowerCase()}" already exists.`,
        success: false,
      };
    }

    // 3. Attempt creation via Supabase Edge Function ('create-student')
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('create-student', {
        body: {
          email: input.email.trim().toLowerCase(),
          password: input.password,
          full_name: input.full_name.trim(),
          matric_number: input.matric_number.trim(),
          phone: input.phone?.trim() || null,
          institution: input.institution?.trim() || null,
          department: input.department?.trim() || null,
          organisation: input.organisation?.trim() || null,
          siwes_start_date: input.siwes_start_date || null,
          siwes_end_date: input.siwes_end_date || null,
        },
      });

      if (!edgeError && edgeData && edgeData.student) {
        return {
          data: edgeData.student as ProfileRow,
          error: null,
          success: true,
        };
      }
    } catch {
      // Edge Function not deployed or unreachable in preview environment; proceed to fallback
    }

    // 4. Safe Fallback: Ephemeral non-persisting client for Auth signup
    // CRITICAL: We NEVER expose the service_role key. We use public anon key with persistSession: false,
    // which prevents destroying the administrator's session in localStorage.
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    const ephemeralClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: signUpData, error: signUpError } = await ephemeralClient.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        data: {
          full_name: input.full_name.trim(),
          role: 'student',
          matric_number: input.matric_number.trim(),
        },
      },
    });

    if (signUpError || !signUpData.user) {
      return {
        data: null,
        error: signUpError ? formatStudentManagementError(signUpError) : 'Failed to register authentication account.',
        success: false,
      };
    }

    const newStudentId = signUpData.user.id;

    // 5. Update the student profile with institutional & placement details
    // The database trigger on_auth_user_created automatically inserted the baseline profile row.
    // The admin's authenticated client (supabase) has role = 'admin' and can update any profile.
    const profileUpdatePayload: Record<string, unknown> = {
      full_name: input.full_name.trim(),
      matric_number: input.matric_number.trim(),
      phone: input.phone?.trim() || null,
      institution: input.institution?.trim() || null,
      department: input.department?.trim() || null,
      organisation: input.organisation?.trim() || null,
      siwes_start_date: input.siwes_start_date || null,
      siwes_end_date: input.siwes_end_date || null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update(profileUpdatePayload)
      .eq('id', newStudentId)
      .select('*')
      .maybeSingle();

    if (profileUpdateError) {
      return {
        data: null,
        error: `Account created in Auth, but profile details failed to update: ${profileUpdateError.message}`,
        success: false,
      };
    }

    // If profile row was not yet created by trigger (e.g. trigger delay), insert directly via admin permissions
    if (!updatedProfile) {
      const insertPayload = {
        id: newStudentId,
        email: input.email.trim().toLowerCase(),
        full_name: input.full_name.trim(),
        role: 'student',
        matric_number: input.matric_number.trim(),
        phone: input.phone?.trim() || null,
        institution: input.institution?.trim() || null,
        department: input.department?.trim() || null,
        organisation: input.organisation?.trim() || null,
        siwes_start_date: input.siwes_start_date || null,
        siwes_end_date: input.siwes_end_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: insertedProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(insertPayload)
        .select('*')
        .single();

      if (insertError) {
        return {
          data: null,
          error: `Account created, but profile failed to save: ${insertError.message}`,
          success: false,
        };
      }

      return {
        data: insertedProfile as ProfileRow,
        error: null,
        success: true,
      };
    }

    return {
      data: updatedProfile as ProfileRow,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatStudentManagementError(err),
      success: false,
    };
  }
}

/**
 * Updates permitted student information by an administrator.
 * Preserves historical logbooks, immutable UUID, and role.
 */
export async function updateStudentByAdmin(
  adminUserId: string,
  studentId: string,
  input: UpdateStudentAdminInput
): Promise<ServiceResult<ProfileRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      data: null,
      error: 'You are currently offline. Updating student records requires an active internet connection.',
      success: false,
    };
  }

  if (!adminUserId || !studentId) {
    return {
      data: null,
      error: 'Missing administrator or student ID parameter.',
      success: false,
    };
  }

  const validation = validateUpdateStudentForm(input);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    return {
      data: null,
      error: firstError || 'Please correct the validation errors in the form.',
      success: false,
    };
  }

  try {
    // Check if new matriculation number is already taken by another student
    if (input.matric_number) {
      const { data: duplicateMatric } = await supabase
        .from('profiles')
        .select('id')
        .eq('matric_number', input.matric_number.trim())
        .neq('id', studentId)
        .maybeSingle();

      if (duplicateMatric) {
        return {
          data: null,
          error: `The matriculation number "${input.matric_number.trim()}" is already assigned to another student.`,
          success: false,
        };
      }
    }

    // Whitelist and sanitize permitted fields (never change id or role)
    const updatePayload: Record<string, unknown> = {
      full_name: input.full_name.trim(),
      matric_number: input.matric_number.trim(),
      phone: input.phone?.trim() ? input.phone.trim() : null,
      institution: input.institution?.trim() ? input.institution.trim() : null,
      department: input.department?.trim() ? input.department.trim() : null,
      organisation: input.organisation?.trim() ? input.organisation.trim() : null,
      siwes_start_date: input.siwes_start_date?.trim() ? input.siwes_start_date.trim() : null,
      siwes_end_date: input.siwes_end_date?.trim() ? input.siwes_end_date.trim() : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', studentId)
      .eq('role', 'student')
      .select('*')
      .single();

    if (error) {
      return {
        data: null,
        error: formatStudentManagementError(error),
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
      error: formatStudentManagementError(err),
      success: false,
    };
  }
}
