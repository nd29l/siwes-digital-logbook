/**
 * @file src/pages/admin/students/EditStudentModal.tsx
 * @description Accessible modal form for administrators to modify permitted student profile details.
 */

import React, { useState, useEffect } from 'react';
import {
  AdminStudentListItem,
  UpdateStudentAdminInput,
  StudentManagementValidationErrors,
} from '@/types';
import { validateUpdateStudentForm } from '@/services';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  User,
  Mail,
  Hash,
  Building,
  GraduationCap,
  Briefcase,
  Calendar,
  Phone,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: AdminStudentListItem | null;
  onSubmit: (studentId: string, data: UpdateStudentAdminInput) => Promise<void>;
  isSubmitting: boolean;
}

interface EditStudentFormProps {
  student: AdminStudentListItem;
  onClose: () => void;
  onSubmit: (studentId: string, data: UpdateStudentAdminInput) => Promise<void>;
  isSubmitting: boolean;
}

const EditStudentForm: React.FC<EditStudentFormProps> = ({
  student,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<UpdateStudentAdminInput>(() => ({
    full_name: student.full_name || '',
    matric_number: student.matric_number || '',
    phone: student.phone || '',
    institution: student.institution || '',
    department: student.department || '',
    organisation: student.organisation || '',
    siwes_start_date: student.siwes_start_date || '',
    siwes_end_date: student.siwes_end_date || '',
  }));

  const [errors, setErrors] = useState<StudentManagementValidationErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleChange = (field: keyof UpdateStudentAdminInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submissionError) {
      setSubmissionError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    const validation = validateUpdateStudentForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSubmit(student.id, formData);
      onClose();
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : 'Failed to update student profile.'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submissionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Update Error</span>
            <span>{submissionError}</span>
          </div>
        </div>
      )}

      {/* Read-Only Account Identity */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-500 block text-2xs uppercase">Auth Email</span>
          <span className="font-mono text-slate-800 font-medium truncate block">
            {student.email}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-2xs uppercase">Student UUID</span>
          <span className="font-mono text-slate-600 text-2xs truncate block">
            {student.id}
          </span>
        </div>
      </div>

      {/* 1. Core Profile Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Input
          id="edit-student-full-name"
          label="Full Legal Name"
          icon={User}
          required
          value={formData.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          error={errors.full_name}
          disabled={isSubmitting}
        />

        <Input
          id="edit-student-matric"
          label="Matriculation Number"
          icon={Hash}
          required
          value={formData.matric_number}
          onChange={(e) => handleChange('matric_number', e.target.value)}
          error={errors.matric_number}
          disabled={isSubmitting}
        />
      </div>

      {/* 2. Institutional Affiliation */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Input
          id="edit-student-institution"
          label="Institution / University"
          icon={Building}
          value={formData.institution || ''}
          onChange={(e) => handleChange('institution', e.target.value)}
          error={errors.institution}
          disabled={isSubmitting}
        />

        <Input
          id="edit-student-department"
          label="Academic Department"
          icon={GraduationCap}
          value={formData.department || ''}
          onChange={(e) => handleChange('department', e.target.value)}
          error={errors.department}
          disabled={isSubmitting}
        />
      </div>

      {/* 3. SIWES Placement Setup */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="sm:col-span-3">
          <Input
            id="edit-student-organisation"
            label="Placement Organisation"
            icon={Briefcase}
            value={formData.organisation || ''}
            onChange={(e) => handleChange('organisation', e.target.value)}
            error={errors.organisation}
            disabled={isSubmitting}
          />
        </div>

        <Input
          id="edit-student-start-date"
          type="date"
          label="Commencement Date"
          icon={Calendar}
          value={formData.siwes_start_date || ''}
          onChange={(e) => handleChange('siwes_start_date', e.target.value)}
          error={errors.siwes_start_date}
          disabled={isSubmitting}
        />

        <Input
          id="edit-student-end-date"
          type="date"
          label="Completion Date"
          icon={Calendar}
          value={formData.siwes_end_date || ''}
          onChange={(e) => handleChange('siwes_end_date', e.target.value)}
          error={errors.siwes_end_date}
          disabled={isSubmitting}
        />

        <Input
          id="edit-student-phone"
          type="tel"
          label="Phone Number"
          icon={Phone}
          value={formData.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          disabled={isSubmitting}
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
          id="save-edit-student-btn"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <span>Save Changes</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSubmit,
  isSubmitting,
}) => {
  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={`Edit Profile: ${student.full_name}`}
      description="Update academic, institutional, or SIWES placement parameters."
      size="lg"
      id="edit-student-modal"
    >
      <EditStudentForm
        key={student.id}
        student={student}
        onClose={onClose}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
};
