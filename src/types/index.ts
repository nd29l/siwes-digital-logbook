/**
 * @file src/types/index.ts
 * @description Core foundational TypeScript types for the SIWES Digital Logbook System.
 * Establishes shared types across authentication, user roles, logbook status, and service results.
 */

/**
 * System user roles.
 * Supports the two primary actors in the SIWES system.
 */
export type UserRole = 'student' | 'admin';

/**
 * Status lifecycle states for weekly SIWES logbook reports.
 */
export type WeekStatus = 'draft' | 'submitted' | 'approved' | 'returned';

/**
 * Legacy alias for backwards compatibility with Module 01 references.
 */
export type LogbookSubmissionStatus = WeekStatus;

/**
 * Five-day SIWES work week days.
 */
export type SiwesDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

/**
 * Base User Profile interface.
 * Maps to the `profiles` table in Supabase.
 */
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string | null;
  matricNumber?: string | null;
  institution?: string | null;
  department?: string | null;
  organisation?: string | null;
  siwesStartDate?: string | null;
  siwesEndDate?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Standard Result pattern used for service and utility responses.
 * Promotes consistent error handling without throwing unhandled exceptions.
 */
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Foundation system health & environment check status.
 */
export interface SystemEnvironmentStatus {
  supabaseConfigured: boolean;
  supabaseUrlProvided: boolean;
  supabaseAnonKeyProvided: boolean;
  environmentMode: string;
  viteVersion: string;
  reactVersion: string;
  tablesDetected?: {
    profiles: boolean;
    logbook_weeks: boolean;
    daily_activities: boolean;
  };
}

export * from './database';
export * from './auth';
export * from './navigation';
export * from './profile';
export * from './dashboard';
export * from './logbook';
export * from './weeklyReport';
export * from './adminDashboard';
export * from './studentManagement';
export * from './reportReview';
export * from './remarksFeedback';
export * from './notification';
