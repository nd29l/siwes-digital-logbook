/**
 * @file src/pages/admin/reports/ReportListTable.tsx
 * @description Responsive table and card stack for inspecting and evaluating submitted weekly logbooks.
 */

import React from 'react';
import { AdminReportReviewItem, WeekStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  BookOpen,
  Calendar,
  FileCheck,
  Inbox,
  ArrowRight,
} from 'lucide-react';

interface ReportListTableProps {
  reports: AdminReportReviewItem[];
  onSelectReport: (report: AdminReportReviewItem) => void;
}

export const ReportListTable: React.FC<ReportListTableProps> = ({
  reports,
  onSelectReport,
}) => {
  const getStatusBadge = (status: WeekStatus) => {
    switch (status) {
      case 'submitted':
        return (
          <Badge variant="warning" size="sm">
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
          <Badge variant="danger" size="sm">
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

  if (!reports || reports.length === 0) {
    return (
      <EmptyState
        id="reports-empty-state"
        icon={Inbox}
        title="No Weekly Reports Found"
        description="There are no student weekly logbook submissions matching the selected status or department filter."
      />
    );
  }

  return (
    <div id="admin-reports-table-container" className="space-y-3">
      {/* 1. Desktop Table */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Student & Matric</th>
              <th className="py-3 px-4">Logbook Week</th>
              <th className="py-3 px-4">Submission Date</th>
              <th className="py-3 px-4">Daily Logs Recorded</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => {
              const studentName = report.student?.full_name || 'Unassigned Student';
              const matricNo = report.student?.matric_number || 'Matric Pending';
              const department = report.student?.department || 'Department Unassigned';
              const submittedDateStr = report.submitted_at
                ? formatDate(report.submitted_at)
                : 'Not submitted';

              return (
                <tr
                  key={report.id}
                  id={`report-row-${report.id}`}
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

                  {/* Logbook Week */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      Week {report.week_number}
                    </div>
                    <div className="text-2xs text-slate-500 truncate max-w-[170px]">
                      {report.student?.organisation || 'Placement Unset'}
                    </div>
                  </td>

                  {/* Submission Date */}
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                    {submittedDateStr}
                  </td>

                  {/* Activities Recorded */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="font-mono font-bold text-slate-800">
                        {report.activity_count} / 5 Days
                      </span>
                    </div>
                    {report.activity_count < 5 && report.status === 'submitted' && (
                      <span className="text-2xs text-amber-700 font-medium block mt-0.5">
                        Incomplete 5-day cycle
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    {getStatusBadge(report.status)}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onSelectReport(report)}
                      className={`text-xs px-3 py-1 cursor-pointer ${
                        report.status === 'submitted'
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                      id={`btn-review-report-${report.id}`}
                    >
                      <FileCheck className="w-3.5 h-3.5 mr-1" />
                      <span>{report.status === 'submitted' ? 'Review & Endorse' : 'Inspect Details'}</span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile & Tablet Card Stack */}
      <div className="lg:hidden space-y-3">
        {reports.map((report) => {
          const studentName = report.student?.full_name || 'Unassigned Student';
          const matricNo = report.student?.matric_number || 'Matric Pending';
          const submittedDateStr = report.submitted_at
            ? formatDate(report.submitted_at)
            : 'Not submitted';

          return (
            <div
              key={report.id}
              className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate">
                    {studentName}
                  </div>
                  <div className="text-2xs text-slate-500 font-mono">
                    {matricNo}
                  </div>
                </div>
                {getStatusBadge(report.status)}
              </div>

              {/* Week & Details */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-2xs uppercase">Logbook Cycle</span>
                  <span className="text-slate-800 font-bold">Week {report.week_number}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-2xs uppercase">Submitted</span>
                  <span className="text-slate-800 font-mono text-2xs">{submittedDateStr}</span>
                </div>
              </div>

              {/* Daily Logs Recorded */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Daily Logs Logged:</span>
                <span className="font-mono text-slate-900 font-bold">
                  {report.activity_count} of 5 Working Days
                </span>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onSelectReport(report)}
                  className={`w-full text-xs py-1.5 ${
                    report.status === 'submitted'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5 mr-1" />
                  <span>{report.status === 'submitted' ? 'Review & Endorse' : 'Inspect Report'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
