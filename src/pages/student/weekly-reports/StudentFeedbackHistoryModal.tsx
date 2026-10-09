/**
 * @file src/pages/student/weekly-reports/StudentFeedbackHistoryModal.tsx
 * @description Accessible modal dialog displaying all historical supervisor remarks and feedback received by the student.
 */

import React, { useEffect, useState } from 'react';
import { StudentFeedbackItem, WeekStatus } from '@/types';
import { getStudentFeedbackHistory } from '@/services';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils';
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  RefreshCw,
  ArrowRight,
  Inbox,
} from 'lucide-react';

interface StudentFeedbackHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onSelectWeek: (weekNumber: number) => void;
}

interface StudentFeedbackContentProps {
  studentId: string;
  onClose: () => void;
  onSelectWeek: (weekNumber: number) => void;
}

const StudentFeedbackContent: React.FC<StudentFeedbackContentProps> = ({
  studentId,
  onClose,
  onSelectWeek,
}) => {
  const [items, setItems] = useState<StudentFeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    getStudentFeedbackHistory(studentId)
      .then((res) => {
        if (isCancelled) return;
        if (res.success && res.data) {
          setItems(res.data);
        } else {
          setError(res.error || 'Failed to load feedback history.');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : 'Error fetching feedback.');
      })
      .finally(() => {
        if (isCancelled) return;
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [studentId]);

  const getStatusBadge = (status: WeekStatus) => {
    switch (status) {
      case 'returned':
        return (
          <Badge variant="danger" size="sm">
            <AlertTriangle className="w-3 h-3" />
            Action Required
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
      default:
        return (
          <Badge variant="neutral" size="sm">
            <FileText className="w-3 h-3" />
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
          <p className="text-xs text-slate-500 font-medium">Loading supervisor feedback records...</p>
        </div>
      ) : error ? (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs space-y-2">
          <Inbox className="w-8 h-8 mx-auto text-slate-400" />
          <p className="font-semibold text-slate-700">No Supervisor Feedback Yet</p>
          <p className="max-w-xs mx-auto text-slate-500 text-2xs">
            As your weekly reports are reviewed and endorsed by your supervisor, institutional remarks and correction notes will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.week_id}
              className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                item.status === 'returned'
                  ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              {/* Header: Week & Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    Week {item.week_number}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSelectWeek(item.week_number);
                    onClose();
                  }}
                  className="text-2xs py-1 px-2.5 text-purple-700 border-purple-200 hover:bg-purple-50"
                >
                  <span>View Week {item.week_number}</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              {/* Feedback Content */}
              <div className="space-y-1.5">
                {item.admin_feedback && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-2xs">
                    <span className="font-bold block text-rose-900">Correction Instructions:</span>
                    <p className="italic font-mono mt-0.5 whitespace-pre-line">
                      &quot;{item.admin_feedback}&quot;
                    </p>
                  </div>
                )}

                {item.admin_remark && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-2xs">
                    <span className="font-bold block text-emerald-900">Supervisor Commendation:</span>
                    <p className="italic font-mono mt-0.5 whitespace-pre-line">
                      &quot;{item.admin_remark}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Reviewer & Timestamp */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500 font-mono">
                <span>Evaluated on: {item.reviewed_at ? formatDate(item.reviewed_at) : 'Pending'}</span>
                <span>By: {item.reviewer_name || 'Supervisor'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex justify-end">
        <Button type="button" variant="outline" size="md" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export const StudentFeedbackHistoryModal: React.FC<StudentFeedbackHistoryModalProps> = ({
  isOpen,
  onClose,
  studentId,
  onSelectWeek,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supervisor Remarks & Feedback History"
      description="All evaluations, commendations, and revision requests received for your logbook submissions."
      size="lg"
      id="student-feedback-history-modal"
    >
      <StudentFeedbackContent
        key={studentId}
        studentId={studentId}
        onClose={onClose}
        onSelectWeek={onSelectWeek}
      />
    </Modal>
  );
};
