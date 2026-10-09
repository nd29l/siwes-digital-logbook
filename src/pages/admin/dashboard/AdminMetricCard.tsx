/**
 * @file src/pages/admin/dashboard/AdminMetricCard.tsx
 * @description Accessible summary metric card component for Directorate administration statistics.
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';

interface AdminMetricCardProps {
  id?: string;
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  highlight?: boolean;
}

export const AdminMetricCard: React.FC<AdminMetricCardProps> = ({
  id,
  title,
  value,
  description,
  icon: Icon,
  iconBgColor = 'bg-purple-50',
  iconColor = 'text-purple-700',
  badge,
  onClick,
  highlight = false,
}) => {
  return (
    <Card
      id={id}
      className={`p-4 sm:p-5 transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs' : ''
      } ${highlight ? 'ring-1 ring-purple-300/80 bg-purple-50/20' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
            {value}
          </div>
        </div>

        <div
          className={`w-11 h-11 rounded-xl ${iconBgColor} ${iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(description || badge) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          {description && <span className="text-slate-500 truncate">{description}</span>}
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}
    </Card>
  );
};
