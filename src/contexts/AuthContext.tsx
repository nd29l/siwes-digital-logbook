/**
 * @file src/contexts/AuthContext.tsx
 * @description Authentication Context & Provider for the SIWES Digital Logbook.
 * 
 * Features:
 * - Subscribes to Supabase onAuthStateChange listener with automatic cleanup.
 * - Resolves application profile from public.profiles using authenticated user's UUID.
 * - Enforces least-privilege default (no admin access on missing or invalid profiles).
 * - Avoids authentication flickering with deterministic loading states.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  AuthContextType,
  AuthState,
  LoginCredentials,
  ProfileRow,
  UserRole,
} from '@/types';
import {
  signInWithEmail,
  signOutUser,
  fetchUserProfile,
  sendPasswordResetEmail,
} from '@/services/authService';
import { AuthContext } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProfileMissing, setIsProfileMissing] = useState<boolean>(false);
  const [hasInvalidRole, setHasInvalidRole] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads the application profile for a given user.
   */
  const loadProfileForUser = useCallback(async (authUser: User | null): Promise<UserRole | null> => {
    if (!authUser) {
      setProfile(null);
      setRole(null);
      setIsProfileMissing(false);
      setHasInvalidRole(false);
      return null;
    }

    const result = await fetchUserProfile(authUser.id);

    if (!result.success || !result.data) {
      setProfile(null);
      setRole(null);

      if (result.error?.includes('not found')) {
        setIsProfileMissing(true);
        setHasInvalidRole(false);
        setError('Your user account exists, but no SIWES profile record was found. Please contact the administrator.');
      } else if (result.error?.includes('Invalid application role')) {
        setIsProfileMissing(false);
        setHasInvalidRole(true);
        setError('Your user profile has an unrecognized role. Access has been denied.');
      } else {
        setIsProfileMissing(false);
        setHasInvalidRole(false);
        setError(result.error);
      }
      return null;
    }

    const loadedRole = result.data.role;
    setProfile(result.data);
    setRole(loadedRole);
    setIsProfileMissing(false);
    setHasInvalidRole(false);
    setError(null);
    return loadedRole;
  }, []);

  /**
   * Refreshes the currently active profile without altering the auth session.
   */
  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfileForUser(user);
    }
  }, [user, loadProfileForUser]);

  /**
   * Subscribes to Supabase onAuthStateChange on mount.
   */
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured()) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        // Initial session fetch
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setUser(session.user);
          await loadProfileForUser(session.user);
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      } catch (err: unknown) {
        console.error('[AuthContext] Session init error:', err);
        if (isMounted) {
          setError('Failed to initialize authentication session.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session: Session | null) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          setUser(session.user);
          await loadProfileForUser(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setRole(null);
        setIsProfileMissing(false);
        setHasInvalidRole(false);
        setError(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfileForUser]);

  /**
   * Log in handler
   */
  const handleSignIn = useCallback(
    async (credentials: LoginCredentials): Promise<{ success: boolean; error: string | null; role?: UserRole }> => {
      setLoading(true);
      setError(null);

      const result = await signInWithEmail(credentials);
      if (!result.success || !result.data) {
        setLoading(false);
        setError(result.error);
        return { success: false, error: result.error };
      }

      setUser(result.data.user);
      const assignedRole = await loadProfileForUser(result.data.user);
      setLoading(false);

      if (!assignedRole) {
        return {
          success: false,
          error: 'Authentication succeeded, but failed to load authorized application profile.',
        };
      }

      return { success: true, error: null, role: assignedRole };
    },
    [loadProfileForUser]
  );

  /**
   * Sign out handler
   */
  const handleSignOut = useCallback(async () => {
    setLoading(true);
    await signOutUser();
    setUser(null);
    setProfile(null);
    setRole(null);
    setIsProfileMissing(false);
    setHasInvalidRole(false);
    setError(null);
    setLoading(false);
  }, []);

  /**
   * Password reset request handler
   */
  const handleResetPassword = useCallback(async (email: string) => {
    return sendPasswordResetEmail(email);
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      profile,
      role,
      loading,
      isAuthenticated: Boolean(user && profile && role && !isProfileMissing && !hasInvalidRole),
      isProfileMissing,
      hasInvalidRole,
      error,
      signIn: handleSignIn,
      signOut: handleSignOut,
      resetPasswordForEmail: handleResetPassword,
      refreshProfile,
    }),
    [
      user,
      profile,
      role,
      loading,
      isProfileMissing,
      hasInvalidRole,
      error,
      handleSignIn,
      handleSignOut,
      handleResetPassword,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
