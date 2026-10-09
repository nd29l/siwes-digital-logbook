/**
 * @file src/pages/admin/dashboard/AdminRecentSubmissionsTable.tsx
 * @description Responsive table and card list of recent weekly report submissions for administrators.
 */

import React from 'react';
import { AdminRecentSubmission, RouteId, WeekStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ArrowRight,
  Inbox,
  ExternalLink,
} from 'lucide-react';

interface AdminRecentSubmissionsTableProps {
  submissions: AdminRecentSubmission[];
  onNavigate?: (routeId: RouteId) => void;
}

export const AdminRecentSubmissionsTable: React.FC<AdminRecentSubmissionsTableProps> = ({
  submissions,
  onNavigate,
}) => {
  const getStatusBadge = (status: WeekStatus) => {
    switch (status) {
      case 'submitted':
        return (
          <Badge variant="info" size="sm">
            <Clock className="w-3 h-3" />
            Pending Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3" />
            Approved
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
            <FileText className="w-3 h-3" />
            Draft
          </Badge>
        );
    }
  };

  if (!submissions || submissions.length === 0) {
    return (
      <div
        id="admin-submissions-empty-state"
        className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3"
      >
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <Inbox className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-800">No Weekly Submissions Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When students compile their daily logbooks and submit weekly reports for review, they will appear here in chronological order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-recent-submissions-section" className="space-y-3">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/90 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Logbook Week</th>
              <th className="py-3 px-4">Submitted Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.map((item) => {
              const studentName = item.student?.full_name || 'Unassigned Student';
              const matricNo = item.student?.matric_number || 'Matric Pending';
              const department = item.student?.department || 'Department Unset';
              const submittedDateStr = item.submitted_at
                ? formatDate(item.submitted_at)
                : 'Not submitted yet';

              return (
                <tr
                  key={item.id}
                  id={`recent-sub-row-${item.id}`}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {studentName}
                        </div>
                        <div className="text-slate-500 text-2xs truncate">
                          <span className="font-mono">{matricNo}</span> &bull; {department}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">
                    <span className="font-bold">Week {item.week_number}</span>
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {submittedDateStr}
                  </td>

                  <td className="py-3 px-4">
                    {getStatusBadge(item.status)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('admin-reports')}
                        className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-semibold transition-colors cursor-pointer text-xs"
                        title="Open in Review Queue"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack */}
      <div className="md:hidden space-y-2.5">
        {submissions.map((item) => {
          const studentName = item.student?.full_name || 'Unassigned Student';
          const matricNo = item.student?.matric_number || 'Matric Pending';
          const submittedDateStr = item.submitted_at
            ? formatDate(item.submitted_at)
            : 'Not submitted yet';

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {studentName}
                  </div>
                  <div className="text-2xs text-slate-500 font-mono">
                    {matricNo}
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Week {item.week_number}</span>
                <span className="text-slate-500 font-mono text-2xs">{submittedDateStr}</span>
              </div>

              {onNavigate && (
                <div className="pt-1 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('admin-reports')}
                    className="text-2xs py-1 px-2.5 text-purple-700 border-purple-200"
                  >
                    <span>Inspect Report</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
