/**
 * @file src/lib/supabase.ts
 * @description Supabase client initialization module.
 * 
 * Architectural Rules:
 * 1. Only reads client-safe environment variables (prefixed with VITE_).
 * 2. NEVER imports or references the Supabase 'service_role' key.
 * 3. Gracefully guards against missing configuration during development,
 *    allowing Module 01 diagnostics to display without throwing unhandled exceptions.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client-safe environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validates whether valid Supabase credentials have been configured.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }
  // Exclude template placeholder defaults
  if (
    supabaseUrl === 'https://your-project-id.supabase.co' ||
    supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  ) {
    return false;
  }
  return true;
}

/**
 * Fallback dummy URL used solely to prevent createClient constructor from crashing
 * in local development before the user provides their Supabase credentials.
 */
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_ANON_KEY = 'placeholder-anon-key-module-01';

/**
 * Initialized Supabase JavaScript Client.
 * Safe for client-side queries adhering to Row Level Security (RLS).
 */
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? (supabaseUrl as string) : FALLBACK_URL,
  isSupabaseConfigured() ? (supabaseAnonKey as string) : FALLBACK_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Accessor function providing explicit feedback if Supabase client is unconfigured.
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    console.warn(
      '[SIWES Supabase Client]: Supabase environment variables are missing or set to placeholder values. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env or .env.local file.'
    );
  }
  return supabase;
}
