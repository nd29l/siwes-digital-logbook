/**
 * @file src/pages/admin/students/AdminStudentsPage.tsx
 * @description Production Student Account Management & Directory page for Module 10.
 * 
 * Features:
 * 1. Multi-student directory listing with real Supabase database records.
 * 2. Real-time search by name, email, matriculation number, organisation, and department.
 * 3. Departmental and placement status filters with sort controls.
 * 4. Secure student account provisioning workflow with Supabase Auth integration.
 * 5. Student profile management (edit permitted fields, preserving historical SIWES records).
 * 6. Deep inspection drawer for individual student profile and logbook cycle summary.
 * 7. Comprehensive loading, error, empty, and retry states.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks';
import {
  getAdminStudentsList,
  createStudentAccount,
  updateStudentByAdmin,
} from '@/services';
import {
  AdminStudentListItem,
  CreateStudentAccountInput,
  UpdateStudentAdminInput,
  StudentFilterOptions,
  RouteId,
} from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StudentFilterBar } from './StudentFilterBar';
import { StudentTable } from './StudentTable';
import { CreateStudentModal } from './CreateStudentModal';
import { EditStudentModal } from './EditStudentModal';
import { StudentDetailsDrawer } from './StudentDetailsDrawer';
import {
  Users,
  UserPlus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  BookOpen,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';

interface AdminStudentsPageProps {
  onNavigate?: (routeId: RouteId) => void;
}

export const AdminStudentsPage: React.FC<AdminStudentsPageProps> = ({
  onNavigate,
}) => {
  const { user, profile } = useAuth();

  // State: Student List & Filtering
  const [students, setStudents] = useState<AdminStudentListItem[]>([]);
  const [filters, setFilters] = useState<StudentFilterOptions>({
    searchQuery: '',
    department: 'all',
    placementStatus: 'all',
    sortBy: 'created_desc',
  });

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(() => Boolean(user?.id));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentListItem | null>(null);

  // 1. Load students list
  const loadStudents = async (isManualRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const res = await getAdminStudentsList(filters);
      if (res.success && res.data) {
        setStudents(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to load students directory.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred while fetching student records.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const adminId = user?.id;

    if (!adminId) return;

    getAdminStudentsList(filters)
      .then((res) => {
        if (isCancelled) return;
        if (res.success && res.data) {
          setStudents(res.data);
        } else {
          setErrorMessage(res.error || 'Failed to load students directory.');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'An error occurred while fetching students.'
        );
      })
      .finally(() => {
        if (isCancelled) return;
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.id, filters]);

  // Extract distinct departments for filter dropdown
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department && s.department.trim()) {
        set.add(s.department.trim());
      }
    });
    return Array.from(set).sort();
  }, [students]);

  // Overall student summary metrics
  const totalEnrolled = students.length;
  const placementConfiguredCount = students.filter(
    (s) => s.stats.placementStatus !== 'pending' && s.stats.placementStatus !== 'not_configured'
  ).length;
  const activeLoggersCount = students.filter((s) => s.stats.totalWeeksInitialized > 0).length;

  // Handlers for Modals & Actions
  const handleOpenCreateModal = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (student: AdminStudentListItem) => {
    setSelectedStudent(student);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDetails = (student: AdminStudentListItem) => {
    setSelectedStudent(student);
    setIsDetailDrawerOpen(true);
  };

  const handleCreateStudent = async (data: CreateStudentAccountInput) => {
    if (!user?.id) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await createStudentAccount(user.id, data);
      if (res.success && res.data) {
        setSuccessMessage(
          `Student account for "${res.data.full_name}" (Matric: ${res.data.matric_number}) was provisioned successfully!`
        );
        setIsCreateModalOpen(false);
        // Refresh list
        loadStudents(true);
      } else {
        throw new Error(res.error || 'Failed to provision student account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStudent = async (
    studentId: string,
    data: UpdateStudentAdminInput
  ) => {
    if (!user?.id) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await updateStudentByAdmin(user.id, studentId, data);
      if (res.success && res.data) {
        setSuccessMessage(
          `Profile for "${res.data.full_name}" has been updated successfully!`
        );
        setIsEditModalOpen(false);
        // Refresh list
        loadStudents(true);
      } else {
        throw new Error(res.error || 'Failed to update student profile.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="admin-students-page" className="space-y-6">
      {/* 1. TOP HEADER & DIRECTORATE ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('admin-dashboard')}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 -ml-1 rounded-lg cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Student Account Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision new SIWES accounts, inspect cohort placement details, and manage student profile parameters.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStudents(true)}
            disabled={isRefreshing || isLoading}
            className="text-xs text-slate-600"
            title="Refresh student records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs"
            id="btn-provision-student"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Provision Student</span>
          </Button>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {successMessage && (
        <div
          id="student-mgmt-success-banner"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Operation Successful</span>
              <span>{successMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs p-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMessage && (
        <div
          id="student-mgmt-error-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Database Notice</span>
              <span>{errorMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold text-xs p-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. SUMMARY METRIC PILLS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Enrolled Cohort</span>
            <span className="text-xl font-bold font-mono text-slate-900">{totalEnrolled}</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Placement Configured</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {placementConfiguredCount} of {totalEnrolled}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Active Loggers</span>
            <span className="text-xl font-bold font-mono text-slate-900">{activeLoggersCount}</span>
          </div>
        </Card>
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <StudentFilterBar
        filters={filters}
        onFilterChange={setFilters}
        availableDepartments={availableDepartments}
        totalResults={students.length}
      />

      {/* 4. STUDENT DIRECTORY TABLE */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-slate-500 font-medium">Loading student accounts from database...</p>
        </div>
      ) : (
        <StudentTable
          students={students}
          onViewDetails={handleOpenDetails}
          onEditStudent={handleOpenEditModal}
          onOpenCreateModal={handleOpenCreateModal}
        />
      )}

      {/* 5. MODALS & DRAWERS */}
      <CreateStudentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateStudent}
        isSubmitting={isSubmitting}
        defaultInstitution={profile?.institution || 'Federal University SIWES Directorate'}
      />

      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={selectedStudent}
        onSubmit={handleUpdateStudent}
        isSubmitting={isSubmitting}
      />

      <StudentDetailsDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        student={selectedStudent}
        onEdit={handleOpenEditModal}
        onNavigate={onNavigate}
      />
    </div>
  );
};
