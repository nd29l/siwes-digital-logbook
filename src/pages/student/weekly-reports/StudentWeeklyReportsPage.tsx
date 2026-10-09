/**
 * @file src/pages/student/weekly-reports/StudentWeeklyReportsPage.tsx
 * @description Dedicated student Weekly Report Review and Formal Submission page for Module 08.
 * 
 * Features:
 * 1. Logbook week navigation and date range display.
 * 2. 5-Day daily activity consolidated review (Monday through Friday).
 * 3. Lifecycle status tracking (Draft, Submitted, Approved, Returned).
 * 4. Supervisor feedback & remark display for returned and approved reports.
 * 5. Submission confirmation modal with student integrity declaration.
 * 6. Prevention of premature submissions (validation of at least one activity).
 * 7. Seamless navigation back to Daily Logbook for activity edits.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks';
import {
  getStudentWeeks,
  getOrCreateWeek,
  getWeekWithActivities,
  submitWeeklyReport,
  calculateWeekWorkDays,
  SIWES_DAYS,
} from '@/services';
import {
  LogbookWeekRow,
  DailyActivityRow,
  DaySlotInfo,
  RouteId,
  SiwesDay,
} from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils';
import { WeekSelector } from '../logbook/WeekSelector';
import { WeeklyStatusBanner } from './WeeklyStatusBanner';
import { WeeklyActivitiesReview } from './WeeklyActivitiesReview';
import { SubmissionConfirmModal } from './SubmissionConfirmModal';
import { StudentFeedbackHistoryModal } from './StudentFeedbackHistoryModal';
import {
  CalendarCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  RefreshCw,
  Send,
  BookOpen,
  Info,
  ExternalLink,
  ShieldCheck,
  FileText,
  MessageSquare,
} from 'lucide-react';

interface StudentWeeklyReportsPageProps {
  onNavigate?: (routeId: RouteId) => void;
}

export const StudentWeeklyReportsPage: React.FC<StudentWeeklyReportsPageProps> = ({
  onNavigate,
}) => {
  const { user, profile } = useAuth();

  // State: Weeks & Selection
  const [weeks, setWeeks] = useState<LogbookWeekRow[]>([]);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1);
  const [activities, setActivities] = useState<DailyActivityRow[]>([]);

  // Loading & Error States
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(true);
  const [loadedWeekId, setLoadedWeekId] = useState<string | null>(null);
  const [isAddingWeek, setIsAddingWeek] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Derived Current Week
  const currentWeek = useMemo(() => {
    return weeks.find((w) => w.week_number === selectedWeekNumber) || null;
  }, [weeks, selectedWeekNumber]);

  const isLoadingActivities = Boolean(currentWeek?.id && loadedWeekId !== currentWeek.id);

  // 1. Fetch weeks on mount or user change
  useEffect(() => {
    let isCancelled = false;
    const userId = user?.id;
    if (!userId) return;

    getStudentWeeks(userId)
      .then((res) => {
        if (isCancelled) return;
        if (res.success && res.data) {
          setWeeks(res.data);
          if (res.data.length > 0) {
            setSelectedWeekNumber((prev) => {
              const exists = res.data!.some((w) => w.week_number === prev);
              return exists ? prev : res.data![0].week_number;
            });
          }
        } else {
          setErrorMessage(res.error || 'Failed to load logbook weeks.');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'An error occurred while loading logbook weeks.'
        );
      })
      .finally(() => {
        if (isCancelled) return;
        setIsLoadingWeeks(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  // 2. Load activities for currently selected week
  useEffect(() => {
    let isCancelled = false;
    const userId = user?.id;
    const weekId = currentWeek?.id;

    if (!userId || !weekId) return;

    getWeekWithActivities(userId, weekId)
      .then((res) => {
        if (isCancelled) return;
        if (res.success && res.data) {
          setActivities(res.data.activities);
        } else {
          setErrorMessage(res.error || 'Failed to load activities for this week.');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'An error occurred while loading daily activities.'
        );
      })
      .finally(() => {
        if (isCancelled) return;
        setLoadedWeekId(weekId);
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.id, currentWeek?.id]);

  // 3. Compute 5-day cycle dates (Monday to Friday)
  const workDayDates = useMemo(() => {
    return calculateWeekWorkDays(selectedWeekNumber, profile?.siwes_start_date);
  }, [selectedWeekNumber, profile?.siwes_start_date]);

  // Formatted date span string (e.g. "Oct 12, 2026 – Oct 16, 2026")
  const weekDateSpan = useMemo(() => {
    const mondayStr = workDayDates.Monday;
    const fridayStr = workDayDates.Friday;
    return `${formatDate(mondayStr)} – ${formatDate(fridayStr)}`;
  }, [workDayDates]);

  // 4. Map the 5 work day slots
  const daySlots: DaySlotInfo[] = useMemo(() => {
    return SIWES_DAYS.map((day) => {
      const dateStr = workDayDates[day];
      const activity = activities.find((a) => a.day === day) || null;
      return {
        day,
        dateStr,
        formattedDate: formatDate(dateStr),
        activity,
        isLogged: activity !== null,
      };
    });
  }, [workDayDates, activities]);

  const loggedDaysCount = activities.length;
  const isWeekEditable = currentWeek?.status === 'draft' || currentWeek?.status === 'returned';
  const canSubmit = isWeekEditable && loggedDaysCount > 0;

  // Add next week handler
  const handleAddNextWeek = async () => {
    if (!user?.id || isAddingWeek) return;
    setIsAddingWeek(true);
    setErrorMessage(null);

    const nextWeekNum =
      weeks.length > 0 ? Math.max(...weeks.map((w) => w.week_number)) + 1 : 1;

    try {
      const res = await getOrCreateWeek(user.id, nextWeekNum);
      if (res.success && res.data) {
        setWeeks((prev) => [...prev, res.data!].sort((a, b) => a.week_number - b.week_number));
        setSelectedWeekNumber(res.data.week_number);
      } else {
        setErrorMessage(res.error || 'Failed to initialize new week.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred while creating week.'
      );
    } finally {
      setIsAddingWeek(false);
    }
  };

  // Submission handler
  const handleConfirmSubmit = async () => {
    if (!user?.id || !currentWeek?.id) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await submitWeeklyReport(user.id, currentWeek.id);
      if (res.success && res.data) {
        // Update local weeks state
        setWeeks((prev) =>
          prev.map((w) => (w.id === res.data!.id ? res.data! : w))
        );
        setSuccessMessage(
          `Week ${currentWeek.week_number} report submitted successfully! It is now locked and pending supervisor review.`
        );
        setIsSubmitModalOpen(false);
      } else {
        setErrorMessage(res.error || 'Failed to submit weekly report.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred during submission.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    if (!user?.id) return;
    setIsLoadingWeeks(true);
    setErrorMessage(null);
    getStudentWeeks(user.id)
      .then((res) => {
        if (res.success && res.data) {
          setWeeks(res.data);
        } else {
          setErrorMessage(res.error || 'Failed to load logbook weeks.');
        }
      })
      .catch((err) => {
        setErrorMessage(
          err instanceof Error ? err.message : 'An error occurred while loading logbook weeks.'
        );
      })
      .finally(() => {
        setIsLoadingWeeks(false);
      });
  };

  return (
    <div id="student-weekly-reports-page" className="space-y-6">
      {/* 1. TOP NAVIGATION & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('student-dashboard')}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 -ml-1 rounded-lg cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Weekly Report & Submission
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review compiled 5-day technical entries and submit your weekly SIWES report for supervisor endorsement.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
            id="btn-open-feedback-history"
            title="View all supervisor remarks and feedback received"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            <span>Supervisor Feedback</span>
          </Button>

          {onNavigate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('student-logbook')}
              className="text-xs"
              id="header-nav-to-logbook"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Daily Logbook</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isLoadingWeeks}
            className="text-xs text-slate-600"
            title="Refresh reports"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeeks ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {successMessage && (
        <div
          id="submission-success-banner"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Submission Successful!</span>
              <span>{successMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs p-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMessage && (
        <div
          id="weekly-report-error-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Action Notice</span>
              <span>{errorMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold text-xs p-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. LOADING STATE */}
      {isLoadingWeeks ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500 font-medium">Loading weekly report data...</p>
        </div>
      ) : weeks.length === 0 ? (
        /* 3. EMPTY STATE: NO WEEKS YET */
        <Card className="p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100 shadow-2xs">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">No Weekly Reports Initialized</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Start by initializing your first SIWES logbook week. Once initialized, record daily activities in your Daily Logbook and return here to compile and submit your weekly report.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleAddNextWeek}
              disabled={isAddingWeek}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isAddingWeek ? 'Initializing Week 1...' : 'Initialize Week 1 Report'}
            </Button>
            {onNavigate && (
              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigate('student-logbook')}
              >
                Go to Daily Logbook
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* 4. MAIN REPORT CONTENT */
        <div className="space-y-6">
          {/* Week Selector Toolbar */}
          <WeekSelector
            weeks={weeks}
            selectedWeekNumber={selectedWeekNumber}
            onSelectWeek={(num) => {
              setSelectedWeekNumber(num);
              setSuccessMessage(null);
            }}
            onAddNextWeek={handleAddNextWeek}
            isAddingWeek={isAddingWeek}
          />

          {currentWeek && (
            <>
              {/* Comprehensive Status Banner */}
              <WeeklyStatusBanner
                week={currentWeek}
                activitiesCount={loggedDaysCount}
                onNavigate={onNavigate}
              />

              {/* Weekly Summary & Action Overview Card */}
              <Card id="weekly-report-summary-card" className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Left: Summary Metrics */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Week {currentWeek.week_number} Report Overview
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-mono font-medium text-slate-700">
                        {weekDateSpan}
                      </span>
                    </div>

                    {/* Progress Bar: Days Logged */}
                    <div className="space-y-1.5 max-w-md">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Activity Completion:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {loggedDaysCount} of 5 Work Days Recorded
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            loggedDaysCount === 5
                              ? 'bg-emerald-500'
                              : loggedDaysCount > 0
                              ? 'bg-amber-500'
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${(loggedDaysCount / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Submission Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    {isWeekEditable ? (
                      <>
                        {onNavigate && (
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => onNavigate('student-logbook')}
                            className="text-xs"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>Edit in Logbook</span>
                          </Button>
                        )}

                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => setIsSubmitModalOpen(true)}
                          disabled={!canSubmit || isLoadingActivities}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[160px]"
                          id="submit-weekly-report-button"
                          title={
                            loggedDaysCount === 0
                              ? 'Log at least one daily activity before submitting'
                              : 'Submit weekly report for review'
                          }
                        >
                          <Send className="w-4 h-4" />
                          <span>
                            {currentWeek.status === 'returned'
                              ? 'Resubmit Report'
                              : 'Submit Weekly Report'}
                          </span>
                        </Button>
                      </>
                    ) : currentWeek.status === 'submitted' ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs">
                        <Lock className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Awaiting Supervisor Endorsement</span>
                          <span className="text-2xs text-sky-700">Submitted report is locked</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Report Approved & Finalized</span>
                          <span className="text-2xs text-emerald-700">Permanently endorsed</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Reminder if 0 days logged */}
                {isWeekEditable && loggedDaysCount === 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-700">
                    <Info className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      You have not recorded any daily activities for Week {currentWeek.week_number} yet. Please record activities in your Daily Logbook before submitting.
                    </span>
                  </div>
                )}
              </Card>

              {/* 5-Day Activities Review Component */}
              {isLoadingActivities ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs text-slate-500">Loading daily activities...</span>
                </div>
              ) : (
                <WeeklyActivitiesReview
                  daySlots={daySlots}
                  isEditable={isWeekEditable}
                  onNavigateToLogbook={() => {
                    if (onNavigate) onNavigate('student-logbook');
                  }}
                  weekNumber={currentWeek.week_number}
                />
              )}
            </>
          )}

          {/* Submission Confirmation Modal */}
          <SubmissionConfirmModal
            isOpen={isSubmitModalOpen}
            onClose={() => setIsSubmitModalOpen(false)}
            onConfirm={handleConfirmSubmit}
            week={currentWeek}
            activities={activities}
            weekDateRange={weekDateSpan}
            isSubmitting={isSubmitting}
          />

          {/* Supervisor Feedback History Modal */}
          <StudentFeedbackHistoryModal
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            studentId={user?.id || ''}
            onSelectWeek={(num) => setSelectedWeekNumber(num)}
          />
        </div>
      )}
    </div>
  );
};
