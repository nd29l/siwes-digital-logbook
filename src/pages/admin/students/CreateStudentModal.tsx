/**
 * @file src/pages/admin/students/CreateStudentModal.tsx
 * @description Accessible modal form for administrators to provision new student accounts.
 */

import React, { useState } from 'react';
import { CreateStudentAccountInput, StudentManagementValidationErrors } from '@/types';
import { validateCreateStudentForm } from '@/services';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  User,
  Mail,
  Lock,
  Hash,
  Building,
  GraduationCap,
  Briefcase,
  Calendar,
  Phone,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStudentAccountInput) => Promise<void>;
  isSubmitting: boolean;
  defaultInstitution?: string;
}

export const CreateStudentModal: React.FC<CreateStudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  defaultInstitution = 'University SIWES Directorate',
}) => {
  const initialFormData: CreateStudentAccountInput = {
    full_name: '',
    email: '',
    matric_number: '',
    password: '',
    phone: '',
    institution: defaultInstitution,
    department: '',
    organisation: '',
    siwes_start_date: '',
    siwes_end_date: '',
  };

  const [formData, setFormData] = useState<CreateStudentAccountInput>(initialFormData);
  const [errors, setErrors] = useState<StudentManagementValidationErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleGeneratePassword = () => {
    // Generate a strong, memorable random password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: result }));
    setErrors((prev) => ({ ...prev, password: undefined }));
  };

  const handleChange = (field: keyof CreateStudentAccountInput, value: string) => {
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

    const validation = validateCreateStudentForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSubmit(formData);
      setFormData(initialFormData);
      setErrors({});
      onClose();
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : 'Failed to create student account.'
      );
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData(initialFormData);
    setErrors({});
    setSubmissionError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Provision New Student Account"
      description="Create authentication credentials and initialize the SIWES student profile record."
      size="lg"
      id="create-student-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {submissionError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Provisioning Error</span>
              <span>{submissionError}</span>
            </div>
          </div>
        )}

        {/* 1. Core Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            id="create-student-full-name"
            label="Full Legal Name"
            placeholder="e.g. Chukwuma Blessing Okoro"
            icon={User}
            required
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            error={errors.full_name}
            disabled={isSubmitting}
          />

          <Input
            id="create-student-email"
            type="email"
            label="Student Email Address"
            placeholder="e.g. blessing.okoro@uni.edu.ng"
            icon={Mail}
            required
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            disabled={isSubmitting}
          />

          <Input
            id="create-student-matric"
            label="Matriculation / Registration Number"
            placeholder="e.g. U2022/ENG/0142"
            icon={Hash}
            required
            value={formData.matric_number}
            onChange={(e) => handleChange('matric_number', e.target.value)}
            error={errors.matric_number}
            disabled={isSubmitting}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="create-student-password"
                className="block text-xs font-semibold text-slate-700 tracking-wide"
              >
                Initial Password <span className="text-rose-500 font-bold">*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-2xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Generate Strong
              </button>
            </div>
            <Input
              id="create-student-password"
              type="text"
              placeholder="Minimum 6 characters"
              icon={Lock}
              required
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* 2. Institutional Affiliation */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            id="create-student-institution"
            label="Institution / University"
            placeholder="e.g. Federal University of Technology"
            icon={Building}
            value={formData.institution || ''}
            onChange={(e) => handleChange('institution', e.target.value)}
            error={errors.institution}
            disabled={isSubmitting}
          />

          <Input
            id="create-student-department"
            label="Academic Department / Program"
            placeholder="e.g. Computer Science & Engineering"
            icon={GraduationCap}
            value={formData.department || ''}
            onChange={(e) => handleChange('department', e.target.value)}
            error={errors.department}
            disabled={isSubmitting}
          />
        </div>

        {/* 3. SIWES Placement Setup */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <Input
              id="create-student-organisation"
              label="Placement Organisation / Company"
              placeholder="e.g. Chevron Nigeria Limited / National Data Centre"
              icon={Briefcase}
              value={formData.organisation || ''}
              onChange={(e) => handleChange('organisation', e.target.value)}
              error={errors.organisation}
              disabled={isSubmitting}
            />
          </div>

          <Input
            id="create-student-start-date"
            type="date"
            label="Commencement Date"
            icon={Calendar}
            value={formData.siwes_start_date || ''}
            onChange={(e) => handleChange('siwes_start_date', e.target.value)}
            error={errors.siwes_start_date}
            disabled={isSubmitting}
          />

          <Input
            id="create-student-end-date"
            type="date"
            label="Completion Date"
            icon={Calendar}
            value={formData.siwes_end_date || ''}
            onChange={(e) => handleChange('siwes_end_date', e.target.value)}
            error={errors.siwes_end_date}
            disabled={isSubmitting}
          />

          <div className="sm:col-span-2">
            <Input
              id="create-student-phone"
              type="tel"
              label="Phone Number"
              placeholder="e.g. +234 803 123 4567"
              icon={Phone}
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={errors.phone}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Informative Guidance */}
        <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-900 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <span>
            Upon creation, the student can immediately sign in with their email and initial password to begin compiling their SIWES daily logbook.
          </span>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleClose}
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
            className="bg-purple-600 hover:bg-purple-500 text-white min-w-[150px] w-full sm:w-auto"
            id="submit-create-student-btn"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Provisioning...
              </span>
            ) : (
              <span>Create Student Account</span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
