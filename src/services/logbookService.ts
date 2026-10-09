/**
 * @file src/services/logbookService.ts
 * @description Service for managing SIWES logbook weeks and 5-day daily activities.
 * 
 * Architectural & Security Rules:
 * 1. Strictly client-safe: Operates through public Supabase client under Row-Level Security (RLS).
 * 2. Strict Student Ownership: All operations enforce student_id = auth.uid().
 * 3. Enforces Status Immutability: Verifies that only weeks in 'draft' or 'returned' state permit mutations.
 * 4. 5-Day Work Week Rule: Explicitly binds daily entries to Monday - Friday cycles.
 * 5. Postgres Error Normalization: Converts unique key and constraint violations into clear user guidance.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  LogbookWeekRow,
  DailyActivityRow,
  ServiceResult,
  SiwesDay,
  CreateDailyActivityInput,
  UpdateDailyActivityInput,
  DailyActivityFormData,
  ActivityValidationErrors,
  WeekWithActivities,
} from '@/types';

export const SIWES_DAYS: readonly SiwesDay[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

/**
 * Normalizes PostgreSQL error codes and constraints into friendly user messages.
 */
export function formatLogbookDatabaseError(error: unknown): string {
  if (!error) return 'An unexpected error occurred while processing logbook data.';

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

  // Unique constraint: uq_week_day (one entry per day for a given weekly report)
  if (code === '23505' && (message.includes('uq_week_day') || message.includes('day'))) {
    return 'An activity entry has already been recorded for this work day in the selected week.';
  }

  // Unique constraint: uq_student_activity_date (a student cannot log duplicate dates)
  if (code === '23505' && (message.includes('uq_student_activity_date') || message.includes('activity_date'))) {
    return 'You have already logged an activity for this calendar date across your logbook.';
  }

  // Unique constraint: uq_student_week (one week record per week_number)
  if (code === '23505' && (message.includes('uq_student_week') || message.includes('week_number'))) {
    return 'This logbook week has already been initialized.';
  }

  // RLS violation: is_week_editable_by_student check failed (week is submitted or approved)
  if (code === '42501' || message.includes('row-level security') || message.includes('policy')) {
    return 'Security Policy: This logbook week is locked and cannot be modified because it has been submitted or approved.';
  }

  // Network error
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to reach the database server. Please check your network connection and try again.';
  }

  return message;
}

/**
 * Calculates calendar ISO dates (YYYY-MM-DD) for Monday through Friday of a specific SIWES week.
 * Uses the student's SIWES commencement date as the anchor for Week 1.
 */
export function calculateWeekWorkDays(
  weekNumber: number,
  siwesStartDateStr: string | null | undefined
): Record<SiwesDay, string> {
  const safeWeek = Math.max(1, Math.min(52, weekNumber));

  // Determine base Monday
  let baseMonday: Date;

  if (siwesStartDateStr && /^\d{4}-\d{2}-\d{2}$/.test(siwesStartDateStr)) {
    const [y, m, d] = siwesStartDateStr.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const dayOfWeek = start.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    baseMonday = new Date(start);
    baseMonday.setDate(start.getDate() + diffToMon);
  } else {
    // Fallback: Monday of current week
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    baseMonday = new Date(today);
    baseMonday.setDate(today.getDate() + diffToMon);
  }

  // Target week Monday
  const weekMonday = new Date(baseMonday);
  weekMonday.setDate(baseMonday.getDate() + (safeWeek - 1) * 7);

  const formatIso = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tuesday = new Date(weekMonday);
  tuesday.setDate(weekMonday.getDate() + 1);

  const wednesday = new Date(weekMonday);
  wednesday.setDate(weekMonday.getDate() + 2);

  const thursday = new Date(weekMonday);
  thursday.setDate(weekMonday.getDate() + 3);

  const friday = new Date(weekMonday);
  friday.setDate(weekMonday.getDate() + 4);

  return {
    Monday: formatIso(weekMonday),
    Tuesday: formatIso(tuesday),
    Wednesday: formatIso(wednesday),
    Thursday: formatIso(thursday),
    Friday: formatIso(friday),
  };
}

/**
 * Validates a daily activity input client-side before network dispatch.
 */
export function validateDailyActivityForm(
  formData: DailyActivityFormData
): { isValid: boolean; errors: ActivityValidationErrors } {
  const errors: ActivityValidationErrors = {};

  const trimmedTitle = formData.title.trim();
  if (!trimmedTitle) {
    errors.title = 'Activity title is required.';
  } else if (trimmedTitle.length < 3) {
    errors.title = 'Activity title must be at least 3 characters.';
  } else if (trimmedTitle.length > 150) {
    errors.title = 'Activity title cannot exceed 150 characters.';
  }

  const trimmedActivity = formData.activity.trim();
  if (!trimmedActivity) {
    errors.activity = 'Detailed activity description is required.';
  } else if (trimmedActivity.length < 10) {
    errors.activity = 'Activity description must be at least 10 characters detailing your tasks.';
  } else if (trimmedActivity.length > 5000) {
    errors.activity = 'Activity description cannot exceed 5000 characters.';
  }

  const trimmedEquipment = formData.equipment_used.trim();
  if (trimmedEquipment && trimmedEquipment.length > 500) {
    errors.equipment_used = 'Equipment / tools description cannot exceed 500 characters.';
  }

  if (!formData.activity_date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.activity_date)) {
    errors.activity_date = 'Valid calendar date in YYYY-MM-DD format is required.';
  }

  if (!SIWES_DAYS.includes(formData.day)) {
    errors.day = 'Day must be a valid work day between Monday and Friday.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Retrieves all logbook weeks for the authenticated student, sorted in chronological order.
 */
export async function getStudentWeeks(userId: string): Promise<ServiceResult<LogbookWeekRow[]>> {
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
      error: 'Missing student user identification.',
      success: false,
    };
  }

  try {
    const { data, error } = await supabase
      .from('logbook_weeks')
      .select('*')
      .eq('student_id', userId)
      .order('week_number', { ascending: true });

    if (error) {
      return {
        data: null,
        error: formatLogbookDatabaseError(error),
        success: false,
      };
    }

    return {
      data: (data || []) as LogbookWeekRow[],
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatLogbookDatabaseError(err),
      success: false,
    };
  }
}

/**
 * Retrieves an existing week or initializes a new draft week for the student.
 */
export async function getOrCreateWeek(
  userId: string,
  weekNumber: number
): Promise<ServiceResult<LogbookWeekRow>> {
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
      error: 'Missing student user identification.',
      success: false,
    };
  }

  if (weekNumber < 1 || weekNumber > 52) {
    return {
      data: null,
      error: 'Logbook week number must be between 1 and 52.',
      success: false,
    };
  }

  try {
    // 1. Check if week already exists
    const { data: existingWeek, error: selectError } = await supabase
      .from('logbook_weeks')
      .select('*')
      .eq('student_id', userId)
      .eq('week_number', weekNumber)
      .maybeSingle();

    if (selectError) {
      return {
        data: null,
        error: formatLogbookDatabaseError(selectError),
        success: false,
      };
    }

    if (existingWeek) {
      return {
        data: existingWeek as LogbookWeekRow,
        error: null,
        success: true,
      };
    }

    // 2. Insert new week in 'draft' status
    const { data: newWeek, error: insertError } = await supabase
      .from('logbook_weeks')
      .insert({
        student_id: userId,
        week_number: weekNumber,
        status: 'draft',
      })
      .select('*')
      .single();

    if (insertError) {
      return {
        data: null,
        error: formatLogbookDatabaseError(insertError),
        success: false,
      };
    }

    return {
      data: newWeek as LogbookWeekRow,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatLogbookDatabaseError(err),
      success: false,
    };
  }
}

/**
 * Retrieves a specific logbook week along with all of its 5-day daily activities.
 */
export async function getWeekWithActivities(
  userId: string,
  weekId: string
): Promise<ServiceResult<WeekWithActivities>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (!userId || !weekId) {
    return {
      data: null,
      error: 'Missing student ID or week ID parameter.',
      success: false,
    };
  }

  try {
    // 1. Fetch the week record
    const { data: weekData, error: weekError } = await supabase
      .from('logbook_weeks')
      .select('*')
      .eq('id', weekId)
      .eq('student_id', userId)
      .single();

    if (weekError || !weekData) {
      return {
        data: null,
        error: weekError ? formatLogbookDatabaseError(weekError) : 'Logbook week not found.',
        success: false,
      };
    }

    const week = weekData as LogbookWeekRow;

    // 2. Fetch all daily activities for this week
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('week_id', weekId)
      .eq('student_id', userId)
      .order('activity_date', { ascending: true });

    if (activitiesError) {
      return {
        data: null,
        error: formatLogbookDatabaseError(activitiesError),
        success: false,
      };
    }

    const isEditable = week.status === 'draft' || week.status === 'returned';

    return {
      data: {
        week,
        activities: (activitiesData || []) as DailyActivityRow[],
        isEditable,
      },
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatLogbookDatabaseError(err),
      success: false,
    };
  }
}

/**
 * Creates a new daily activity in a designated week.
 * Enforces ownership, week editability (RLS), and schema constraints.
 */
export async function createDailyActivity(
  userId: string,
  input: CreateDailyActivityInput
): Promise<ServiceResult<DailyActivityRow>> {
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
      error: 'Missing authenticated student ID.',
      success: false,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      data: null,
      error: 'You are currently offline. Adding daily logbook activities requires an active internet connection.',
      success: false,
    };
  }

  try {
    const sanitizedPayload = {
      week_id: input.week_id,
      student_id: userId,
      day: input.day,
      activity_date: input.activity_date,
      title: input.title.trim(),
      activity: input.activity.trim(),
      equipment_used: input.equipment_used?.trim() ? input.equipment_used.trim() : null,
    };

    const { data, error } = await supabase
      .from('daily_activities')
      .insert(sanitizedPayload)
      .select('*')
      .single();

    if (error) {
      return {
        data: null,
        error: formatLogbookDatabaseError(error),
        success: false,
      };
    }

    return {
      data: data as DailyActivityRow,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatLogbookDatabaseError(err),
      success: false,
    };
  }
}

/**
 * Updates an existing daily activity entry.
 */
export async function updateDailyActivity(
  userId: string,
  activityId: string,
  input: UpdateDailyActivityInput
): Promise<ServiceResult<DailyActivityRow>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (!userId || !activityId) {
    return {
      data: null,
      error: 'Missing identification parameters for activity update.',
      success: false,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      data: null,
      error: 'You are currently offline. Updating daily activities requires an active internet connection.',
      success: false,
    };
  }

  try {
    const sanitizedPayload = {
      title: input.title.trim(),
      activity: input.activity.trim(),
      equipment_used: input.equipment_used?.trim() ? input.equipment_used.trim() : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('daily_activities')
      .update(sanitizedPayload)
      .eq('id', activityId)
      .eq('student_id', userId)
      .select('*')
      .single();

    if (error) {
      return {
        data: null,
        error: formatLogbookDatabaseError(error),
        success: false,
      };
    }

    return {
      data: data as DailyActivityRow,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatLogbookDatabaseError(err),
      success: false,
    };
  }
}

/**
 * Deletes a daily activity entry.
 */
export async function deleteDailyActivity(
  userId: string,
  activityId: string
): Promise<ServiceResult<boolean>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  if (!userId || !activityId) {
    return {
      data: null,
      error: 'Missing identification parameters for deletion.',
      success: false,
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      data: null,
      error: 'You are currently offline. Deleting daily activities requires an active internet connection.',
      success: false,
    };
  }

  try {
    const { error } = await supabase
      .from('daily_activities')
      .delete()
      .eq('id', activityId)
      .eq('student_id', userId);

    if (error) {
      return {
        data: null,
        error: formatLogbookDatabaseError(error),
        success: false,
      };
    }

    return {
      data: true,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatLogbookDatabaseError(err),
      success: false,
    };
  }
}
