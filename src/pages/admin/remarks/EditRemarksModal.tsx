/**
 * @file src/pages/admin/remarks/EditRemarksModal.tsx
 * @description Accessible modal form for administrators to modify supervisor remarks and correction feedback on a weekly report.
 */

import React, { useState } from 'react';
import { AdminFeedbackItem, UpdateReportRemarksInput } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface EditRemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AdminFeedbackItem | null;
  onSubmit: (data: UpdateReportRemarksInput) => Promise<void>;
  isSubmitting: boolean;
}

interface EditRemarksFormProps {
  item: AdminFeedbackItem;
  onClose: () => void;
  onSubmit: (data: UpdateReportRemarksInput) => Promise<void>;
  isSubmitting: boolean;
}

const EditRemarksForm: React.FC<EditRemarksFormProps> = ({
  item,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [adminRemark, setAdminRemark] = useState(item.admin_remark || '');
  const [adminFeedback, setAdminFeedback] = useState(item.admin_feedback || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit({
        weekId: item.id,
        admin_remark: adminRemark.trim() || null,
        admin_feedback: adminFeedback.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update remarks.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Student & Week Summary Header */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-500 block text-2xs uppercase">Student</span>
          <span className="font-bold text-slate-900">
            {item.student?.full_name || 'Student'} ({item.student?.matric_number || 'Matric Pending'})
          </span>
        </div>

        <div className="text-right">
          <span className="text-slate-500 block text-2xs uppercase">Cycle</span>
          <span className="font-bold text-purple-700 font-mono">Week {item.week_number}</span>
        </div>
      </div>

      {/* 1. Supervisor Commendation / Endorsement Note */}
      <Textarea
        id="edit-admin-remark"
        label="Supervisor Commendation / General Remarks"
        rows={3}
        placeholder="e.g. Excellent attention to diagnostic safety procedures and clear task documentation."
        value={adminRemark}
        onChange={(e) => setAdminRemark(e.target.value)}
        disabled={isSubmitting}
        helperText="Positive reinforcement or general observations visible on the student's approved report."
      />

      {/* 2. Correction Feedback / Revision Directives */}
      <div className="pt-2 border-t border-slate-100">
        <Textarea
          id="edit-admin-feedback"
          label="Correction Directives / Revision Feedback"
          rows={3}
          placeholder="e.g. Thursday entry requires more detail regarding the network configuration steps performed."
          value={adminFeedback}
          onChange={(e) => setAdminFeedback(e.target.value)}
          disabled={isSubmitting}
          helperText="Specific corrective instructions for the student when a report is returned or pending adjustment."
        />
      </div>

      {/* Modal Actions */}
      <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-500 text-white min-w-[140px] w-full sm:w-auto"
          id="save-remarks-btn"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <span>Save Remarks</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export const EditRemarksModal: React.FC<EditRemarksModalProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit,
  isSubmitting,
}) => {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Edit Supervisor Remarks"
      description={`Week ${item.week_number} • ${item.student?.full_name || 'Student'}`}
      size="md"
      id="edit-remarks-modal"
    >
      <EditRemarksForm
        key={item.id}
        item={item}
        onClose={onClose}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
};
