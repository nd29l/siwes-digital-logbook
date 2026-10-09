/**
 * @file src/services/authService.ts
 * @description Authentication service layer interacting with Supabase Auth and the profiles table.
 * 
 * Architectural Rules:
 * 1. Only uses client-safe public anon key methods.
 * 2. Never exposes or imports the Supabase service-role key.
 * 3. Never writes passwords to public.profiles; passwords are solely managed by auth.users in Supabase.
 * 4. Resolves the user profile via the authenticated user's immutable UUID.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  LoginCredentials,
  ServiceResult,
  ProfileRow,
  UserRole,
} from '@/types';
import { User, Session, AuthError } from '@supabase/supabase-js';

/**
 * Normalizes Supabase auth errors into friendly user messages.
 */
export function formatAuthError(error: AuthError | Error | unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Invalid login credentials') || message.includes('invalid_grant')) {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Email address is not confirmed. Please check your inbox or contact your administrator.';
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many login attempts. Please wait a few moments before trying again.';
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to reach the server. Please check your internet connection.';
  }

  return message;
}

/**
 * Sign in with Email and Password using Supabase Auth.
 */
export async function signInWithEmail(
  credentials: LoginCredentials
): Promise<ServiceResult<{ user: User; session: Session }>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured. Please add your credentials in .env.local.',
      success: false,
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
    });

    if (error) {
      return {
        data: null,
        error: formatAuthError(error),
        success: false,
      };
    }

    if (!data.user || !data.session) {
      return {
        data: null,
        error: 'Authentication failed. No active session established.',
        success: false,
      };
    }

    return {
      data: { user: data.user, session: data.session },
      error: null,
      success: true,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatAuthError(err),
      success: false,
    };
  }
}

/**
 * Sign out the currently authenticated user from Supabase.
 */
export async function signOutUser(): Promise<ServiceResult<void>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null, success: true };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return {
        data: null,
        error: formatAuthError(error),
        success: false,
      };
    }
    return { data: null, error: null, success: true };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatAuthError(err),
      success: false,
    };
  }
}

/**
 * Retrieves the application profile for the specified user ID from the database.
 * Does NOT trust URL paths or client-passed roles; queries public.profiles where id = userId.
 */
export async function fetchUserProfile(userId: string): Promise<ServiceResult<ProfileRow>> {
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
        error: `Database profile error: ${error.message}`,
        success: false,
      };
    }

    if (!data) {
      return {
        data: null,
        error: 'Profile record not found for this authenticated user.',
        success: false,
      };
    }

    // Role validation: Ensure role is strictly 'student' or 'admin'
    const role = data.role as UserRole;
    if (role !== 'student' && role !== 'admin') {
      return {
        data: data as ProfileRow,
        error: `Invalid application role '${String(data.role)}'. Access denied.`,
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
      error: err instanceof Error ? err.message : 'Failed to retrieve user profile.',
      success: false,
    };
  }
}

/**
 * Requests a password reset email via Supabase Auth.
 */
export async function sendPasswordResetEmail(email: string): Promise<ServiceResult<void>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase credentials are not configured.',
      success: false,
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/reset-password',
    });

    if (error) {
      return {
        data: null,
        error: formatAuthError(error),
        success: false,
      };
    }

    return { data: null, error: null, success: true };
  } catch (err: unknown) {
    return {
      data: null,
      error: formatAuthError(err),
      success: false,
    };
  }
}

/**
 * Gets current session if available synchronously from memory / storage.
 */
export async function getInitialSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}
