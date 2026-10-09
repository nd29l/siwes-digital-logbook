/**
 * @file src/services/index.ts
 * @description Foundation service layer for the SIWES Digital Logbook application.
 * Establishes standard ServiceResult handling, database schema diagnostics, and health checks.
 */

import { ServiceResult, SystemEnvironmentStatus } from '@/types';
import { getEnvironmentStatus } from '@/utils';
import { supabase } from '@/lib/supabase';

/**
 * Diagnostic service that inspects the development environment and verifies
 * whether the Module 02 Supabase database schema has been applied.
 */
export async function checkSystemHealth(): Promise<ServiceResult<SystemEnvironmentStatus>> {
  try {
    const status = getEnvironmentStatus();

    // Check table accessibility in the Supabase PostgreSQL database
    if (status.supabaseConfigured) {
      const tablesDetected = {
        profiles: false,
        logbook_weeks: false,
        daily_activities: false,
      };

      try {
        const { error: profileErr } = await supabase.from('profiles').select('id').limit(0);
        // If no error or error is not "relation does not exist"
        if (!profileErr || !profileErr.message.includes('does not exist')) {
          tablesDetected.profiles = true;
        }

        const { error: weeksErr } = await supabase.from('logbook_weeks').select('id').limit(0);
        if (!weeksErr || !weeksErr.message.includes('does not exist')) {
          tablesDetected.logbook_weeks = true;
        }

        const { error: activitiesErr } = await supabase.from('daily_activities').select('id').limit(0);
        if (!activitiesErr || !activitiesErr.message.includes('does not exist')) {
          tablesDetected.daily_activities = true;
        }

        status.tablesDetected = tablesDetected;
      } catch (checkErr) {
        console.warn('[Database Schema Check]:', checkErr);
      }
    }

    return {
      data: status,
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown system error',
      success: false,
    };
  }
}

/**
 * Service mock-safe helper for future modules.
 * Ensures consistent result formatting.
 */
export function createServiceResult<T>(data: T | null, error: string | null = null): ServiceResult<T> {
  return {
    data,
    error,
    success: error === null,
  };
}

export * from './authService';
export * from './profileService';
export * from './studentDashboardService';
export * from './logbookService';
export * from './weeklyReportService';
export * from './adminDashboardService';
export * from './studentManagementService';
export * from './reportReviewService';
export * from './remarksFeedbackService';
export * from './notificationService';
