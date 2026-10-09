/**
 * @file src/pages/admin/remarks/RemarksListTable.tsx
 * @description Responsive table and card stack for inspecting and updating supervisor remarks and correction feedback.
 */

import React from 'react';
import { AdminFeedbackItem, WeekStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils';
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  User,
  Edit2,
  Calendar,
  ExternalLink,
  Inbox,
} from 'lucide-react';

interface RemarksListTableProps {
  items: AdminFeedbackItem[];
  onEditRemarks: (item: AdminFeedbackItem) => void;
  onViewReport: (item: AdminFeedbackItem) => void;
}

export const RemarksListTable: React.FC<RemarksListTableProps> = ({
  items,
  onEditRemarks,
  onViewReport,
}) => {
  const getStatusBadge = (status: WeekStatus) => {
    switch (status) {
      case 'returned':
        return (
          <Badge variant="danger" size="sm">
            <AlertTriangle className="w-3 h-3" />
            Returned
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="warning" size="sm">
            <Clock className="w-3 h-3" />
            Pending Review
          </Badge>
        );
      case 'draft':
      default:
        return (
          <Badge variant="neutral" size="sm">
            <FileText className="w-3 h-3" />
            Draft
          </Badge>
        );
    }
  };

  if (!items || items.length === 0) {
    return (
      <EmptyState
        id="remarks-empty-state"
        icon={Inbox}
        title="No Remarks or Feedback Found"
        description="There are currently no report remarks or correction notes matching your search criteria or category filter."
      />
    );
  }

  return (
    <div id="admin-remarks-table-container" className="space-y-3">
      {/* 1. Desktop Table */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Student & Matric</th>
              <th className="py-3 px-4">Logbook Week</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Supervisor Feedback & Remarks</th>
              <th className="py-3 px-4">Reviewed Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const studentName = item.student?.full_name || 'Unassigned Student';
              const matricNo = item.student?.matric_number || 'Matric Pending';
              const department = item.student?.department || 'Department Unassigned';
              const reviewDateStr = item.reviewed_at
                ? formatDate(item.reviewed_at)
                : 'Pending review';

              return (
                <tr
                  key={item.id}
                  id={`remarks-row-${item.id}`}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Student & Matric */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {studentName}
                        </div>
                        <div className="text-slate-500 text-2xs truncate">
                          <span className="font-mono font-medium text-slate-700">
                            {matricNo}
                          </span>{' '}
                          &bull; {department}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Week & Placement */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      Week {item.week_number}
                    </div>
                    <div className="text-2xs text-slate-500 truncate max-w-[170px]">
                      {item.student?.organisation || 'Placement Unset'}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* Remarks & Feedback Quote */}
                  <td className="py-3.5 px-4 max-w-[340px]">
                    <div className="space-y-1">
                      {item.admin_feedback && (
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-2xs">
                          <span className="font-bold block text-rose-950">Correction Directive:</span>
                          <span className="line-clamp-2 italic font-mono">&quot;{item.admin_feedback}&quot;</span>
                        </div>
                      )}

                      {item.admin_remark && (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-2xs">
                          <span className="font-bold block text-emerald-950">Commendation Note:</span>
                          <span className="line-clamp-2 italic font-mono">&quot;{item.admin_remark}&quot;</span>
                        </div>
                      )}

                      {!item.admin_feedback && !item.admin_remark && (
                        <span className="text-slate-400 italic text-2xs">
                          No written remarks recorded yet.
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Review Date & Reviewer */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-xs text-slate-700">
                      {reviewDateStr}
                    </div>
                    <div className="text-2xs text-slate-500 truncate max-w-[140px]">
                      By: {item.reviewer_name || 'Supervisor'}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEditRemarks(item)}
                        className="text-xs px-2.5 py-1 text-purple-700 border-purple-200 hover:bg-purple-50"
                        title="Edit remarks or feedback"
                        id={`btn-edit-remarks-${item.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onViewReport(item)}
                        className="text-xs px-2.5 py-1 text-slate-700 hover:text-slate-900"
                        title="Inspect full weekly report"
                        id={`btn-view-report-${item.id}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        <span>Inspect</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile & Tablet Card Stack */}
      <div className="lg:hidden space-y-3">
        {items.map((item) => {
          const studentName = item.student?.full_name || 'Unassigned Student';
          const matricNo = item.student?.matric_number || 'Matric Pending';

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate">
                    {studentName}
                  </div>
                  <div className="text-2xs text-slate-500 font-mono">
                    {matricNo} &bull; Week {item.week_number}
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>

              {/* Remarks Preview */}
              <div className="space-y-1.5 text-xs">
                {item.admin_feedback && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-2xs">
                    <span className="font-bold block text-rose-900">Correction Feedback:</span>
                    <span className="italic font-mono block mt-0.5">&quot;{item.admin_feedback}&quot;</span>
                  </div>
                )}

                {item.admin_remark && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-2xs">
                    <span className="font-bold block text-emerald-900">Commendation Note:</span>
                    <span className="italic font-mono block mt-0.5">&quot;{item.admin_remark}&quot;</span>
                  </div>
                )}

                {!item.admin_feedback && !item.admin_remark && (
                  <span className="text-slate-400 italic text-2xs">
                    No written remarks recorded.
                  </span>
                )}
              </div>

              {/* Review Date & Reviewer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
                <span className="font-mono">
                  {item.reviewed_at ? formatDate(item.reviewed_at) : 'Pending review'}
                </span>
                <span>By: {item.reviewer_name || 'Supervisor'}</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditRemarks(item)}
                  className="text-xs py-1.5 text-purple-700 border-purple-200"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  <span>Edit Remarks</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onViewReport(item)}
                  className="text-xs py-1.5 text-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  <span>Inspect Report</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
