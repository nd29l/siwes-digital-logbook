/**
 * @file src/pages/student/StudentProfilePage.tsx
 * @description Production-grade Student Profile and SIWES Information view & management screen.
 * 
 * Complies with Module 05 requirements:
 * 1. Personal, Academic, and SIWES Information display and editing.
 * 2. Strict immutable fields (ID, Role, Email) protected in accordance with Supabase Auth & RLS.
 * 3. Client-side input validation (required matric, full name, phone format, start/end date ordering).
 * 4. Responsive multi-section layout with accessible form controls.
 * 5. Full state management: loading, saving, error normalization, and global profile refresh.
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks';
import {
  updateStudentProfile,
  validateStudentProfileForm,
  calculateSiwesDuration,
  formatProfileDatabaseError,
} from '@/services';
import {
  StudentProfileFormData,
  ProfileValidationErrors,
  RouteId,
} from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/utils';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  Calendar,
  ShieldCheck,
  KeyRound,
  Clock,
  Edit3,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Info,
  CalendarRange,
} from 'lucide-react';

interface StudentProfilePageProps {
  onNavigate?: (routeId: RouteId) => void;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ onNavigate }) => {
  const { user, profile, role, loading: authLoading, isProfileMissing, refreshProfile } = useAuth();

  // Mode: View mode vs Edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Form input state
  const [formData, setFormData] = useState<StudentProfileFormData>(() => ({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    matric_number: profile?.matric_number || '',
    institution: profile?.institution || '',
    department: profile?.department || '',
    organisation: profile?.organisation || '',
    siwes_start_date: profile?.siwes_start_date || '',
    siwes_end_date: profile?.siwes_end_date || '',
  }));

  // Validation errors & network state
  const [formErrors, setFormErrors] = useState<ProfileValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Real-time calculated duration of SIWES placement
  const durationInfo = useMemo(() => {
    const start = isEditing ? formData.siwes_start_date : profile?.siwes_start_date;
    const end = isEditing ? formData.siwes_end_date : profile?.siwes_end_date;
    return calculateSiwesDuration(start, end);
  }, [isEditing, formData.siwes_start_date, formData.siwes_end_date, profile?.siwes_start_date, profile?.siwes_end_date]);

  /**
   * Form field change handler
   */
  const handleInputChange = (field: keyof StudentProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error as user types
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    // Dismiss previous success notification when editing
    if (saveSuccess) setSaveSuccess(false);
  };

  /**
   * Enter edit mode with current profile values
   */
  const handleStartEditing = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        matric_number: profile.matric_number || '',
        institution: profile.institution || '',
        department: profile.department || '',
        organisation: profile.organisation || '',
        siwes_start_date: profile.siwes_start_date || '',
        siwes_end_date: profile.siwes_end_date || '',
      });
    }
    setFormErrors({});
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  /**
   * Cancel edit mode
   */
  const handleCancelEditing = () => {
    setFormErrors({});
    setSaveError(null);
    setIsEditing(false);
  };

  /**
   * Form submission handler
   */
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSaveError('No authenticated user session found.');
      return;
    }

    // 1. Client-Side Validation
    const { isValid, errors } = validateStudentProfileForm(formData);
    if (!isValid) {
      setFormErrors(errors);
      setSaveError('Please resolve the validation errors highlighted below.');
      return;
    }

    // 2. Submit to Supabase
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const result = await updateStudentProfile(user.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        matric_number: formData.matric_number,
        institution: formData.institution,
        department: formData.department,
        organisation: formData.organisation,
        siwes_start_date: formData.siwes_start_date || null,
        siwes_end_date: formData.siwes_end_date || null,
      });

      if (!result.success || !result.data) {
        setSaveError(result.error || 'Failed to update student profile.');
        setIsSaving(false);
        return;
      }

      // 3. Update global AuthContext state so the AppShell header & sidebar reflect changes immediately
      await refreshProfile();

      setIsSaving(false);
      setIsEditing(false);
      setSaveSuccess(true);

      // Auto-hide success message after 6 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 6000);
    } catch (err: unknown) {
      setIsSaving(false);
      setSaveError(formatProfileDatabaseError(err));
    }
  };

  // 1. LOADING STATE
  if (authLoading) {
    return (
      <div id="profile-loading-state" className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-8 h-8 text-slate-700 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-800">Retrieving Student Profile...</p>
        <p className="text-xs text-slate-500 mt-1">Loading matriculation and industrial placement records from database.</p>
      </div>
    );
  }

  // 2. MISSING PROFILE STATE (Edge Case: Auth exists, but public.profiles row is absent)
  if (isProfileMissing || !profile) {
    return (
      <div id="missing-profile-container" className="max-w-2xl mx-auto my-8 space-y-6">
        <Card className="border-amber-200 bg-amber-50/40 p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Student Profile Record Unavailable</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
            Your login account ({user?.email}) is successfully authenticated with Supabase, but no corresponding
            SIWES record was found in the database <code>profiles</code> table.
          </p>
          <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200 text-xs text-slate-700 text-left space-y-1 max-w-md mx-auto">
            <p className="font-semibold text-amber-900">Why am I seeing this?</p>
            <p className="text-slate-600">
              In accordance with institutional guidelines, student accounts must be enrolled and assigned a verified
              matriculation number by the SIWES Director or System Administrator.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refreshProfile()}>
              <Loader2 className="w-3.5 h-3.5" />
              Retry Profile Check
            </Button>
            {onNavigate && (
              <Button variant="secondary" size="sm" onClick={() => onNavigate('student-dashboard')}>
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Dashboard
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div id="student-profile-page" className="max-w-5xl mx-auto space-y-6">
      {/* 1. Page Header & Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('student-dashboard')}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer mr-1"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
                <span className="text-slate-300">/</span>
              </button>
            )}
            <Badge variant="purple" size="sm">
              <ShieldCheck className="w-3 h-3" />
              Role: {role || 'student'}
            </Badge>
            <span className="text-xs text-slate-400">SIWES Profile</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Student Profile & SIWES Details
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            View and manage your verified institutional registration, academic department, and industrial placement data.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-start sm:justify-end">
          {!isEditing ? (
            <Button
              id="edit-profile-btn"
              variant="primary"
              size="md"
              onClick={handleStartEditing}
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm w-full sm:w-auto"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                id="cancel-profile-btn"
                variant="outline"
                size="md"
                onClick={handleCancelEditing}
                disabled={isSaving}
                className="flex-1 sm:flex-initial"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
              <Button
                id="save-profile-btn"
                variant="primary"
                size="md"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 sm:flex-initial"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Success Banner */}
      {saveSuccess && (
        <div
          id="profile-save-success-banner"
          className="flex items-start justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-950">Profile Successfully Saved</p>
              <p className="text-xs text-emerald-800">
                Your personal, academic, and SIWES placement records have been securely committed to the database.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded transition-colors cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Error Banner */}
      {saveError && (
        <div
          id="profile-save-error-banner"
          className="flex items-start justify-between p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-950">Unable to Save Profile</p>
              <p className="text-xs text-rose-800">{saveError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-rose-700 hover:text-rose-900 p-1 rounded transition-colors cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Student Identity Overview Card */}
      <Card id="student-identity-hero" className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Student Avatar / Initials */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
              {(profile.full_name || 'Student')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  {profile.full_name}
                </h2>
                <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                  Verified Student
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  {profile.matric_number ? (
                    <span className="font-mono font-medium">{profile.matric_number}</span>
                  ) : (
                    <span className="italic text-amber-300">Matriculation pending</span>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{user?.email || profile.email}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick SIWES Placement Badge */}
          <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-700/60 w-full sm:w-auto">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
              Attached Organisation
            </span>
            <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 sm:justify-end mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {profile.organisation || 'Placement not registered yet'}
            </span>
          </div>
        </div>
      </Card>

      {/* 5. Main Information Form / View */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* SECTION 1: Personal Information */}
        <Card id="personal-information-section" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                1. Personal Information
              </h3>
            </div>
            <span className="text-xs text-slate-500">Contact & identification credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            {isEditing ? (
              <Input
                id="profile-full-name"
                label="Full Legal Name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                error={formErrors.full_name}
                required
                icon={User}
                placeholder="e.g. Chukwuebuka Daniel Adeyemi"
                helperText="First name, middle name, and surname as registered with your institution."
              />
            ) : (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">Full Name</span>
                <span className="text-sm font-medium text-slate-900 block bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                  {profile.full_name || 'Not provided'}
                </span>
              </div>
            )}

            {/* Email Address (Immutable via this form - managed by Supabase Auth) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="profile-email-readonly" className="block text-xs font-semibold text-slate-700">
                  Institutional Login Email
                </label>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Supabase Auth Managed
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="profile-email-readonly"
                  type="email"
                  readOnly
                  disabled
                  value={user?.email || profile.email}
                  className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-slate-600 font-mono cursor-not-allowed select-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                Tied to your Supabase Auth user identity. Contact SIWES coordinator to alter institutional email.
              </p>
            </div>

            {/* Matriculation Number */}
            {isEditing ? (
              <Input
                id="profile-matric-number"
                label="Matriculation Number"
                value={formData.matric_number}
                onChange={(e) => handleInputChange('matric_number', e.target.value)}
                error={formErrors.matric_number}
                required
                icon={GraduationCap}
                placeholder="e.g. U2021/CSC/0419"
                helperText="Must be unique. Enforced by database schema check constraint."
              />
            ) : (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">Matriculation Number</span>
                <span className="text-sm font-mono font-medium text-slate-900 block bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                  {profile.matric_number || 'Pending registration'}
                </span>
              </div>
            )}

            {/* Telephone Number */}
            {isEditing ? (
              <Input
                id="profile-phone"
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={formErrors.phone}
                icon={Phone}
                placeholder="e.g. +234 803 123 4567"
                helperText="Official mobile number for supervisor emergency contact."
              />
            ) : (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">Phone Number</span>
                <span className="text-sm font-medium text-slate-900 block bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                  {profile.phone || 'Not specified'}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* SECTION 2: Academic Information */}
        <Card id="academic-information-section" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                2. Academic Information
              </h3>
            </div>
            <span className="text-xs text-slate-500">Institution & discipline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tertiary Institution */}
            {isEditing ? (
              <Input
                id="profile-institution"
                label="Tertiary Institution"
                value={formData.institution}
                onChange={(e) => handleInputChange('institution', e.target.value)}
                error={formErrors.institution}
                icon={Building2}
                placeholder="e.g. Federal University of Technology, Akure"
                helperText="University, Polytechnic, or College of Education."
              />
            ) : (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">Tertiary Institution</span>
                <span className="text-sm font-medium text-slate-900 block bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                  {profile.institution || 'Not specified'}
                </span>
              </div>
            )}

            {/* Department */}
            {isEditing ? (
              <Input
                id="profile-department"
                label="Academic Department / Course"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                error={formErrors.department}
                icon={GraduationCap}
                placeholder="e.g. Computer Science & Engineering"
                helperText="Academic department presiding over your SIWES accreditation."
              />
            ) : (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">Department / Programme</span>
                <span className="text-sm font-medium text-slate-900 block bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                  {profile.department || 'Not specified'}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* SECTION 3: SIWES Placement Information */}
        <Card id="siwes-placement-section" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                3. SIWES Placement Information
              </h3>
            </div>
            <span className="text-xs text-slate-500">Industrial attachment details</span>
          </div>

          <div className="space-y-4">
            {/* Organisation */}
            {isEditing ? (
              <Input
                id="profile-organisation"
                label="Industrial Attachment Organisation / Company"
                value={formData.organisation}
                onChange={(e) => handleInputChange('organisation', e.target.value)}
                error={formErrors.organisation}
                icon={Building2}
                placeholder="e.g. National Space Research and Development Agency (NASRDA)"
                helperText="The corporate or government establishment where you are completing your industrial training."
              />
            ) : (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">Placement Organisation</span>
                <span className="text-sm font-medium text-slate-900 block bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                  {profile.organisation || 'Industrial placement not yet specified'}
                </span>
              </div>
            )}

            {/* Date Range: Commencement & Completion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEditing ? (
                <Input
                  id="profile-siwes-start-date"
                  type="date"
                  label="SIWES Commencement Date"
                  value={formData.siwes_start_date}
                  onChange={(e) => handleInputChange('siwes_start_date', e.target.value)}
                  error={formErrors.siwes_start_date}
                  icon={Calendar}
                  helperText="Official training commencement date."
                />
              ) : (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 block">Commencement Date</span>
                  <span className="text-sm font-medium text-slate-900 block bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                    {formatDate(profile.siwes_start_date)}
                  </span>
                </div>
              )}

              {isEditing ? (
                <Input
                  id="profile-siwes-end-date"
                  type="date"
                  label="SIWES Completion Date"
                  value={formData.siwes_end_date}
                  onChange={(e) => handleInputChange('siwes_end_date', e.target.value)}
                  error={formErrors.siwes_end_date}
                  icon={Calendar}
                  helperText="Must be on or after commencement date."
                />
              ) : (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 block">Completion Date</span>
                  <span className="text-sm font-medium text-slate-900 block bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                    {formatDate(profile.siwes_end_date)}
                  </span>
                </div>
              )}
            </div>

            {/* Calculated Placement Duration Widget */}
            <div
              id="siwes-duration-widget"
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5">
                <CalendarRange className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Calculated SIWES Placement Duration
                  </span>
                  <span className="text-xs text-slate-500">
                    Automated calendar calculation based on commencement and completion dates.
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                {durationInfo.isValid ? (
                  <Badge variant="success" size="md">
                    {durationInfo.summaryText}
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="md">
                    {profile.siwes_start_date && profile.siwes_end_date
                      ? 'Invalid sequence'
                      : 'Dates incomplete'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 4: System Audit & Access Metadata */}
        <Card id="system-audit-metadata-section" className="space-y-3 bg-slate-50/50 border-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Account & Security Metadata
              </h4>
            </div>
            <span className="text-[11px] text-slate-500">PostgreSQL profiles schema</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Database User UID:</span>
              <span className="font-mono text-slate-800 text-[11px] break-all block mt-0.5">
                {profile.id}
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Enforced Role:</span>
              <span className="font-bold text-emerald-700 capitalize text-xs block mt-0.5">
                {profile.role} (Row Level Security Active)
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Account Created:</span>
              <span className="text-slate-700 text-xs block mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatDate(profile.created_at)}
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Last Updated:</span>
              <span className="text-slate-700 text-xs block mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatDate(profile.updated_at)}
              </span>
            </div>
          </div>
        </Card>

        {/* Floating / Bottom Save Bar when Editing */}
        {isEditing && (
          <div
            id="profile-editing-sticky-bar"
            className="p-4 bg-white rounded-xl border border-slate-300 shadow-md flex flex-wrap items-center justify-between gap-3 sticky bottom-4 z-10"
          >
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Info className="w-4 h-4 text-slate-400" />
              <span>You have unsaved changes in your profile form.</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleCancelEditing}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
