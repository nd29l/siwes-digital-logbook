/**
 * @file src/pages/admin/students/StudentDetailsDrawer.tsx
 * @description Comprehensive inspection drawer / modal showing student profile, SIWES placement, and logbook cycle summary.
 */

import React, { useEffect, useState } from 'react';
import { AdminStudentListItem, AdminStudentDetailView, RouteId } from '@/types';
import { getAdminStudentDetails } from '@/services';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils';
import {
  User,
  Mail,
  Hash,
  Building,
  GraduationCap,
  Briefcase,
  Calendar,
  Phone,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Edit2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface StudentDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: AdminStudentListItem | null;
  onEdit: (student: AdminStudentListItem) => void;
  onNavigate?: (routeId: RouteId) => void;
}

interface StudentDetailsContentProps {
  student: AdminStudentListItem;
  onClose: () => void;
  onEdit: (student: AdminStudentListItem) => void;
  onNavigate?: (routeId: RouteId) => void;
}

const StudentDetailsContent: React.FC<StudentDetailsContentProps> = ({
  student,
  onClose,
  onEdit,
  onNavigate,
}) => {
  const [detailData, setDetailData] = useState<AdminStudentDetailView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    getAdminStudentDetails(student.id)
      .then((res) => {
        if (isCancelled) return;
        if (res.success && res.data) {
          setDetailData(res.data);
        }
      })
      .finally(() => {
        if (isCancelled) return;
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [student.id]);

  const stats = detailData?.stats || student.stats;
  const weeks = detailData?.weeks || [];

  return (
    <div className="space-y-5">
        {/* 1. Header Card with Primary Identity */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-slate-50 to-purple-50 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {student.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{student.full_name}</h3>
                <Badge variant="purple" size="sm">
                  Student
                </Badge>
              </div>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                {student.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(student);
              }}
              className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              <span>Edit Profile</span>
            </Button>
          </div>
        </div>

        {/* 2. SIWES Logbook Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-2xs uppercase block">Total Weeks</span>
            <span className="font-mono font-bold text-slate-900 text-base">
              {stats.totalWeeksInitialized}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-amber-700 text-2xs uppercase block">Pending Review</span>
            <span className="font-mono font-bold text-amber-900 text-base">
              {stats.submittedWeeksCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-700 text-2xs uppercase block">Approved</span>
            <span className="font-mono font-bold text-emerald-900 text-base">
              {stats.approvedWeeksCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-rose-700 text-2xs uppercase block">Returned</span>
            <span className="font-mono font-bold text-rose-900 text-base">
              {stats.returnedWeeksCount}
            </span>
          </div>
        </div>

        {/* 3. Detailed Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Academic Info */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 pb-1.5 border-b border-slate-100">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>Academic Affiliation</span>
            </div>
            <div className="space-y-1">
              <div>
                <span className="text-slate-400 block text-2xs">Institution:</span>
                <span className="text-slate-800 font-medium">
                  {student.institution || 'Not configured'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs">Department / Program:</span>
                <span className="text-slate-800 font-medium">
                  {student.department || 'Not configured'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs">Phone Number:</span>
                <span className="text-slate-800 font-mono">
                  {student.phone || 'None provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Placement Info */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 pb-1.5 border-b border-slate-100">
              <Briefcase className="w-4 h-4 text-purple-600" />
              <span>Industrial Placement</span>
            </div>
            <div className="space-y-1">
              <div>
                <span className="text-slate-400 block text-2xs">Organisation:</span>
                <span className="text-slate-800 font-medium">
                  {student.organisation || 'Placement organisation unset'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs">Duration Span:</span>
                {student.siwes_start_date && student.siwes_end_date ? (
                  <span className="text-slate-800 font-mono">
                    {formatDate(student.siwes_start_date)} – {formatDate(student.siwes_end_date)}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Dates not set</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-2xs">Account Created:</span>
                <span className="text-slate-800 font-mono">
                  {formatDate(student.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Logbook Weeks List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Logbook Weeks History ({weeks.length})</span>
            </h4>
            {onNavigate && stats.submittedWeeksCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('admin-reports');
                }}
                className="text-2xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1"
              >
                <span>Inspect in Review Queue</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
              <span>Loading logbook records...</span>
            </div>
          ) : weeks.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 italic">
              Student has not initialized any logbook weeks yet.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-xs">
              {weeks.map((w) => (
                <div key={w.id} className="p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Week {w.week_number}</span>
                    <Badge
                      variant={
                        w.status === 'approved'
                          ? 'success'
                          : w.status === 'submitted'
                          ? 'info'
                          : w.status === 'returned'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {w.status.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-slate-500 font-mono text-2xs">
                    {w.submitted_at ? `Sub: ${formatDate(w.submitted_at)}` : 'Draft in progress'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Actions */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
};

export const StudentDetailsDrawer: React.FC<StudentDetailsDrawerProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
  onNavigate,
}) => {
  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student.full_name}
      description={`Matriculation: ${student.matric_number || 'Pending'} • Account Details`}
      size="lg"
      id="student-details-drawer"
    >
      <StudentDetailsContent
        key={student.id}
        student={student}
        onClose={onClose}
        onEdit={onEdit}
        onNavigate={onNavigate}
      />
    </Modal>
  );
};
