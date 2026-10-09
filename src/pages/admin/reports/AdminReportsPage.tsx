/**
 * @file src/pages/admin/reports/AdminReportsPage.tsx
 * @description Production Administrator Weekly Report Review & Endorsement Queue for Module 11.
 * 
 * Features:
 * 1. Comprehensive list of submitted weekly logbook reports with real Supabase records.
 * 2. Status filtering (Pending Review, Approved, Returned, Drafts, All).
 * 3. Multi-field search (student name, matriculation, department, organisation, week).
 * 4. Deep inspection modal showing student details, week period, and 5-day daily activities (Mon-Fri).
 * 5. Official Directorate endorsement workflow (`approveWeeklyReport`).
 * 6. Return workflow requiring constructive feedback (`returnWeeklyReport`).
 * 7. Loading, empty, error, and retry states.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks';
import {
  getAdminReportsList,
  approveWeeklyReport,
  returnWeeklyReport,
} from '@/services';
import {
  AdminReportReviewItem,
  ReportFilterOptions,
  RouteId,
} from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ReportFilterToolbar } from './ReportFilterToolbar';
import { ReportListTable } from './ReportListTable';
import { ReportReviewModal } from './ReportReviewModal';
import { ApproveConfirmationModal } from './ApproveConfirmationModal';
import { ReturnCorrectionModal } from './ReturnCorrectionModal';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface AdminReportsPageProps {
  onNavigate?: (routeId: RouteId) => void;
}

export const AdminReportsPage: React.FC<AdminReportsPageProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();

  // State: Reports & Filter Criteria
  const [reports, setReports] = useState<AdminReportReviewItem[]>([]);
  const [filters, setFilters] = useState<ReportFilterOptions>({
    searchQuery: '',
    status: 'submitted', // Default to Pending Review queue
    department: 'all',
    sortBy: 'submitted_desc',
  });

  // State: UI & Feedback
  const [isLoading, setIsLoading] = useState(() => Boolean(user?.id));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [selectedReport, setSelectedReport] = useState<AdminReportReviewItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // 1. Load reports list
  const loadReports = async (isManual = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const res = await getAdminReportsList(filters);
      if (res.success && res.data) {
        setReports(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to load weekly reports queue.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred while loading reports.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const adminId = user?.id;

    if (!adminId) return;

    getAdminReportsList(filters)
      .then((res) => {
        if (isCancelled) return;
        if (res.success && res.data) {
          setReports(res.data);
        } else {
          setErrorMessage(res.error || 'Failed to load weekly reports queue.');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'An error occurred while fetching reports.'
        );
      })
      .finally(() => {
        if (isCancelled) return;
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.id, filters]);

  // Extract distinct departments from loaded reports
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.student?.department && r.student.department.trim()) {
        set.add(r.student.department.trim());
      }
    });
    return Array.from(set).sort();
  }, [reports]);

  // Compute status counts
  const statusCounts = useMemo(() => {
    let submitted = 0;
    let approved = 0;
    let returned = 0;
    let draft = 0;

    reports.forEach((r) => {
      if (r.status === 'submitted') submitted++;
      else if (r.status === 'approved') approved++;
      else if (r.status === 'returned') returned++;
      else if (r.status === 'draft') draft++;
    });

    return {
      all: reports.length,
      submitted,
      approved,
      returned,
      draft,
    };
  }, [reports]);

  // Handlers
  const handleSelectReport = (report: AdminReportReviewItem) => {
    setSelectedReport(report);
    setIsReviewModalOpen(true);
  };

  const handleTriggerApprove = (report: AdminReportReviewItem) => {
    setSelectedReport(report);
    setIsApproveModalOpen(true);
  };

  const handleTriggerReturn = (report: AdminReportReviewItem) => {
    setSelectedReport(report);
    setIsReturnModalOpen(true);
  };

  const handleConfirmApproval = async (adminRemark?: string) => {
    if (!user?.id || !selectedReport) return;
    setIsSubmittingAction(true);
    setErrorMessage(null);

    try {
      const res = await approveWeeklyReport(user.id, {
        weekId: selectedReport.id,
        adminRemark,
      });

      if (res.success && res.data) {
        setSuccessMessage(
          `Week ${selectedReport.week_number} report for "${selectedReport.student?.full_name || 'Student'}" has been approved and officially endorsed!`
        );
        setIsApproveModalOpen(false);
        setIsReviewModalOpen(false);
        loadReports(true);
      } else {
        throw new Error(res.error || 'Failed to approve weekly report.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error approving weekly report.'
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleConfirmReturn = async (returnReason: string) => {
    if (!user?.id || !selectedReport) return;
    setIsSubmittingAction(true);
    setErrorMessage(null);

    try {
      const res = await returnWeeklyReport(user.id, {
        weekId: selectedReport.id,
        returnReason,
      });

      if (res.success && res.data) {
        setSuccessMessage(
          `Week ${selectedReport.week_number} report for "${selectedReport.student?.full_name || 'Student'}" has been returned with revision instructions.`
        );
        setIsReturnModalOpen(false);
        setIsReviewModalOpen(false);
        loadReports(true);
      } else {
        throw new Error(res.error || 'Failed to return weekly report.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error returning weekly report.'
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div id="admin-reports-page" className="space-y-6">
      {/* 1. TOP HEADER & DIRECTORATE ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('admin-dashboard')}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 -ml-1 rounded-lg cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Weekly Report Review Queue
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review student 5-day daily activity logs, verify technical descriptions, endorse approved weeks, or return for corrections.
          </p>
        </div>

        {/* Refresh Action */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadReports(true)}
            disabled={isRefreshing || isLoading}
            className="text-xs text-slate-600"
            title="Refresh queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Queue'}</span>
          </Button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {successMessage && (
        <div
          id="report-review-success-banner"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Status Updated</span>
              <span>{successMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs p-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          id="report-review-error-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Review Notice</span>
              <span>{errorMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold text-xs p-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Pending Review</span>
            <span className="text-xl font-bold font-mono text-amber-900">
              {statusCounts.submitted}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Approved & Signed</span>
            <span className="text-xl font-bold font-mono text-emerald-900">
              {statusCounts.approved}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Returned for Revision</span>
            <span className="text-xl font-bold font-mono text-rose-900">
              {statusCounts.returned}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Drafts In Progress</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {statusCounts.draft}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <ReportFilterToolbar
        filters={filters}
        onFilterChange={setFilters}
        availableDepartments={availableDepartments}
        totalResults={reports.length}
        statusCounts={statusCounts}
      />

      {/* 4. REPORTS LIST TABLE */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-slate-500 font-medium">Querying submitted weekly reports from database...</p>
        </div>
      ) : (
        <ReportListTable
          reports={reports}
          onSelectReport={handleSelectReport}
        />
      )}

      {/* 5. MODALS */}
      <ReportReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        report={selectedReport}
        onApprove={handleTriggerApprove}
        onReturn={handleTriggerReturn}
      />

      <ApproveConfirmationModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleConfirmApproval}
        studentName={selectedReport?.student?.full_name || 'Student'}
        weekNumber={selectedReport?.week_number || 1}
        isSubmitting={isSubmittingAction}
      />

      <ReturnCorrectionModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onConfirm={handleConfirmReturn}
        studentName={selectedReport?.student?.full_name || 'Student'}
        weekNumber={selectedReport?.week_number || 1}
        isSubmitting={isSubmittingAction}
      />
    </div>
  );
};
