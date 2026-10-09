/**
 * @file src/pages/student/StudentDashboardPage.tsx
 * @description Production-ready Student Dashboard for Module 06.
 * 
 * Features:
 * 1. Student Identity & Welcome section with real profile information.
 * 2. SIWES Placement & Timeline Summary (Organisation, Dates, elapsed progress, current week).
 * 3. Logbook & Report Progress metrics (daily activities logged, submitted, approved, returned).
 * 4. Recent weekly reports summary or informative empty state.
 * 5. Returned reports action alert with supervisor review notifications.
 * 6. Profile completeness reminder banner.
 * 7. Quick navigation actions to Logbook, Weekly Reports, and Profile.
 * 8. Loading, error, and non-blocking manual refresh states.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks';
import {
  getStudentDashboardMetrics,
  calculateSiwesTimeline,
  checkStudentProfileCompleteness,
} from '@/services';
import {
  StudentDashboardMetrics,
  RouteId,
  WeekStatus,
} from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils';
import {
  BookOpen,
  CalendarCheck,
  User,
  ShieldCheck,
  ArrowRight,
  Clock,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Settings,
  GraduationCap,
  ClipboardList,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface StudentDashboardPageProps {
  onNavigate?: (routeId: RouteId) => void;
  onLogout?: () => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  onNavigate,
}) => {
  const { user, profile, refreshProfile } = useAuth();

  // Metrics state
  const [metrics, setMetrics] = useState<StudentDashboardMetrics>({
    totalActivitiesLogged: 0,
    totalWeeksCreated: 0,
    draftWeeksCount: 0,
    submittedWeeksCount: 0,
    approvedWeeksCount: 0,
    returnedWeeksCount: 0,
    recentWeeks: [],
  });

  const [isLoading, setIsLoading] = useState(() => Boolean(user?.id));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Initial data loading on mount or when user changes
  useEffect(() => {
    let isCancelled = false;
    const currentUserId = user?.id;
    if (!currentUserId) {
      return;
    }

    getStudentDashboardMetrics(currentUserId)
      .then((result) => {
        if (isCancelled) return;
        if (!result.success || !result.data) {
          setErrorMessage(result.error || 'Failed to retrieve logbook progress metrics.');
        } else {
          setMetrics(result.data);
          setLastRefreshedAt(new Date());
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred while loading dashboard data.'
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

  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (!user?.id || isRefreshing) return;
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      await refreshProfile();
      const result = await getStudentDashboardMetrics(user.id);
      if (!result.success || !result.data) {
        setErrorMessage(result.error || 'Failed to retrieve logbook progress metrics.');
      } else {
        setMetrics(result.data);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred while loading dashboard data.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Retry handler for error banner
  const handleRetry = () => {
    if (!user?.id) return;
    setIsLoading(true);
    setErrorMessage(null);
    getStudentDashboardMetrics(user.id)
      .then((result) => {
        if (!result.success || !result.data) {
          setErrorMessage(result.error || 'Failed to retrieve logbook progress metrics.');
        } else {
          setMetrics(result.data);
          setLastRefreshedAt(new Date());
        }
      })
      .catch((err) => {
        setErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred while loading dashboard data.'
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Real-time timeline calculations based on student's profile SIWES dates
  const timeline = useMemo(() => {
    return calculateSiwesTimeline(profile?.siwes_start_date, profile?.siwes_end_date);
  }, [profile?.siwes_start_date, profile?.siwes_end_date]);

  // Profile completeness check
  const profileCompleteness = useMemo(() => {
    return checkStudentProfileCompleteness(profile);
  }, [profile]);

  // Status badge variant helper for weekly reports
  const getStatusBadge = (status: WeekStatus) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="info" size="sm">
            <Clock className="w-3 h-3" />
            Submitted
          </Badge>
        );
      case 'returned':
        return (
          <Badge variant="warning" size="sm">
            <AlertTriangle className="w-3 h-3" />
            Returned
          </Badge>
        );
      case 'draft':
      default:
        return (
          <Badge variant="neutral" size="sm">
            Draft
          </Badge>
        );
    }
  };

  // Status badge for SIWES timeline
  const getTimelineStatusBadge = () => {
    switch (timeline.status) {
      case 'in_progress':
        return (
          <Badge variant="success" size="md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Placement
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge variant="info" size="md">
            <Clock className="w-3.5 h-3.5" />
            Upcoming Placement
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="purple" size="md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Placement Completed
          </Badge>
        );
      case 'not_configured':
      default:
        return (
          <Badge variant="warning" size="md">
            <AlertCircle className="w-3.5 h-3.5" />
            Dates Pending
          </Badge>
        );
    }
  };

  return (
    <div id="student-dashboard-page" className="space-y-6">
      {/* 1. WELCOME BANNER & REFRESH BAR */}
      <section id="student-welcome-banner" className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-4 sm:p-6 text-white shadow-md border border-slate-800">
        {/* Subtle background graphic */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-12 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Student Portal
              </span>
              {profile?.matric_number && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
                  {profile.matric_number}
                </span>
              )}
              {lastRefreshedAt && (
                <span className="text-2xs sm:text-xs text-slate-400 hidden sm:inline">
                  Updated {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-white break-words">
              Welcome back, {profile?.full_name || 'SIWES Student'}!
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitor your industrial training milestones, track weekly report reviews, and access your daily technical logbook.
              {profile?.organisation && (
                <span className="block mt-1 font-medium text-emerald-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 inline shrink-0" />
                  Attached to: {profile.organisation}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-start sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              className="text-slate-200 border-slate-700 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-900"
              id="student-dashboard-refresh-btn"
              title="Refresh dashboard metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {onNavigate && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('student-profile')}
                  className="text-slate-200 border-slate-700 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-900"
                  id="dashboard-header-profile-btn"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('student-logbook')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm"
                  id="dashboard-header-logbook-btn"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Daily Logbook</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. ERROR STATE (IF ANY) */}
      {errorMessage && (
        <div
          id="student-dashboard-error-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-xs sm:text-sm"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Unable to load all dashboard metrics</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="text-rose-700 border-rose-300 hover:bg-rose-100 shrink-0"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* 3. PROFILE COMPLETENESS NOTIFICATION CALLOUT */}
      {!profileCompleteness.isComplete && (
        <div
          id="profile-incomplete-banner"
          className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-2xs"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-900">Complete Your SIWES Placement Profile</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Missing details: <span className="font-medium">{profileCompleteness.missingFields.slice(0, 3).join(', ')}</span>
                {profileCompleteness.missingFields.length > 3 && ` and ${profileCompleteness.missingFields.length - 3} more`}.
                Configuring your dates enables real-time SIWES duration tracking.
              </p>
            </div>
          </div>
          {onNavigate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('student-profile')}
              className="bg-white text-amber-900 border-amber-300 hover:bg-amber-100 text-xs shrink-0 self-end sm:self-center font-semibold"
              id="banner-complete-profile-btn"
            >
              Complete Profile
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* 4. RETURNED REPORTS ACTION ALERT */}
      {metrics.returnedWeeksCount > 0 && (
        <div
          id="returned-reports-alert"
          className="p-4 rounded-xl bg-orange-50 border-2 border-orange-300 text-orange-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-200 text-orange-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-orange-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-orange-900">
                  {metrics.returnedWeeksCount === 1 ? '1 Weekly Report Returned' : `${metrics.returnedWeeksCount} Weekly Reports Returned`}
                </h3>
                <Badge variant="warning" size="sm">Requires Revision</Badge>
              </div>
              <p className="text-xs text-orange-800 mt-0.5">
                Your industrial supervisor or institution coordinator has reviewed your submission and requested updates. Please review supervisor feedback.
              </p>
            </div>
          </div>
          {onNavigate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('student-weekly-reports')}
              className="bg-orange-600 hover:bg-orange-500 text-white border-orange-600 shrink-0 self-end sm:self-center"
              id="alert-view-returned-reports-btn"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Review Feedback</span>
            </Button>
          )}
        </div>
      )}

      {/* 5. KEY STAT METRIC CARDS */}
      <section id="student-summary-metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Daily Activities */}
        <Card id="stat-daily-activities" className="p-3.5 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs sm:text-xs font-medium text-slate-500 truncate pr-1">Daily Activities</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {isLoading ? '...' : metrics.totalActivitiesLogged}
            </span>
            <span className="text-2xs sm:text-xs text-slate-500 block mt-0.5 truncate">
              Recorded technical tasks
            </span>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('student-logbook')}
              className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 text-2xs sm:text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Daily logbook</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </Card>

        {/* Metric 2: Weekly Reports Created */}
        <Card id="stat-weekly-reports" className="p-3.5 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs sm:text-xs font-medium text-slate-500 truncate pr-1">Weekly Reports</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {isLoading ? '...' : metrics.totalWeeksCreated}
            </span>
            <span className="text-2xs sm:text-xs text-slate-500 block mt-0.5 truncate">
              5-day cycle reports
            </span>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('student-weekly-reports')}
              className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 text-2xs sm:text-xs font-medium text-indigo-700 hover:text-indigo-800 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Weekly reports</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </Card>

        {/* Metric 3: Reports Awaiting Review */}
        <Card id="stat-pending-review" className="p-3.5 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs sm:text-xs font-medium text-slate-500 truncate pr-1">Awaiting Review</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {isLoading ? '...' : metrics.submittedWeeksCount}
            </span>
            <span className="text-2xs sm:text-xs text-slate-500 block mt-0.5 truncate">
              Submitted to supervisor
            </span>
          </div>
          <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 text-2xs sm:text-xs text-slate-500 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
            <span className="truncate">Pending review</span>
          </div>
        </Card>

        {/* Metric 4: Approved Reports */}
        <Card id="stat-approved-reports" className="p-3.5 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs sm:text-xs font-medium text-slate-500 truncate pr-1">Approved Reports</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {isLoading ? '...' : metrics.approvedWeeksCount}
            </span>
            <span className="text-2xs sm:text-xs text-slate-500 block mt-0.5 truncate">
              Signed & endorsed
            </span>
          </div>
          <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 text-2xs sm:text-xs text-slate-500 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Official records</span>
          </div>
        </Card>
      </section>

      {/* 6. MAIN WORKSPACE GRID: TIMELINE & LOGBOOK SUMMARY + SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: SIWES TIMELINE & LOGBOOK/REPORTS (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SIWES Placement & Timeline Card */}
          <Card id="student-siwes-timeline-card">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">SIWES Placement & Period</h2>
                  <p className="text-xs text-slate-500">Industrial attachment progress and milestone tracker</p>
                </div>
              </div>
              {getTimelineStatusBadge()}
            </div>

            {/* Placement Information Details */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100">
                <span className="text-slate-500 block mb-1">Attached Organisation:</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {profile?.organisation || 'Not yet configured in profile'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100">
                <span className="text-slate-500 block mb-1">SIWES Duration:</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
                  {timeline.totalWeeks > 0
                    ? `${timeline.totalWeeks} Weeks (${timeline.totalDays} calendar days)`
                    : 'Dates not specified'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Commencement Date:</span>
                <span className="font-mono font-medium text-slate-800">
                  {profile?.siwes_start_date ? formatDate(profile.siwes_start_date) : 'Pending setup'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Completion Date:</span>
                <span className="font-mono font-medium text-slate-800">
                  {profile?.siwes_end_date ? formatDate(profile.siwes_end_date) : 'Pending setup'}
                </span>
              </div>
            </div>

            {/* Live Progress Bar (if dates configured) */}
            {timeline.status !== 'not_configured' && (
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{timeline.statusLabel}</span>
                  <span className="font-mono font-bold text-slate-900">{timeline.percentElapsed}% completed</span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${timeline.percentElapsed}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-2xs sm:text-xs text-slate-500 pt-1 font-mono">
                  <span>{timeline.elapsedDays} days elapsed</span>
                  <span>{timeline.remainingDays} days remaining</span>
                </div>
              </div>
            )}

            {timeline.status === 'not_configured' && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Set your SIWES start and end dates in your profile to enable the interactive timeline.</span>
                {onNavigate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('student-profile')}
                    className="text-xs py-1 px-2.5 shrink-0"
                  >
                    Set Dates
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Logbook & Reports Progress Summary Card */}
          <Card id="student-logbook-progress-card">
            <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">Logbook & Weekly Reports Activity</h2>
                  <p className="text-xs text-slate-500">Submission and supervisor review history</p>
                </div>
              </div>

              {onNavigate && metrics.recentWeeks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('student-weekly-reports')}
                  className="text-xs py-1 px-2.5"
                >
                  View All Weeks
                </Button>
              )}
            </div>

            {/* List of Recent Weeks or Empty State */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs">Loading logbook progress...</span>
              </div>
            ) : metrics.recentWeeks.length > 0 ? (
              <div className="mt-4 divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100">
                      <th className="pb-2 font-medium">Cycle</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Submitted</th>
                      <th className="pb-2 font-medium">Review / Remark</th>
                      <th className="pb-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metrics.recentWeeks.map((week) => (
                      <tr key={week.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 font-bold text-slate-900">
                          Week {week.week_number}
                        </td>
                        <td className="py-2.5">
                          {getStatusBadge(week.status)}
                        </td>
                        <td className="py-2.5 text-slate-600 font-mono">
                          {week.submitted_at ? formatDate(week.submitted_at) : 'Not submitted'}
                        </td>
                        <td className="py-2.5 text-slate-600">
                          {week.admin_remark ? (
                            <span className="truncate max-w-xs block text-slate-800" title={week.admin_remark}>
                              {week.admin_remark}
                            </span>
                          ) : week.status === 'approved' ? (
                            <span className="text-emerald-700 font-medium">Endorsed</span>
                          ) : week.status === 'submitted' ? (
                            <span className="text-slate-400 italic">Pending review</span>
                          ) : (
                            <span className="text-slate-400 italic">In progress</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          {onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('student-weekly-reports')}
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Sensible Empty State for Pre-Module 07/08 */
              <div id="logbook-empty-state" className="mt-4 p-8 rounded-xl bg-slate-50/60 border border-slate-200/80 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 mx-auto flex items-center justify-center shadow-2xs">
                  <ClipboardList className="w-6 h-6 text-slate-500" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">No Logbook Records Yet</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your daily technical tasks and weekly 5-day compiled reports will appear here as you submit them.
                    Open the Daily Logbook to start recording your entries, then compile and submit your weekly report.
                  </p>
                </div>
                {onNavigate && (
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('student-logbook')}
                      className="text-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      Preview Daily Logbook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('student-weekly-reports')}
                      className="text-xs"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 text-sky-600" />
                      Preview Weekly Reports
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: QUICK ACTIONS & STUDENT PROFILE OVERVIEW (lg:col-span-1) */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card id="student-quick-actions-card">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
              <p className="text-xs text-slate-500">Access your student tools and portal functions:</p>
            </div>

            <div className="mt-3 space-y-2">
              {onNavigate && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('student-logbook')}
                    id="quick-action-logbook"
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 active:bg-slate-100 text-left transition-all duration-150 cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm block">Daily Logbook</span>
                        <span className="text-2xs sm:text-xs text-slate-500">Record technical activities & sketches</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('student-weekly-reports')}
                    id="quick-action-weekly-reports"
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 active:bg-slate-100 text-left transition-all duration-150 cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <CalendarCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm block">Weekly Reports</span>
                        <span className="text-2xs sm:text-xs text-slate-500">Compile & submit 5-day cycle reports</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('student-profile')}
                    id="quick-action-profile"
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 active:bg-slate-100 text-left transition-all duration-150 cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm block">Profile & Placement</span>
                        <span className="text-2xs sm:text-xs text-slate-500">Manage SIWES info & dates</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('student-settings')}
                    id="quick-action-settings"
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 active:bg-slate-100 text-left transition-all duration-150 cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm block">Account Security</span>
                        <span className="text-2xs sm:text-xs text-slate-500">Password and preferences</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </button>
                </>
              )}
            </div>
          </Card>

          {/* Student Profile Identity Summary Card */}
          <Card id="student-identity-summary-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Student Identity</h3>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('student-profile')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div>
                <span className="text-slate-500 block">Full Name:</span>
                <span className="font-semibold text-slate-900">{profile?.full_name || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Matriculation Number:</span>
                <span className="font-mono font-medium text-slate-900">{profile?.matric_number || 'Pending'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Department:</span>
                <span className="text-slate-800">{profile?.department || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Institution:</span>
                <span className="text-slate-800">{profile?.institution || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Account Email:</span>
                <span className="font-mono text-slate-700 truncate block">{user?.email || profile?.email}</span>
              </div>
            </div>
          </Card>

          {/* SIWES Guidelines & Scheme Info Card */}
          <Card id="student-siwes-guidelines-card" className="bg-slate-50/70 border-slate-200/80">
            <div className="pb-2.5 border-b border-slate-200/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">SIWES Scheme Rules</h4>
            </div>
            <div className="mt-2.5 space-y-2 text-xs text-slate-600 leading-relaxed">
              <p className="flex items-start gap-1.5">
                <span className="font-bold text-slate-800">•</span>
                <span><strong>5-Day Cycle:</strong> Record work activities completed between Monday and Friday.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="font-bold text-slate-800">•</span>
                <span><strong>Supervisor Review:</strong> Submit each week for institutional endorsement.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="font-bold text-slate-800">•</span>
                <span><strong>Official Record:</strong> Maintain accuracy in equipment and technical terms logged.</span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
