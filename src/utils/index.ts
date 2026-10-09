/**
 * @file src/utils/index.ts
 * @description General-purpose helper functions for classnames, dates, and error handling.
 */

import { SystemEnvironmentStatus } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * Conditionally joins CSS class strings together.
 * Provides a lightweight alternative to external class concatenation packages.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Formats a Date or ISO string into a standardized readable format (e.g., '12 Oct 2026').
 */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return 'N/A';
  try {
    const date = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Formats a timestamp into a relative human-readable string (e.g. 'Just now', '5m ago', '2h ago').
 */
export function formatTimeAgo(input: string | Date | null | undefined): string {
  if (!input) return '';
  try {
    const date = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(date.getTime())) return '';
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;

    return formatDate(date);
  } catch {
    return '';
  }
}

/**
 * Standardizes unknown errors into clean human-readable strings.
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred';
}

/**
 * Inspects client environment configuration.
 */
export function getEnvironmentStatus(): SystemEnvironmentStatus {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const hasValidUrl = Boolean(
    supabaseUrl &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseUrl.startsWith('https://')
  );

  const hasValidKey = Boolean(
    supabaseAnonKey &&
    supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' &&
    supabaseAnonKey.length > 20
  );

  return {
    supabaseConfigured: isSupabaseConfigured(),
    supabaseUrlProvided: hasValidUrl,
    supabaseAnonKeyProvided: hasValidKey,
    environmentMode: import.meta.env.MODE || 'development',
    viteVersion: '8.3',
    reactVersion: '19.0',
  };
}
