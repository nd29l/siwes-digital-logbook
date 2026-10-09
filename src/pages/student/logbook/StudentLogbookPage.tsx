/**
 * @file src/pages/student/logbook/StudentLogbookPage.tsx
 * @description Main production screen for Module 07 Daily Activity / Digital Logbook.
 * 
 * Features:
 * 1. Logbook week navigation and dynamic week creation.
 * 2. 5-Day work week cycle (Monday - Friday) with exact calendar date binding.
 * 3. Daily activity creation, viewing, editing, and deletion.
 * 4. Status management (Draft, Submitted, Approved, Returned).
 * 5. Immutable lock for submitted/approved weeks; active revision mode for returned weeks.
 * 6. Profile placement start date synchronization and reminders.
 * 7. Loading, empty, and error state resilience.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks';
import {
  getStudentWeeks,
  getOrCreateWeek,
  getWeekWithActivities,
  createDailyActivity,
  updateDailyActivity,
  deleteDailyActivity,
  calculateWeekWorkDays,
  SIWES_DAYS,
} from '@/services';
import {
  LogbookWeekRow,
  DailyActivityRow,
  DailyActivityFormData,
  SiwesDay,
  RouteId,
} from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils';
import { WeekSelector } from './WeekSelector';
import { DayActivityCard } from './DayActivityCard';
import { ActivityFormModal } from './ActivityFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  RefreshCw,
  Plus,
  AlertCircle,
  FileCheck,
  CalendarRange,
  Info,
} from 'lucide-react';

interface StudentLogbookPageProps {
  onNavigate?: (routeId: RouteId) => void;
}

export const StudentLogbookPage: React.FC<StudentLogbookPageProps> = ({
  onNavigate,
}) => {
  const { user, profile } = useAuth();

  // State: Weeks & Selected Week
  const [weeks, setWeeks] = useState<LogbookWeekRow[]>([]);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1);
  const [activities, setActivities] = useState<DailyActivityRow[]>([]);

  // Derived current week
  const currentWeek = useMemo(() => {
    return weeks.find((w) => w.week_number === selectedWeekNumber) || null;
  }, [weeks, selectedWeekNumber]);

  // Loading & Error States
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(true);
  const [loadedWeekId, setLoadedWeekId] = useState<string | null>(null);
  const isLoadingActivities = Boolean(currentWeek?.id && loadedWeekId !== currentWeek.id);
  const [isAddingWeek, setIsAddingWeek] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formTargetDay, setFormTargetDay] = useState<SiwesDay>('Monday');
  const [formTargetDate, setFormTargetDate] = useState<string>('');
  const [selectedActivityForEdit, setSelectedActivityForEdit] = useState<DailyActivityRow | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedActivityForDelete, setSelectedActivityForDelete] = useState<DailyActivityRow | null>(null);

  // 1. Load all weeks for this student on mount
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

    if (!userId || !weekId) {
      return;
    }

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

  // 3. Compute 5-day cycle dates (Monday to Friday) for this week
  const workDayDates = useMemo(() => {
    return calculateWeekWorkDays(selectedWeekNumber, profile?.siwes_start_date);
  }, [selectedWeekNumber, profile?.siwes_start_date]);

  // Is this week editable by student (draft or returned)?
  const isWeekEditable = useMemo(() => {
    if (!currentWeek) return false;
    return currentWeek.status === 'draft' || currentWeek.status === 'returned';
  }, [currentWeek]);

  // 4. Initialize next week
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

  // 5. Open Modal to record activity for a day
  const handleOpenAddModal = (day: SiwesDay, dateStr: string) => {
    setSelectedActivityForEdit(null);
    setFormTargetDay(day);
    setFormTargetDate(dateStr);
    setIsFormModalOpen(true);
  };

  // 6. Open Modal to edit an existing activity
  const handleOpenEditModal = (activity: DailyActivityRow) => {
    setSelectedActivityForEdit(activity);
    setFormTargetDay(activity.day);
    setFormTargetDate(activity.activity_date);
    setIsFormModalOpen(true);
  };

  // 7. Open Modal to delete an activity
  const handleOpenDeleteModal = (activity: DailyActivityRow) => {
    setSelectedActivityForDelete(activity);
    setIsDeleteModalOpen(true);
  };

  // 8. Save activity (Create or Update)
  const handleSaveActivity = async (formData: DailyActivityFormData): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !currentWeek) {
      return { success: false, error: 'Missing authenticated user or week information.' };
    }

    if (selectedActivityForEdit) {
      // Update existing
      const res = await updateDailyActivity(user.id, selectedActivityForEdit.id, {
        title: formData.title,
        activity: formData.activity,
        equipment_used: formData.equipment_used,
      });

      if (res.success && res.data) {
        setActivities((prev) =>
          prev.map((a) => (a.id === res.data!.id ? res.data! : a))
        );
        return { success: true };
      } else {
        return { success: false, error: res.error || 'Failed to update activity.' };
      }
    } else {
      // Create new
      const res = await createDailyActivity(user.id, {
        week_id: currentWeek.id,
        day: formData.day,
        activity_date: formData.activity_date,
        title: formData.title,
        activity: formData.activity,
        equipment_used: formData.equipment_used,
      });

      if (res.success && res.data) {
        setActivities((prev) => [...prev, res.data!].sort((a, b) => a.activity_date.localeCompare(b.activity_date)));
        return { success: true };
      } else {
        return { success: false, error: res.error || 'Failed to record activity.' };
      }
    }
  };

  // 9. Confirm Delete activity
  const handleConfirmDelete = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !selectedActivityForDelete) {
      return { success: false, error: 'Missing activity to delete.' };
    }

    const res = await deleteDailyActivity(user.id, selectedActivityForDelete.id);
    if (res.success) {
      setActivities((prev) => prev.filter((a) => a.id !== selectedActivityForDelete.id));
      return { success: true };
    } else {
      return { success: false, error: res.error || 'Failed to delete activity.' };
    }
  };

  // Progress calculations for the current week
  const completedDaysCount = activities.length;
  const progressPercentage = Math.round((completedDaysCount / 5) * 100);

  return (
    <div id="student-logbook-page" className="space-y-6">
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      <section id="logbook-header-section" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onNavigate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('student-dashboard')}
                className="text-slate-600 hover:text-slate-900 -ml-2 p-1.5"
                title="Back to Student Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Badge variant="purple" size="sm">
              Daily Logbook
            </Badge>
            <span className="text-xs text-slate-500">5-Day Work Week Cycle</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Daily Activity / Digital Logbook
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Document your daily engineering, technical, and scientific assignments. Entries recorded here form your official weekly SIWES reports.
          </p>
        </div>

        {/* Quick Weekly Completion Tracker */}
        {currentWeek && (
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5 shrink-0 min-w-[220px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Week {selectedWeekNumber} Progress</span>
              <span className="font-mono font-bold text-slate-900">{completedDaysCount} / 5 Days</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-2xs text-slate-400 text-right">
              {progressPercentage}% of 5 working days recorded
            </p>
          </div>
        )}
      </section>

      {/* 2. ERROR BANNER (IF ANY) */}
      {errorMessage && (
        <div
          id="logbook-error-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-xs sm:text-sm"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Logbook Error</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="text-rose-700 border-rose-300 hover:bg-rose-100 shrink-0 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 3. PROFILE DATE RECOMMENDATION CALLOUT */}
      {!profile?.siwes_start_date && (
        <div
          id="logbook-dates-callout"
          className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <CalendarRange className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Placement Commencement Date:</strong> Setting your SIWES start date in your profile ensures your weekly Monday–Friday dates accurately match your industrial calendar.
            </p>
          </div>
          {onNavigate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('student-profile')}
              className="bg-white text-amber-900 border-amber-300 hover:bg-amber-100 text-xs shrink-0 font-medium"
            >
              Configure Dates
            </Button>
          )}
        </div>
      )}

      {/* 4. WEEK STATUS NOTICE BANNERS */}
      {currentWeek && currentWeek.status === 'returned' && (
        <div
          id="week-returned-alert"
          className="p-4 rounded-xl bg-orange-50 border-2 border-orange-300 text-orange-950 space-y-2 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-700 shrink-0" />
            <h3 className="text-sm font-bold text-orange-900">
              Week {currentWeek.week_number} Returned for Revision
            </h3>
            <Badge variant="warning" size="sm">Action Required</Badge>
          </div>
          <p className="text-xs text-orange-900 leading-relaxed">
            Your industrial or institutional supervisor returned this weekly submission with feedback. Daily activity entries are unlocked so you can make required corrections.
          </p>
          {(currentWeek.admin_remark || currentWeek.admin_feedback) && (
            <div className="p-3 rounded-lg bg-white border border-orange-200 text-xs space-y-1">
              <span className="font-semibold text-orange-900 block">Supervisor Remark:</span>
              <p className="text-slate-800 italic">
                "{currentWeek.admin_remark || currentWeek.admin_feedback}"
              </p>
            </div>
          )}
        </div>
      )}

      {currentWeek && currentWeek.status === 'submitted' && (
        <div
          id="week-submitted-banner"
          className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 flex items-start gap-3 text-xs shadow-2xs"
        >
          <Clock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sky-900">Week {currentWeek.week_number} Submitted for Review</h3>
              <Badge variant="info" size="sm">Locked</Badge>
            </div>
            <p className="text-sky-800">
              Submitted on {currentWeek.submitted_at ? formatDate(currentWeek.submitted_at) : 'recently'}. Daily entries are read-only while your supervisor reviews your weekly report.
            </p>
          </div>
        </div>
      )}

      {currentWeek && currentWeek.status === 'approved' && (
        <div
          id="week-approved-banner"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3 text-xs shadow-2xs"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-emerald-900">Week {currentWeek.week_number} Approved & Endorsed</h3>
              <Badge variant="success" size="sm">Official Archive</Badge>
            </div>
            <p className="text-emerald-800">
              Reviewed and signed off by supervisor. These daily activities form an official, immutable part of your industrial training record.
            </p>
          </div>
        </div>
      )}

      {/* 5. WEEK SELECTOR TOOLBAR */}
      {weeks.length > 0 && (
        <WeekSelector
          weeks={weeks}
          selectedWeekNumber={selectedWeekNumber}
          onSelectWeek={(num) => setSelectedWeekNumber(num)}
          onAddNextWeek={handleAddNextWeek}
          isAddingWeek={isAddingWeek}
        />
      )}

      {/* 6. DAILY ACTIVITY ENTRIES GRID OR EMPTY STATE */}
      {isLoadingWeeks ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-emerald-600" />
          <p className="text-xs font-medium">Loading logbook workspace...</p>
        </div>
      ) : weeks.length === 0 ? (
        /* Empty State: No weeks initialized yet */
        <Card id="logbook-welcome-empty-state" className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Welcome to Your Digital Logbook
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Start your industrial experience logbook by initializing <strong>Week 1</strong>. You will be able to record technical duties, diagnostic procedures, and equipment handled for each working day (Monday to Friday).
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleAddNextWeek}
              disabled={isAddingWeek}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm"
              id="btn-initialize-week-1"
            >
              <Plus className="w-4 h-4" />
              <span>Initialize Week 1</span>
            </Button>
          </div>
        </Card>
      ) : isLoadingActivities ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-emerald-600" />
          <p className="text-xs font-medium">Loading Week {selectedWeekNumber} daily activities...</p>
        </div>
      ) : (
        /* 5-Day Work Week Activity Cards */
        <section id="weekly-days-grid" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Week {selectedWeekNumber} Working Days (Monday – Friday)
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {completedDaysCount} of 5 recorded
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {SIWES_DAYS.map((day) => {
              const dateStr = workDayDates[day];
              const activity = activities.find((a) => a.day === day) || null;

              return (
                <DayActivityCard
                  key={day}
                  day={day}
                  dateStr={dateStr}
                  activity={activity}
                  isWeekEditable={isWeekEditable}
                  onAdd={handleOpenAddModal}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteModal}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* 7. MODALS */}
      {/* Activity Add/Edit Modal */}
      {isFormModalOpen && (
        <ActivityFormModal
          key={`${formTargetDay}-${formTargetDate}-${selectedActivityForEdit?.id || 'new'}`}
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveActivity}
          initialActivity={selectedActivityForEdit}
          day={formTargetDay}
          activityDate={formTargetDate}
          weekNumber={selectedWeekNumber}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        activity={selectedActivityForDelete}
      />
    </div>
  );
};
