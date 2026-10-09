/**
 * @file src/pages/student/weekly-reports/SubmissionConfirmModal.tsx
 * @description Confirmation and student declaration modal for weekly report submission.
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LogbookWeekRow, DailyActivityRow } from '@/types';
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface SubmissionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  week: LogbookWeekRow | null;
  activities: DailyActivityRow[];
  weekDateRange: string;
  isSubmitting: boolean;
}

export const SubmissionConfirmModal: React.FC<SubmissionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  week,
  activities,
  weekDateRange,
  isSubmitting,
}) => {
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  if (!week) return null;

  const loggedDaysCount = activities.length;
  const isResubmission = week.status === 'returned';

  const handleSubmit = async () => {
    if (!declarationChecked) {
      setErrorText('Please confirm the student declaration before submitting.');
      return;
    }
    setErrorText(null);
    try {
      await onConfirm();
      setDeclarationChecked(false);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    }
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    setDeclarationChecked(false);
    setErrorText(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={isResubmission ? `Resubmit Week ${week.week_number} Report` : `Submit Week ${week.week_number} Report`}
      size="md"
    >
      <div className="space-y-4">
        {/* Overview Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Logbook Period
            </span>
            <Badge variant="neutral" size="sm">
              Week {week.week_number}
            </Badge>
          </div>
          <div className="text-sm font-bold text-slate-900">{weekDateRange}</div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-600">Daily activities recorded:</span>
            <span className={`font-bold font-mono ${loggedDaysCount === 5 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {loggedDaysCount} of 5 Work Days
            </span>
          </div>
        </div>

        {/* Warning if fewer than 5 days logged */}
        {loggedDaysCount < 5 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Partial Week Detected</span>
              <span>
                You have recorded activities for {loggedDaysCount} out of 5 work days. If you had official holidays, sick days, or excused absences, you may proceed with submission.
              </span>
            </div>
          </div>
        )}

        {/* Lock Notice */}
        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-900 text-xs flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Submission Lock Notice</span>
            <span>
              Once submitted, this weekly report will transition to <strong>Awaiting Review</strong> status and become locked against further edits until assessed by your supervisor.
            </span>
          </div>
        </div>

        {/* Student Declaration Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              id="student-declaration-checkbox"
              checked={declarationChecked}
              onChange={(e) => {
                setDeclarationChecked(e.target.checked);
                if (e.target.checked) setErrorText(null);
              }}
              disabled={isSubmitting}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900 block font-semibold mb-0.5">
                Student Integrity Declaration:
              </strong>
              I confirm that all tasks, technical descriptions, and tools recorded in this Week {week.week_number} report are accurate representations of my SIWES industrial training activities.
            </span>
          </label>
        </div>

        {/* Error Feedback */}
        {errorText && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleModalClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={isSubmitting || !declarationChecked}
            className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[140px] w-full sm:w-auto"
            id="confirm-submit-weekly-report-btn"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                {isResubmission ? 'Resubmit Report' : 'Submit Report'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
