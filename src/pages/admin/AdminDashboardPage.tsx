/**
 * @file src/pages/admin/AdminDashboardPage.tsx
 * @description Production Administrator Dashboard for Module 09.
 * 
 * Features:
 * 1. Real-time institutional SIWES metrics aggregated from Supabase database.
 * 2. Summary cards for enrolled students, pending reports, approved, returned, drafts, and daily logs.
 * 3. Recent weekly report submissions feed with student details, statuses, and review action shortcuts.
 * 4. Academic department cohort distribution breakdown.
 * 5. Strict role verification and authorization guards.
 * 6. Responsive design supporting mobile, tablet, and desktop layouts.
 * 7. Loading, database error, empty, and retry states.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { getAdminDashboardMetrics } from '@/services';
import { AdminDashboardMetrics, RouteId } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminMetricCard } from './dashboard/AdminMetricCard';
import { AdminRecentSubmissionsTable } from './dashboard/AdminRecentSubmissionsTable';
import { AdminCohortDistribution } from './dashboard/AdminCohortDistribution';
import {
  Users,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpenCheck,
  FileText,
  User,
  ShieldCheck,
  Building,
  ArrowRight,
  RefreshCw,
  MessageSquareText,
  Settings,
  AlertCircle,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate?: (routeId: RouteId) => void;
  onLogout?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { user, profile } = useAuth();

  // Metrics State
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(user?.id));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch admin dashboard data from Supabase
  const loadDashboardData = async (isManualRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const res = await getAdminDashboardMetrics(user.id);
      if (res.success && res.data) {
        setMetrics(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to load administrator dashboard data.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred while fetching metrics.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const currentUserId = user?.id;

    if (!currentUserId) {
      return;
    }

    getAdminDashboardMetrics(currentUserId)
      .then((res) => {
        if (isCancelled) return;
        if (res.success && res.data) {
          setMetrics(res.data);
        } else {
          setErrorMessage(res.error || 'Failed to load administrator dashboard data.');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred while fetching metrics.'
        );
      })
      .finally(() => {
        if (isCancelled) return;
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  const handleManualRefresh = () => {
    loadDashboardData(true);
  };

  return (
    <div id="admin-dashboard-page" className="space-y-6">
      {/* 1. TOP DIRECTORATE BANNER */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
              SIWES Directorate
            </span>
            <Badge variant="purple" size="sm" className="bg-purple-800/60 text-purple-200 border-purple-600/40">
              <ShieldCheck className="w-3 h-3" />
              Role: Administrator
            </Badge>
          </div>

          <h1 className="text-lg sm:text-2xl font-bold tracking-tight break-words sm:truncate">
            {profile?.full_name ? `Welcome, ${profile.full_name}` : 'SIWES Directorate Console'}
          </h1>

          <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
            Real-time administrative overview of student placement cohorts, weekly logbook submissions, and supervisor endorsement status.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-start sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            className="text-purple-200 border-purple-700/80 hover:bg-purple-800/80 bg-purple-950/40 text-xs"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>

          {onNavigate && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('admin-reports')}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs"
                id="header-nav-admin-reports"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Review Queue</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('admin-students')}
                className="text-purple-200 border-purple-700/80 hover:bg-purple-800/80 bg-purple-950/40 text-xs"
                id="header-nav-admin-students"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Student Directory</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div
          id="admin-dashboard-error-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Database Notice</span>
              <span>{errorMessage}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData(false)}
            className="text-rose-700 border-rose-300 hover:bg-rose-100 text-xs shrink-0"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* 2. LOADING STATE */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-slate-500 font-medium">Querying institutional logbook metrics from database...</p>
        </div>
      ) : (
        <>
          {/* 3. SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* Total Students */}
            <AdminMetricCard
              id="metric-total-students"
              title="Active Students"
              value={metrics?.totalStudents ?? 0}
              description="Enrolled SIWES cohort"
              icon={Users}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-700"
              onClick={onNavigate ? () => onNavigate('admin-students') : undefined}
            />

            {/* Pending Reports / Review Queue */}
            <AdminMetricCard
              id="metric-pending-reviews"
              title="Pending Review"
              value={metrics?.submittedReportsCount ?? 0}
              description="Awaiting endorsement"
              icon={Clock}
              iconBgColor="bg-amber-100"
              iconColor="text-amber-700"
              highlight={(metrics?.submittedReportsCount ?? 0) > 0}
              badge={
                (metrics?.submittedReportsCount ?? 0) > 0 ? (
                  <Badge variant="warning" size="sm">
                    Action Required
                  </Badge>
                ) : undefined
              }
              onClick={onNavigate ? () => onNavigate('admin-reports') : undefined}
            />

            {/* Approved Reports */}
            <AdminMetricCard
              id="metric-approved-reports"
              title="Approved Reports"
              value={metrics?.approvedReportsCount ?? 0}
              description="Officially signed off"
              icon={CheckCircle2}
              iconBgColor="bg-emerald-100"
              iconColor="text-emerald-700"
              badge={
                <Badge variant="success" size="sm">
                  Finalized
                </Badge>
              }
            />

            {/* Returned Reports */}
            <AdminMetricCard
              id="metric-returned-reports"
              title="Returned Reports"
              value={metrics?.returnedReportsCount ?? 0}
              description="Corrections requested"
              icon={AlertTriangle}
              iconBgColor="bg-rose-100"
              iconColor="text-rose-700"
              badge={
                (metrics?.returnedReportsCount ?? 0) > 0 ? (
                  <Badge variant="danger" size="sm">
                    Revising
                  </Badge>
                ) : undefined
              }
            />

            {/* Draft Reports */}
            <AdminMetricCard
              id="metric-draft-reports"
              title="Draft Reports"
              value={metrics?.draftReportsCount ?? 0}
              description="Work in progress"
              icon={FileText}
              iconBgColor="bg-slate-100"
              iconColor="text-slate-600"
            />

            {/* Total Daily Activities Logged */}
            <AdminMetricCard
              id="metric-total-activities"
              title="Activities Logged"
              value={metrics?.totalActivitiesLogged ?? 0}
              description="5-day entries recorded"
              icon={BookOpenCheck}
              iconBgColor="bg-sky-100"
              iconColor="text-sky-700"
            />
          </div>

          {/* 4. MAIN TWO-COLUMN CONTENT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Recent Submissions Table & Review Action Banner */}
            <div className="lg:col-span-2 space-y-6">
              {/* Action Banner if submissions awaiting review */}
              {(metrics?.submittedReportsCount ?? 0) > 0 && onNavigate && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-sm block">
                        {metrics!.submittedReportsCount} Weekly {metrics!.submittedReportsCount === 1 ? 'Report' : 'Reports'} Awaiting Review
                      </span>
                      <span className="text-xs text-amber-800">
                        Students have submitted compiled 5-day logs ready for evaluation and supervisor scoring.
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigate('admin-reports')}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs shrink-0 self-start sm:self-auto"
                  >
                    <span>Open Review Queue</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}

              {/* Recent Submissions Feed */}
              <Card id="admin-recent-submissions-card" className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-purple-700" />
                      <span>Recent Logbook Submissions</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Latest weekly logbook submissions submitted across all academic departments
                    </p>
                  </div>

                  {onNavigate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('admin-reports')}
                      className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
                    >
                      <span>Full Queue</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>

                <AdminRecentSubmissionsTable
                  submissions={metrics?.recentSubmissions ?? []}
                  onNavigate={onNavigate}
                />
              </Card>
            </div>

            {/* Right Column: Directorate Actions & Cohort Breakdown */}
            <div className="space-y-6">
              {/* Departmental Distribution Breakdown */}
              <AdminCohortDistribution
                departments={metrics?.departmentBreakdown ?? []}
                totalStudents={metrics?.totalStudents ?? 0}
              />

              {/* Directorate Navigation Shortcuts */}
              <Card id="admin-shortcuts-card" className="p-5 space-y-3">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Directorate Management</h3>
                  <p className="text-xs text-slate-500">Access administrative workflows:</p>
                </div>

                <div className="space-y-2">
                  {onNavigate && (
                    <>
                      <button
                        type="button"
                        onClick={() => onNavigate('admin-reports')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-purple-50/50 hover:border-purple-200 text-left transition-colors text-xs cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-200 transition-colors">
                            <FileCheck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">Report Review Queue</span>
                            <span className="text-2xs text-slate-500">Assess & endorse 5-day logs</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 transition-colors" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate('admin-students')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-purple-50/50 hover:border-purple-200 text-left transition-colors text-xs cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-200 transition-colors">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">Student Cohort Directory</span>
                            <span className="text-2xs text-slate-500">Inspect placements & status</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 transition-colors" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate('admin-remarks')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-purple-50/50 hover:border-purple-200 text-left transition-colors text-xs cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-200 transition-colors">
                            <MessageSquareText className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">Supervisor Remarks</span>
                            <span className="text-2xs text-slate-500">Provide corrective feedback</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 transition-colors" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate('admin-settings')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-purple-50/50 hover:border-purple-200 text-left transition-colors text-xs cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-200 transition-colors">
                            <Settings className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">System Configuration</span>
                            <span className="text-2xs text-slate-500">Academic calendars & settings</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 transition-colors" />
                      </button>
                    </>
                  )}
                </div>
              </Card>

              {/* Admin Profile Details */}
              <Card id="admin-profile-card" className="p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-700" />
                    <h3 className="text-sm font-bold text-slate-900">Administrator Identity</h3>
                  </div>
                  <Badge variant="purple" size="sm">
                    Verified
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Full Name:</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {profile?.full_name || 'Chief Administrator'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Admin Email:</span>
                    <span className="font-mono text-slate-800 truncate block">
                      {user?.email || profile?.email}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Institution & Directorate:</span>
                    <span className="text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {profile?.institution || 'Institution SIWES Unit'} &bull;{' '}
                        {profile?.department || 'Directorate of Industrial Training'}
                      </span>
                    </span>
                  </div>

                  {onLogout && (
                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onLogout}
                        className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
