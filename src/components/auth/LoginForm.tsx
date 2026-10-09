/**
 * @file src/components/auth/LoginForm.tsx
 * @description Clean, responsive login page form for the SIWES Digital Logbook.
 * 
 * Features:
 * - Responsive desktop/tablet/mobile layout.
 * - Client-side validation: required fields, email format.
 * - Password visibility toggle.
 * - Loading indicator ("Signing in...").
 * - Clear, safe error display (no sensitive details leaked).
 * - "Forgot password?" modal/inline trigger.
 * - Explicit note that student accounts are created by administrators.
 */

import React, { useState } from 'react';
import { useAuth } from '@/hooks';
import { UserRole } from '@/types';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PWAInstallButton } from '@/components/pwa';

interface LoginFormProps {
  onSuccess: (role: UserRole) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { signIn, resetPasswordForEmail, loading: authLoading, error: authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  /**
   * Validates form inputs.
   */
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles login submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting || authLoading) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await signIn({
        email: email.trim(),
        password,
      });

      if (result.success && result.role) {
        onSuccess(result.role);
      } else {
        setErrors({ general: result.error || 'Invalid email or password.' });
      }
    } catch {
      setErrors({ general: 'An unexpected connection error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles password reset submission.
   */
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Email is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    setResetError(null);

    const res = await resetPasswordForEmail(resetEmail.trim());
    setResetLoading(false);

    if (res.success) {
      setResetSuccess(true);
    } else {
      setResetError(res.error || 'Failed to dispatch reset email.');
    }
  };

  const isFormBusy = isSubmitting || authLoading;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-sm mb-3">
            <KeyRound className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign In</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Access your SIWES Digital Logbook account
          </p>
        </div>

        {/* Global/Auth Error Notice */}
        {(errors.general || authError) && (
          <div
            id="login-error-banner"
            className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errors.general || authError}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                disabled={isFormBusy}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="student@institution.edu.ng"
                className={`w-full pl-10 pr-3.5 py-2.5 sm:py-2 text-base sm:text-sm min-h-[42px] sm:min-h-[38px] rounded-xl border bg-white text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 ${
                  errors.email
                    ? 'border-rose-300 focus:border-rose-500'
                    : 'border-slate-300 hover:border-slate-400'
                } disabled:bg-slate-50 disabled:cursor-not-allowed`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetSuccess(false);
                  setResetError(null);
                  setShowResetModal(true);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 underline transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                disabled={isFormBusy}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-2.5 sm:py-2 text-base sm:text-sm min-h-[42px] sm:min-h-[38px] rounded-xl border bg-white text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 ${
                  errors.password
                    ? 'border-rose-300 focus:border-rose-500'
                    : 'border-slate-300 hover:border-slate-400'
                } disabled:bg-slate-50 disabled:cursor-not-allowed`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              id="login-submit-btn"
              type="submit"
              variant="primary"
              size="md"
              disabled={isFormBusy}
              className="w-full"
            >
              {isFormBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>
        </form>

        {/* Security & Registration Notice */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-1.5 text-slate-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Institutional Accounts Only
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Public student registration is disabled. Student credentials are provisioned exclusively
            by your designated SIWES Institutional Administrator.
          </p>

          <div className="pt-2 border-t border-slate-200">
            <PWAInstallButton variant="outline" size="sm" className="w-full justify-center bg-white border-slate-300 text-slate-800 hover:bg-slate-100" />
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div
          id="password-reset-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Password Recovery</h3>
            <p className="text-xs text-slate-600 mt-1">
              Enter your registered institutional email address. We will dispatch a recovery link managed securely by Supabase Auth.
            </p>

            {resetSuccess ? (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Email Dispatched
                </div>
                <p>Check your inbox for password reset instructions.</p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowResetModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="mt-4 space-y-3">
                {resetError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                    {resetError}
                  </div>
                )}
                <div>
                  <label htmlFor="reset-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="reset-email-input"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="student@institution.edu.ng"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900"
                    disabled={resetLoading}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={resetLoading}
                    onClick={() => setShowResetModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={resetLoading}
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
