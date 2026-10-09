/**
 * @file src/pages/admin/reports/ReturnCorrectionModal.tsx
 * @description Accessible confirmation modal for returning a weekly report with corrective instructions.
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { AlertTriangle, Undo2 } from 'lucide-react';

interface ReturnCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (returnReason: string) => Promise<void>;
  studentName: string;
  weekNumber: number;
  isSubmitting: boolean;
}

export const ReturnCorrectionModal: React.FC<ReturnCorrectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  weekNumber,
  isSubmitting,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length < 5) {
      setError('Please provide a constructive reason explaining what the student needs to revise.');
      return;
    }

    setError(null);
    await onConfirm(trimmed);
    setReason('');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    setReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Return Report for Correction"
      description={`Week ${weekNumber} • ${studentName}`}
      size="md"
      id="return-correction-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Advisory Warning */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Re-opening Report for Student Revision</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            The student will receive your constructive feedback and will be permitted to edit their daily activities before resubmitting.
          </p>
        </div>

        {/* Mandatory Return Reason */}
        <Textarea
          id="return-reason-textarea"
          label="Required Correction Feedback"
          required
          rows={4}
          placeholder="e.g. Wednesday activity lacks details regarding equipment calibration. Please elaborate on safety procedures and diagnostic tools used before resubmitting."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null);
          }}
          disabled={isSubmitting}
          error={error || undefined}
          helperText="Explain specifically which days, procedures, or tool details require updates before approval."
        />

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            className="bg-rose-600 hover:bg-rose-500 text-white min-w-[160px]"
            id="btn-confirm-return"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Returning...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Undo2 className="w-4 h-4" />
                Return for Revision
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
