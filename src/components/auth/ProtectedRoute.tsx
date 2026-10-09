/**
 * @file src/components/auth/ProtectedRoute.tsx
 * @description Role-based protected route container for the SIWES Digital Logbook.
 * 
 * Rules:
 * 1. Unauthenticated users are redirected to /login (or login view).
 * 2. If authentication is loading, displays a clean accessible loading spinner.
 * 3. If an authenticated student attempts to view an admin route, access is denied with clear redirect options.
 * 4. If an administrator visits a student route or vice versa, handles segregation cleanly.
 * 5. Handles missing profile or invalid role states safely without privileged fallback.
 */

import React from 'react';
import { useAuth } from '@/hooks';
import { UserRole } from '@/types';
import { ShieldAlert, LogOut, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
  onNavigateToLogin?: () => void;
  onNavigateToPortal?: (role: UserRole) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
  onNavigateToLogin,
  onNavigateToPortal,
}) => {
  const { user, profile, role, loading, isAuthenticated, isProfileMissing, hasInvalidRole, signOut } = useAuth();

  // 1. Loading State
  if (loading) {
    return (
      <div id="auth-loading-state" className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-slate-700 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-700">Verifying authentication session...</p>
        <p className="text-xs text-slate-500 mt-1">Inspecting security tokens and database role permissions.</p>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!user || !isAuthenticated) {
    // Missing Profile Edge Case
    if (isProfileMissing) {
      return (
        <div id="missing-profile-warning" className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border border-amber-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Application Profile Required</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your login was authenticated by Supabase, but no corresponding SIWES profile record was found in the database.
            For security reasons, access is denied until your administrator creates your profile.
          </p>
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      );
    }

    // Invalid Role Edge Case
    if (hasInvalidRole) {
      return (
        <div id="invalid-role-warning" className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border border-rose-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Invalid Role Configuration</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your profile contains an unsupported role identifier. The system strictly recognizes <strong>student</strong> and <strong>admin</strong>.
          </p>
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-center">
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      );
    }

    // Default Unauthenticated Fallback
    return (
      <div id="unauthenticated-prompt" className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Authentication Required</h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          You must be signed in to access this portal. Please authenticate with your university-issued credentials.
        </p>
        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-center">
          <Button variant="primary" size="sm" onClick={onNavigateToLogin}>
            Go to Login
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  // 3. Role-Based Authorization Guard
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div id="role-access-denied" className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border border-rose-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-4 border border-rose-100">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Your account is signed in as a <span className="font-semibold text-slate-900 capitalize">{role}</span>, which does not have permission to view this section.
        </p>
        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-center gap-3">
          {onNavigateToPortal && (
            <Button variant="primary" size="sm" onClick={() => onNavigateToPortal(role)}>
              Return to {role === 'admin' ? 'Admin' : 'Student'} Area
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
};
