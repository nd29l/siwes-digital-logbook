/**
 * @file src/App.tsx
 * @description Main application shell integrating application layout & navigation with Supabase Auth RBAC.
 * Features:
 * - Public routes: Landing page (default route for unauthenticated visitors) and Login Form.
 * - Authenticated Shell: Reusable AppShell with desktop sidebar, mobile sliding drawer, accessible topbar.
 * - Role-Appropriate Navigation: Student Portal routes (MOD-05, MOD-06, MOD-07, MOD-08) and Admin Portal routes (MOD-09, MOD-10, MOD-11, MOD-12).
 * - Route Protection: Strict ProtectedRoute wrapper ensuring unauthenticated and cross-role requests are blocked safely.
 * - Active route highlighting and seamless client routing transitions.
 */

import { useState, useEffect } from 'react';
import {
  UserCheck,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks';
import { RootLayout } from '@/layouts/RootLayout';
import { AppShell } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { LoginForm } from '@/components/auth/LoginForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LandingPage } from '@/pages/public/PublicPages';

// Student Pages
import {
  StudentDashboardPage,
  StudentProfilePage,
  StudentLogbookPage,
  StudentWeeklyReportsPage,
  StudentSettingsPage,
} from '@/pages/student/StudentPages';

// Admin Pages
import {
  AdminDashboardPage,
  AdminStudentsPage,
  AdminReportsPage,
  AdminRemarksPage,
  AdminSettingsPage,
} from '@/pages/admin/AdminPages';

import { checkSystemHealth } from '@/services';
import { SystemEnvironmentStatus, UserRole, RouteId } from '@/types';
import { OfflineIndicator, PWAReloadPrompt } from '@/components/pwa';

function AppContent() {
  const { user, profile, role, isAuthenticated, signOut } = useAuth();

  // Active route state (raw selection; the effective route is derived from auth state below).
  // The default is the public landing page: unauthenticated visitors opening "/" see the
  // homepage, while authenticated users are redirected to their role dashboard by the
  // derivation logic further down. A browser refresh therefore always reloads this page
  // rather than any internal or development view.
  const [route, setRoute] = useState<RouteId>('overview');
  const [envStatus, setEnvStatus] = useState<SystemEnvironmentStatus | null>(null);

  // Check system health on mount
  useEffect(() => {
    async function verifyFoundation() {
      const result = await checkSystemHealth();
      if (result.data) {
        setEnvStatus(result.data);
      }
    }
    verifyFoundation();
  }, []);

  const isConfigured = Boolean(envStatus?.supabaseConfigured);

  // Handle successful login: automatically route to the appropriate dashboard
  const handleLoginSuccess = (userRole: UserRole) => {
    if (userRole === 'admin') {
      setRoute('admin-dashboard');
    } else {
      setRoute('student-dashboard');
    }
  };

  // Derive the effective route from the current authentication state.
  // - Authenticated users always land on their role dashboard (never a public view).
  // - Fully signed-out users fall through to the public landing page or login view.
  let currentRoute = route;
  if (
    isAuthenticated &&
    role &&
    !currentRoute.startsWith('student-') &&
    !currentRoute.startsWith('admin-')
  ) {
    currentRoute = role === 'admin' ? 'admin-dashboard' : 'student-dashboard';
  } else if (!user && (currentRoute.startsWith('student-') || currentRoute.startsWith('admin-'))) {
    currentRoute = 'login';
  }

  // Helper to determine if the active route belongs to the authenticated portal layout
  const isAuthenticatedRoute =
    currentRoute.startsWith('student-') || currentRoute.startsWith('admin-');

  // RENDER AUTHENTICATED PORTAL APP SHELL
  if (isAuthenticatedRoute) {
    const isStudentRoute = currentRoute.startsWith('student-');
    const requiredRole: UserRole = isStudentRoute ? 'student' : 'admin';

    return (
      <ProtectedRoute
        allowedRoles={[requiredRole]}
        onNavigateToLogin={() => setRoute('login')}
        onNavigateToPortal={(r) =>
          setRoute(r === 'admin' ? 'admin-dashboard' : 'student-dashboard')
        }
      >
        <AppShell
          currentRoute={currentRoute}
          onNavigate={(routeId) => setRoute(routeId)}
          supabaseConfigured={isConfigured}
        >
          {/* STUDENT ROUTES */}
          {currentRoute === 'student-dashboard' && (
            <StudentDashboardPage
              onNavigate={(r) => setRoute(r)}
              onLogout={() => signOut()}
            />
          )}
          {currentRoute === 'student-profile' && (
            <StudentProfilePage onNavigate={(r) => setRoute(r)} />
          )}
          {currentRoute === 'student-logbook' && (
            <StudentLogbookPage onNavigate={(r) => setRoute(r)} />
          )}
          {currentRoute === 'student-weekly-reports' && (
            <StudentWeeklyReportsPage onNavigate={(r) => setRoute(r)} />
          )}
          {currentRoute === 'student-settings' && (
            <StudentSettingsPage onNavigate={(r) => setRoute(r)} />
          )}

          {/* ADMIN ROUTES */}
          {currentRoute === 'admin-dashboard' && (
            <AdminDashboardPage
              onNavigate={(r) => setRoute(r)}
              onLogout={() => signOut()}
            />
          )}
          {currentRoute === 'admin-students' && (
            <AdminStudentsPage onNavigate={(r) => setRoute(r)} />
          )}
          {currentRoute === 'admin-reports' && (
            <AdminReportsPage onNavigate={(r) => setRoute(r)} />
          )}
          {currentRoute === 'admin-remarks' && (
            <AdminRemarksPage onNavigate={(r) => setRoute(r)} />
          )}
          {currentRoute === 'admin-settings' && (
            <AdminSettingsPage onNavigate={(r) => setRoute(r)} />
          )}
        </AppShell>
      </ProtectedRoute>
    );
  }

  // RENDER PUBLIC LANDING PAGE (default route for unauthenticated visitors)
  if (currentRoute === 'overview') {
    return <LandingPage onNavigate={(r) => setRoute(r)} />;
  }

  // RENDER PUBLIC VIEW (Login)
  return (
    <RootLayout
      supabaseConfigured={isConfigured}
      currentRoute={currentRoute}
      onNavigate={(r) => setRoute(r)}
    >
      <div id="public-views-root" className="space-y-8">
        {/* VIEW: LOGIN FORM */}
        <div className="py-6">
          {isAuthenticated ? (
            <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Already Authenticated</h3>
              <p className="text-xs text-slate-600">
                You are currently logged in as <span className="font-semibold">{profile?.full_name || user?.email}</span> (
                <strong className="capitalize">{role}</strong>).
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    setRoute(role === 'admin' ? 'admin-dashboard' : 'student-dashboard')
                  }
                >
                  Open {role === 'admin' ? 'Admin' : 'Student'} Portal Shell
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <LoginForm onSuccess={handleLoginSuccess} />
          )}
        </div>
      </div>
    </RootLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <OfflineIndicator />
      <PWAReloadPrompt />
    </AuthProvider>
  );
}
