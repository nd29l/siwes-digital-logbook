/**
 * @file src/pages/admin/remarks/AdminRemarksPage.tsx
 * @description Production Supervisor Remarks & Correction Feedback Directory for Module 12.
 * 
 * Features:
 * 1. Dedicated overview of all supervisor remarks, commendations, and student correction directives.
 * 2. Category filters (Correction Instructions, Commendation Remarks, All Evaluated Weeks).
 * 3. Search by student legal name, matriculation number, department, or remarks content.
 * 4. Modal editor for updating supervisor remarks and correction instructions.
 * 5. Direct navigation to the Report Review Queue for inspecting 5-day daily activity logs.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks';
import {
  getAdminRemarksList,
  updateReportRemarks,
} from '@/services';
import {
  AdminFeedbackItem,
  FeedbackFilterOptions,
  UpdateReportRemarksInput,
  RouteId,
} from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RemarksFilterToolbar } from './RemarksFilterToolbar';
import { RemarksListTable } from './RemarksListTable';
import { EditRemarksModal } from './EditRemarksModal';
import {
  MessageSquareText,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';

interface AdminRemarksPageProps {
  onNavigate?: (routeId: RouteId) => void;
}

export const AdminRemarksPage: React.FC<AdminRemarksPageProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();

  // State: List & Filters
  const [items, setItems] = useState<AdminFeedbackItem[]>([]);
  const [filters, setFilters] = useState<FeedbackFilterOptions>({
    searchQuery: '',
    feedbackType: 'all_with_feedback',
    department: 'all',
    sortBy: 'reviewed_desc',
  });

  // State: UI & Feedback
  const [isLoading, setIsLoading] = useState(() => Boolean(user?.id));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal
  const [selectedItem, setSelectedItem] = useState<AdminFeedbackItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 1. Load remarks list
  const loadRemarks = async (isManual = false) => {
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
      const res = await getAdminRemarksList(filters);
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to load remarks directory.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred while loading remarks.'
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

    getAdminRemarksList(filters)
      .then((res) => {
        if (isCancelled) return;
        if (res.success && res.data) {
          setItems(res.data);
        } else {
          setErrorMessage(res.error || 'Failed to load remarks directory.');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'An error occurred while fetching remarks.'
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

  // Extract distinct departments from loaded items
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.student?.department && item.student.department.trim()) {
        set.add(item.student.department.trim());
      }
    });
    return Array.from(set).sort();
  }, [items]);

  // Category counts
  const categoryCounts = useMemo(() => {
    let returned = 0;
    let approved = 0;
    let allWithFeedback = 0;

    items.forEach((item) => {
      if (item.admin_feedback || item.admin_remark) allWithFeedback++;
      if (item.status === 'returned' || Boolean(item.admin_feedback)) returned++;
      if (item.status === 'approved' || Boolean(item.admin_remark)) approved++;
    });

    return {
      allWithFeedback,
      returned,
      approved,
      all: items.length,
    };
  }, [items]);

  // Handlers
  const handleEditRemarks = (item: AdminFeedbackItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleViewReport = (item: AdminFeedbackItem) => {
    if (onNavigate) {
      onNavigate('admin-reports');
    }
  };

  const handleUpdateRemarksSubmit = async (data: UpdateReportRemarksInput) => {
    if (!user?.id) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await updateReportRemarks(user.id, data);
      if (res.success && res.data) {
        setSuccessMessage('Supervisor remarks have been successfully saved!');
        setIsEditModalOpen(false);
        loadRemarks(true);
      } else {
        throw new Error(res.error || 'Failed to save remarks.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error updating remarks.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="admin-remarks-page" className="space-y-6">
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
              Supervisor Remarks & Feedback
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track institutional supervisor remarks, monitor student correction directives, and inspect student logbook feedback.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadRemarks(true)}
            disabled={isRefreshing || isLoading}
            className="text-xs text-slate-600"
            title="Refresh remarks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>

          {onNavigate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('admin-reports')}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs"
            >
              <FileCheck className="w-3.5 h-3.5 mr-1" />
              <span>Review Queue</span>
            </Button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {successMessage && (
        <div
          id="remarks-success-banner"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Remarks Saved</span>
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
          id="remarks-error-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Notice</span>
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

      {/* 2. SUMMARY METRIC PILLS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Reports with Feedback</span>
            <span className="text-xl font-bold font-mono text-purple-950">{categoryCounts.allWithFeedback}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Correction Directives Issued</span>
            <span className="text-xl font-bold font-mono text-rose-900">{categoryCounts.returned}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Commendation Notes</span>
            <span className="text-xl font-bold font-mono text-emerald-900">{categoryCounts.approved}</span>
          </div>
        </Card>
      </div>

      {/* 3. FILTER TOOLBAR */}
      <RemarksFilterToolbar
        filters={filters}
        onFilterChange={setFilters}
        availableDepartments={availableDepartments}
        totalResults={items.length}
        categoryCounts={categoryCounts}
      />

      {/* 4. REMARKS DIRECTORY TABLE */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-slate-500 font-medium">Loading supervisor remarks from database...</p>
        </div>
      ) : (
        <RemarksListTable
          items={items}
          onEditRemarks={handleEditRemarks}
          onViewReport={handleViewReport}
        />
      )}

      {/* 5. EDIT REMARKS MODAL */}
      <EditRemarksModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={selectedItem}
        onSubmit={handleUpdateRemarksSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
