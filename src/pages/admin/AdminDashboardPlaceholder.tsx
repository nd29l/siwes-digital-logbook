/**
 * @file src/pages/admin/AdminDashboardPlaceholder.tsx
 * @description Admin Portal Dashboard shell for Module 04.
 * Integrates institutional submission metrics, directorate controls, and navigation shortcuts to reviews & directory.
 */

import React from 'react';
import { useAuth } from '@/hooks';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RouteId } from '@/types';
import {
  Users,
  FileCheck,
  MessageSquareText,
  ShieldCheck,
  User,
  ArrowRight,
  Clock,
  Building,
} from 'lucide-react';

interface AdminDashboardPlaceholderProps {
  onNavigate?: (routeId: RouteId) => void;
  onLogout?: () => void;
}

export const AdminDashboardPlaceholder: React.FC<AdminDashboardPlaceholderProps> = ({
  onNavigate,
}) => {
  const { profile, user } = useAuth();

  return (
    <div id="admin-dashboard-page" className="space-y-6">
      {/* Welcome Directorate Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              SIWES Directorate
            </span>
            <span className="text-xs text-purple-300">Module 04 Layout Active</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Administrator Console &mdash; {profile?.full_name || 'System Admin'}
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 max-w-xl">
            Monitor institutional student cohorts, review weekly 5-day cycle logbook submissions,
            record supervisor remarks, and manage placement approvals.
          </p>
        </div>

        {onNavigate && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('admin-reports')}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Review Queue
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('admin-students')}
              className="text-purple-200 border-purple-700 hover:bg-purple-800"
            >
              <Users className="w-3.5 h-3.5" />
              Student Directory
            </Button>
          </div>
        )}
      </div>

      {/* Admin Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Registered Cohort</span>
            <span className="text-sm font-bold text-slate-900">Active Students</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Pending Endorsements</span>
            <span className="text-sm font-bold text-slate-900">Report Review Queue</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Approved Submissions</span>
            <span className="text-sm font-bold text-slate-900">Endorsed Weeks</span>
          </div>
        </Card>
      </div>

      {/* Admin Profile & Directorate Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card id="admin-profile-info" className="lg:col-span-2">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-purple-700" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Administrator Credentials</h2>
            </div>
            <Badge variant="purple" size="sm">
              <ShieldCheck className="w-3 h-3" />
              Role: admin
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Administrator Name:</span>
              <span className="font-semibold text-slate-900 text-sm">{profile?.full_name || 'Chief Administrator'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Registered Email:</span>
              <span className="font-mono text-slate-800">{user?.email || profile?.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Institutional Unit:</span>
              <span className="text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {profile?.institution || 'Institution SIWES Unit'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Department / Directorate:</span>
              <span className="text-slate-800">{profile?.department || 'Directorate of Industrial Training'}</span>
            </div>
          </div>
        </Card>

        {/* Directorate Navigation Shortcuts */}
        <Card id="admin-quick-links">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Directorate Navigation</h3>
            <p className="text-xs text-slate-500">Test route transitions within the shell:</p>
          </div>

          <div className="mt-3 space-y-2">
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('admin-reports')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition-colors text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-purple-700" />
                    <span className="font-medium text-slate-900">Report Review Queue</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('admin-students')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition-colors text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-700" />
                    <span className="font-medium text-slate-900">Student Directory</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('admin-remarks')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition-colors text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="w-4 h-4 text-purple-700" />
                    <span className="font-medium text-slate-900">Supervisor Remarks</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
