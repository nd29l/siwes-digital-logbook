/**
 * @file src/pages/admin/students/StudentTable.tsx
 * @description Accessible, responsive student directory table and mobile card list for administrators.
 */

import React from 'react';
import { AdminStudentListItem } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils';
import {
  User,
  GraduationCap,
  Building,
  Calendar,
  Eye,
  Edit2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';

interface StudentTableProps {
  students: AdminStudentListItem[];
  onViewDetails: (student: AdminStudentListItem) => void;
  onEditStudent: (student: AdminStudentListItem) => void;
  onOpenCreateModal?: () => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onViewDetails,
  onEditStudent,
  onOpenCreateModal,
}) => {
  const getStatusBadge = (status: AdminStudentListItem['stats']['placementStatus']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="info" size="sm">
            <Clock className="w-3 h-3" />
            In Training
          </Badge>
        );
      case 'pending':
      case 'not_configured':
      default:
        return (
          <Badge variant="warning" size="sm">
            <AlertTriangle className="w-3 h-3" />
            Placement Unset
          </Badge>
        );
    }
  };

  if (!students || students.length === 0) {
    return (
      <EmptyState
        id="student-directory-empty-state"
        icon={Users}
        title="No Students Found"
        description="No student records match your current search query or department filters. You can clear filters or provision a new student account."
        actionText={onOpenCreateModal ? 'Provision New Student Account' : undefined}
        onAction={onOpenCreateModal}
      />
    );
  }

  return (
    <div id="admin-students-table-container" className="space-y-3">
      {/* 1. Desktop Table */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Student & Matric</th>
              <th className="py-3 px-4">Department & Faculty</th>
              <th className="py-3 px-4">SIWES Placement</th>
              <th className="py-3 px-4">Logbook Progress</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => {
              const {
                id,
                full_name,
                matric_number,
                email,
                department,
                institution,
                organisation,
                siwes_start_date,
                siwes_end_date,
                stats,
              } = student;

              return (
                <tr
                  key={id}
                  id={`student-row-${id}`}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Student & Matric */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {full_name}
                        </div>
                        <div className="text-slate-500 text-2xs truncate">
                          <span className="font-mono font-medium text-slate-700">
                            {matric_number || 'Matric Pending'}
                          </span>{' '}
                          &bull; {email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Department & Faculty */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800 truncate max-w-[180px]">
                      {department || 'Department Unassigned'}
                    </div>
                    <div className="text-2xs text-slate-500 truncate max-w-[180px]">
                      {institution || 'Institution Unset'}
                    </div>
                  </td>

                  {/* SIWES Placement */}
                  <td className="py-3.5 px-4">
                    {organisation ? (
                      <div>
                        <div className="font-medium text-slate-800 truncate max-w-[190px]">
                          {organisation}
                        </div>
                        {siwes_start_date && siwes_end_date && (
                          <div className="text-2xs text-slate-500 font-mono">
                            {formatDate(siwes_start_date)} – {formatDate(siwes_end_date)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-2xs">
                        Placement not submitted
                      </span>
                    )}
                  </td>

                  {/* Logbook Progress */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-800">
                        <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-mono font-semibold">
                          {stats.totalWeeksInitialized} {stats.totalWeeksInitialized === 1 ? 'Week' : 'Weeks'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-2xs text-slate-500 font-mono">
                        <span className="text-emerald-700 font-bold">{stats.approvedWeeksCount} Appr</span>
                        <span>&bull;</span>
                        <span className="text-amber-700 font-bold">{stats.submittedWeeksCount} Pend</span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {getStatusBadge(stats.placementStatus)}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(student)}
                        className="text-xs px-2.5 py-1 text-slate-700 hover:text-purple-700"
                        title="View complete student details"
                        id={`btn-view-student-${id}`}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>Inspect</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEditStudent(student)}
                        className="text-xs px-2.5 py-1 text-purple-700 border-purple-200 hover:bg-purple-50"
                        title="Edit student profile"
                        id={`btn-edit-student-${id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        <span>Edit</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile & Tablet Card Stack */}
      <div className="lg:hidden space-y-3">
        {students.map((student) => {
          const {
            id,
            full_name,
            matric_number,
            email,
            department,
            organisation,
            siwes_start_date,
            siwes_end_date,
            stats,
          } = student;

          return (
            <div
              key={id}
              className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
            >
              {/* Header: Name, Matric & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">
                      {full_name}
                    </div>
                    <div className="text-2xs text-slate-500 font-mono truncate">
                      {matric_number || 'Matric Pending'}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(stats.placementStatus)}
                </div>
              </div>

              {/* Department & Placement Details */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-2xs uppercase">Department</span>
                  <span className="text-slate-800 font-medium truncate block">
                    {department || 'Unassigned'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-2xs uppercase">Organisation</span>
                  <span className="text-slate-800 font-medium truncate block">
                    {organisation || 'Placement Unset'}
                  </span>
                </div>
              </div>

              {/* Logbook Progress Bar */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Logbook Submissions:</span>
                <span className="font-mono text-slate-900 font-bold">
                  {stats.approvedWeeksCount} Approved / {stats.totalWeeksInitialized} Total
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(student)}
                  className="text-xs px-3 text-slate-700"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  <span>Inspect</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditStudent(student)}
                  className="text-xs px-3 text-purple-700 border-purple-200"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  <span>Edit</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
