/**
 * @file src/pages/admin/reports/ApproveConfirmationModal.tsx
 * @description Accessible confirmation modal for endorsing and approving a student's weekly report.
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, ShieldCheck, MessageSquare } from 'lucide-react';

interface ApproveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (adminRemark?: string) => Promise<void>;
  studentName: string;
  weekNumber: number;
  isSubmitting: boolean;
}

export const ApproveConfirmationModal: React.FC<ApproveConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  weekNumber,
  isSubmitting,
}) => {
  const [adminRemark, setAdminRemark] = useState('');

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(adminRemark);
    setAdminRemark('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Approve & Endorse Weekly Report"
      description={`Week ${weekNumber} • ${studentName}`}
      size="md"
      id="approve-confirmation-modal"
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        {/* Notice Card */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Official Directorate Endorsement</span>
          </div>
          <p className="text-emerald-800 leading-relaxed">
            By approving this weekly report, you certify that the student&apos;s daily activities and technical skills meet institutional SIWES guidelines.
          </p>
        </div>

        {/* Optional Administrative Remark / Commendation */}
        <div className="space-y-1.5">
          <label
            htmlFor="approve-admin-remark"
            className="block text-xs font-semibold text-slate-700"
          >
            Supervisor Commendation / Remarks (Optional)
          </label>
          <textarea
            id="approve-admin-remark"
            rows={3}
            placeholder="e.g. Excellent procedural documentation. Strong demonstration of diagnostic equipment proficiency."
            value={adminRemark}
            onChange={(e) => setAdminRemark(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[150px]"
            id="btn-confirm-approval"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Endorsing...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Confirm & Approve
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
