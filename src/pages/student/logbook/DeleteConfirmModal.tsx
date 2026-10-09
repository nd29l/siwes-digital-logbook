/**
 * @file src/pages/student/logbook/DeleteConfirmModal.tsx
 * @description Accessible confirmation dialog for deleting a daily logbook activity.
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DailyActivityRow } from '@/types';
import { formatDate } from '@/utils';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
  activity: DailyActivityRow | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  activity,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!activity) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await onConfirm();
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to delete activity entry.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred while deleting.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Daily Activity"
      size="sm"
      id="delete-activity-modal"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600 text-xs shadow-sm"
            id="confirm-delete-activity-btn"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Activity</span>
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-xs sm:text-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <p className="font-semibold text-slate-900 text-sm">
            Are you sure you want to delete this activity entry?
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            This will permanently remove the logbook record for{' '}
            <strong className="text-slate-800">{activity.day} ({formatDate(activity.activity_date)})</strong>.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <span className="text-slate-500 block text-2xs uppercase tracking-wider font-semibold">Entry to be removed:</span>
          <p className="font-bold text-slate-900">{activity.title}</p>
          <p className="text-slate-600 line-clamp-2">{activity.activity}</p>
        </div>

        {errorMessage && (
          <p className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errorMessage}
          </p>
        )}
      </div>
    </Modal>
  );
};
