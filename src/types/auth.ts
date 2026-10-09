/**
 * @file src/types/auth.ts
 * @description Authentication and authorization types for the SIWES Digital Logbook.
 * Encapsulates Supabase Auth session states, user roles, credentials, and context payloads.
 */

import { User } from '@supabase/supabase-js';
import { UserRole, ProfileRow } from './index';

/**
 * Authentication state interface representing current session and profile status.
 */
export interface AuthState {
  user: User | null;
  profile: ProfileRow | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  isProfileMissing: boolean;
  hasInvalidRole: boolean;
  error: string | null;
}

/**
 * Login credentials input.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Password reset request input.
 */
export interface PasswordResetCredentials {
  email: string;
}

/**
 * Auth Context methods and reactive state exposed across the React tree.
 */
export interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error: string | null; role?: UserRole }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error: string | null }>;
  refreshProfile: () => Promise<void>;
}
