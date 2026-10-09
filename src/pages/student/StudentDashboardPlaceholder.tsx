/**
 * @file src/pages/student/StudentDashboardPlaceholder.tsx
 * @description Student Portal Dashboard shell for Module 04.
 * Integrates quick metrics, profile summary, and navigation cards to logbook and weekly reports.
 */

import React from 'react';
import { useAuth } from '@/hooks';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RouteId } from '@/types';
import {
  BookOpen,
  CalendarCheck,
  User,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
  Building,
} from 'lucide-react';

interface StudentDashboardPlaceholderProps {
  onNavigate?: (routeId: RouteId) => void;
  onLogout?: () => void;
}

export const StudentDashboardPlaceholder: React.FC<StudentDashboardPlaceholderProps> = ({
  onNavigate,
}) => {
  const { profile, user } = useAuth();

  return (
    <div id="student-dashboard-page" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Student Workspace
            </span>
            <span className="text-xs text-slate-400">Module 04 Layout Active</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {profile?.full_name || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            SIWES Digital Logbook allows you to record daily technical activities, compile weekly 5-day cycle reports,
            and monitor supervisor endorsements in real time.
          </p>
        </div>

        {onNavigate && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('student-logbook')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Daily Logbook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('student-weekly-reports')}
              className="text-slate-200 border-slate-700 hover:bg-slate-800"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Weekly Reports
            </Button>
          </div>
        )}
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Current Cycle</span>
            <span className="text-sm font-bold text-slate-900">Week 1 (In Progress)</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Weekly Submissions</span>
            <span className="text-sm font-bold text-slate-900">0 Submitted</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Supervisor Endorsement</span>
            <span className="text-sm font-bold text-slate-900">Pending Setup</span>
          </div>
        </Card>
      </div>

      {/* Main Student Profile & Navigation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card id="student-profile-info" className="lg:col-span-2">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Verified Student Profile</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                <ShieldCheck className="w-3 h-3" />
                Role: student
              </Badge>
              {onNavigate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('student-profile')}
                  className="text-xs py-1 px-2.5"
                >
                  Manage Profile
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Full Name:</span>
              <span className="font-semibold text-slate-900 text-sm">{profile?.full_name || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Registered Email:</span>
              <span className="font-mono text-slate-800">{user?.email || profile?.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Matriculation Number:</span>
              <span className="font-mono font-medium text-slate-800">{profile?.matric_number || 'Pending'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Academic Department:</span>
              <span className="text-slate-800">{profile?.department || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Institution:</span>
              <span className="text-slate-800">{profile?.institution || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Phone Contact:</span>
              <span className="text-slate-800 font-mono">{profile?.phone || 'Not specified'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block">SIWES Placement Organisation:</span>
              <span className="text-slate-800 flex items-center gap-1.5 mt-0.5 font-medium">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {profile?.organisation || 'Placement details not yet configured'}
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Portal Navigation Links */}
        <Card id="student-quick-links">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Student Navigation</h3>
            <p className="text-xs text-slate-500">Test route transitions within the shell:</p>
          </div>

          <div className="mt-3 space-y-2">
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('student-logbook')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition-colors text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-slate-900">Daily Logbook</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('student-weekly-reports')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition-colors text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-sky-600" />
                    <span className="font-medium text-slate-900">Weekly Reports</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('student-profile')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition-colors text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-900">SIWES Placement Profile</span>
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
