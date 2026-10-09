/**
 * @file src/pages/admin/reports/ReportReviewModal.tsx
 * @description Deep inspection modal displaying a student's weekly report, 5-day daily activities,
 * reviewer sign-off, and endorsement/return action triggers.
 */

import React, { useEffect, useState } from 'react';
import {
  AdminReportReviewItem,
  AdminReportDetailView,
  DailyActivityRow,
  WeekStatus,
} from '@/types';
import { getAdminReportDetails } from '@/services';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils';
import {
  User,
  GraduationCap,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Wrench,
  BookOpen,
  ShieldCheck,
  Undo2,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AdminReportReviewItem | null;
  onApprove: (report: AdminReportReviewItem) => void;
  onReturn: (report: AdminReportReviewItem) => void;
}

interface ReportReviewContentProps {
  report: AdminReportReviewItem;
  onClose: () => void;
  onApprove: (report: AdminReportReviewItem) => void;
  onReturn: (report: AdminReportReviewItem) => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

const ReportReviewContent: React.FC<ReportReviewContentProps> = ({
  report,
  onClose,
  onApprove,
  onReturn,
}) => {
  const [detail, setDetail] = useState<AdminReportDetailView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    getAdminReportDetails(report.id)
      .then((res) => {
        if (isCancelled) return;
        if (res.success && res.data) {
          setDetail(res.data);
        } else {
          setFetchError(res.error || 'Failed to load report details.');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setFetchError(err instanceof Error ? err.message : 'Error fetching report.');
      })
      .finally(() => {
        if (isCancelled) return;
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [report.id]);

  const getStatusBadge = (status: WeekStatus) => {
    switch (status) {
      case 'submitted':
        return (
          <Badge variant="warning" size="md">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="success" size="md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Endorsed & Approved
          </Badge>
        );
      case 'returned':
        return (
          <Badge variant="danger" size="md">
            <AlertTriangle className="w-3.5 h-3.5" />
            Returned for Revision
          </Badge>
        );
      case 'draft':
      default:
        return (
          <Badge variant="neutral" size="md">
            <FileText className="w-3.5 h-3.5" />
            Draft (In Progress)
          </Badge>
        );
    }
  };

  const student = detail?.student || report.student;
  const activities = detail?.activities || [];

  // Group activities by day of week
  const activityByDay = new Map<string, DailyActivityRow>();
  activities.forEach((act) => {
    activityByDay.set(act.day, act);
  });

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-slate-50 to-purple-50 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            {student?.full_name?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                {student?.full_name || 'Unassigned Student'}
              </h3>
              <span className="font-mono text-xs text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md font-semibold">
                {student?.matric_number || 'Matric Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {student?.department || 'Department Unset'} &bull; {student?.organisation || 'Placement Unset'}
            </p>
          </div>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          {getStatusBadge(detail?.status || report.status)}
        </div>
      </div>

      {/* 2. Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-center">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-2xs uppercase block">Cycle</span>
          <span className="font-bold text-slate-900 font-mono text-sm">Week {report.week_number}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-2xs uppercase block">Submitted</span>
          <span className="font-mono text-slate-800 text-2xs">
            {report.submitted_at ? formatDate(report.submitted_at) : 'Draft'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-2xs uppercase block">Activities</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {activities.length} / 5 Days
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-2xs uppercase block">Reviewed By</span>
          <span className="font-medium text-slate-800 text-2xs truncate block">
            {detail?.reviewer?.full_name || (report.reviewed_at ? 'Administrator' : 'Pending')}
          </span>
        </div>
      </div>

      {/* 3. Existing Remarks / Return Feedback Display */}
      {detail?.admin_feedback && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Return Instructions Provided to Student:</span>
          </div>
          <p className="text-rose-800 leading-relaxed pl-5 font-mono">
            &quot;{detail.admin_feedback}&quot;
          </p>
        </div>
      )}

      {detail?.admin_remark && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Supervisor Endorsement Remark:</span>
          </div>
          <p className="text-emerald-800 leading-relaxed pl-5 font-mono">
            &quot;{detail.admin_remark}&quot;
          </p>
        </div>
      )}

      {/* 4. 5-Day Daily Activities Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-700" />
            <span>5-Day Technical Activity Log (Monday – Friday)</span>
          </h4>
          <span className="text-2xs text-slate-500 font-mono">
            {activities.length} of 5 recorded
          </span>
        </div>

        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            <p className="text-xs text-slate-500 font-medium">Loading daily logbook entries...</p>
          </div>
        ) : fetchError ? (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {fetchError}
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {DAYS_OF_WEEK.map((dayName) => {
              const activity = activityByDay.get(dayName);

              if (!activity) {
                return (
                  <div
                    key={dayName}
                    className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-600 min-w-[70px]">{dayName}</span>
                      <span className="text-slate-400 italic">No activity entry recorded for this day</span>
                    </div>
                    <Badge variant="neutral" size="sm">
                      Missing
                    </Badge>
                  </div>
                );
              }

              return (
                <div
                  key={activity.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-xs">
                        {activity.day}
                      </span>
                      <span className="text-2xs text-slate-500 font-mono">
                        {formatDate(activity.activity_date)}
                      </span>
                    </div>

                    <Badge variant="success" size="sm">
                      Documented
                    </Badge>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{activity.title}</h5>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-line">
                      {activity.activity}
                    </p>
                  </div>

                  {activity.equipment_used && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-2xs text-slate-600">
                      <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700">Tools / Equipment:</span>
                      <span className="font-mono truncate">{activity.equipment_used}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Review Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <Button type="button" variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
          Close
        </Button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Return for correction: Enabled if submitted */}
          {(report.status === 'submitted' || report.status === 'approved') && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => onReturn(report)}
              className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs w-full sm:w-auto"
              id="btn-trigger-return-modal"
            >
              <Undo2 className="w-3.5 h-3.5 mr-1" />
              <span>Return for Correction</span>
            </Button>
          )}

          {/* Approve Report: Enabled if submitted or returned */}
          {report.status !== 'approved' && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => onApprove(report)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs w-full sm:w-auto"
              id="btn-trigger-approve-modal"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>Approve & Endorse</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  isOpen,
  onClose,
  report,
  onApprove,
  onReturn,
}) => {
  if (!report) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Weekly Report Review: Week ${report.week_number}`}
      description={`Student: ${report.student?.full_name || 'Student'} • Directorate Evaluation`}
      size="xl"
      id="report-review-modal"
    >
      <ReportReviewContent
        key={report.id}
        report={report}
        onClose={onClose}
        onApprove={onApprove}
        onReturn={onReturn}
      />
    </Modal>
  );
};
