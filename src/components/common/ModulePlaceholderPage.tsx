/**
 * @file src/components/common/ModulePlaceholderPage.tsx
 * @description Standardized, accessible placeholder page for features that are not yet available.
 * Communicates availability status with neutral, user-facing wording.
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LucideIcon, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { RouteId, UserRole } from '@/types';

interface ModulePlaceholderPageProps {
  featureTitle: string;
  icon: LucideIcon;
  targetRole: UserRole;
  description: string;
  features: string[];
  onBackToDashboard?: (routeId: RouteId) => void;
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderPageProps> = ({
  featureTitle,
  icon: Icon,
  targetRole,
  description,
  features,
  onBackToDashboard,
}) => {
  return (
    <div id="placeholder-page" className="space-y-6">
      {/* Availability Status Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-950 text-sm">{featureTitle}</span>
              <Badge variant="warning" size="sm">Coming Soon</Badge>
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              This area is being prepared and will be available in a future update.
            </p>
          </div>
        </div>

        {onBackToDashboard && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBackToDashboard(targetRole === 'admin' ? 'admin-dashboard' : 'student-dashboard')}
            className="text-xs shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Button>
        )}
      </div>

      {/* Feature Specification Card */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                targetRole === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{featureTitle}</h2>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>

          <Badge variant={targetRole === 'admin' ? 'purple' : 'info'} size="sm">
            <ShieldCheck className="w-3 h-3" />
            Role: {targetRole}
          </Badge>
        </div>

        <div className="mt-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Available Soon
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5"
              >
                <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span className="text-slate-700 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
