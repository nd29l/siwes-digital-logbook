/**
 * @file src/pages/student/weekly-reports/WeeklyStatusBanner.tsx
 * @description Comprehensive status banner for weekly reports indicating draft, submitted, approved, or returned state with reviewer feedback.
 */

import React from 'react';
import { LogbookWeekRow, WeekStatus, RouteId } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  MessageSquare,
  ShieldCheck,
  Calendar,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface WeeklyStatusBannerProps {
  week: LogbookWeekRow;
  activitiesCount: number;
  onNavigate?: (routeId: RouteId) => void;
}

export const WeeklyStatusBanner: React.FC<WeeklyStatusBannerProps> = ({
  week,
  activitiesCount,
  onNavigate,
}) => {
  const { status, submitted_at, reviewed_at, admin_remark, admin_feedback } = week;

  switch (status) {
    case 'approved':
      return (
        <div
          id="weekly-status-banner-approved"
          className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 text-emerald-950 shadow-2xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-emerald-900">
                    Weekly Report Endorsed & Approved
                  </h3>
                  <Badge variant="success" size="sm">
                    Finalized
                  </Badge>
                </div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Your supervisor has evaluated and officially signed off on your Week {week.week_number} activities.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-lg shrink-0">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Immutable Record</span>
            </div>
          </div>

          {/* Review Timestamps & Supervisor Remarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 text-emerald-900">
              {submitted_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Submitted on: {formatDate(submitted_at)}</span>
                </div>
              )}
              {reviewed_at && (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Approved on: {formatDate(reviewed_at)}</span>
                </div>
              )}
            </div>

            {(admin_remark || admin_feedback) && (
              <div className="p-3 rounded-xl bg-emerald-100/70 border border-emerald-200 text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Supervisor Endorsement Note:</span>
                </div>
                {admin_remark && <p className="italic">{admin_remark}</p>}
                {admin_feedback && (
                  <p className="text-2xs text-emerald-800 pt-1 border-t border-emerald-200">
                    {admin_feedback}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      );

    case 'submitted':
      return (
        <div
          id="weekly-status-banner-submitted"
          className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-2 border-sky-300 text-sky-950 shadow-2xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-200 text-sky-800 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-sky-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-sky-950">
                    Weekly Report Submitted — Pending Review
                  </h3>
                  <Badge variant="info" size="sm">
                    Awaiting Endorsement
                  </Badge>
                </div>
                <p className="text-xs text-sky-800 mt-0.5">
                  This report has been transmitted to your supervisor. Editing is locked while awaiting review.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-sky-800 bg-sky-100/80 px-3 py-1.5 rounded-lg shrink-0">
              <Lock className="w-3.5 h-3.5 text-sky-600" />
              <span>Locked for Assessment</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-sky-900">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-700" />
              <span>
                Submitted on: <strong>{submitted_at ? formatDate(submitted_at) : 'Just now'}</strong>
              </span>
            </div>
            <span className="text-sky-700 italic">
              If your supervisor requests revisions, the report will be returned for updating.
            </span>
          </div>
        </div>
      );

    case 'returned':
      return (
        <div
          id="weekly-status-banner-returned"
          className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 text-amber-950 shadow-2xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-amber-950">
                    Report Returned for Corrections
                  </h3>
                  <Badge variant="warning" size="sm">
                    Action Required
                  </Badge>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  Your supervisor has evaluated this report and returned it with requested corrections. You can edit your activities in the Daily Logbook and resubmit.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-lg shrink-0">
              <span>Editing Unlocked</span>
            </div>
          </div>

          {/* Supervisor Feedback Box */}
          <div className="p-4 rounded-xl bg-white/95 border border-amber-200 text-amber-950 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <MessageSquare className="w-4 h-4 text-amber-700" />
              <span>Supervisor Feedback & Required Updates:</span>
            </div>

            {/* Display Return Feedback (primary instructions) */}
            {admin_feedback && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950">
                <span className="font-bold block text-amber-900 mb-0.5">Required Revision Instructions:</span>
                <p className="italic font-mono leading-relaxed whitespace-pre-line">&quot;{admin_feedback}&quot;</p>
              </div>
            )}

            {/* Display General Remarks if present */}
            {admin_remark && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
                <span className="font-bold block text-slate-900 mb-0.5">Supervisor Remark:</span>
                <p className="italic font-mono leading-relaxed whitespace-pre-line">&quot;{admin_remark}&quot;</p>
              </div>
            )}

            {!admin_feedback && !admin_remark && (
              <p className="text-xs text-amber-800 italic pl-2">
                Please review daily activity descriptions and ensure technical details and equipment used are accurate.
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-amber-100 text-2xs">
              {reviewed_at ? (
                <span className="text-amber-700 font-mono">
                  Returned on {formatDate(reviewed_at)}
                </span>
              ) : <span />}

              {onNavigate && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('student-logbook')}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs py-1 px-3 self-end sm:self-auto"
                  id="btn-correct-in-logbook"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1" />
                  <span>Open Daily Logbook to Correct Entries</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      );

    case 'draft':
    default:
      return (
        <div
          id="weekly-status-banner-draft"
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Draft Report in Progress
                  </h3>
                  <Badge variant="neutral" size="sm">
                    Draft
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Review your 5 working days below. When all technical entries are ready, submit this report for supervisor endorsement.
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium sm:text-right shrink-0">
              <span>{activitiesCount} of 5 days logged</span>
            </div>
          </div>
        </div>
      );
  }
};
