/**
 * @file src/pages/public/landing/DashboardPreview.tsx
 * @description Decorative UI mockup of the student logbook interface used in the landing hero.
 *
 * Built entirely from existing design-system primitives (Badge, Lucide icons) and static
 * sample content — it renders no live data, makes no external image requests, and is
 * clearly labelled as an illustrative preview.
 */

import React from 'react';
import {
  BookOpen,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  MessageSquare,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface PreviewDay {
  day: string;
  entry: string;
  status: 'logged' | 'empty';
}

const PREVIEW_DAYS: PreviewDay[] = [
  { day: 'Monday', entry: 'Network switch configuration', status: 'logged' },
  { day: 'Tuesday', entry: 'Cable tracing and documentation', status: 'logged' },
  { day: 'Wednesday', entry: 'Router firmware upgrade', status: 'logged' },
  { day: 'Thursday', entry: 'No entry recorded', status: 'empty' },
  { day: 'Friday', entry: 'No entry recorded', status: 'empty' },
];

const RAIL_ITEMS = [
  { icon: BookOpen, label: 'Logbook' },
  { icon: FileText, label: 'Weekly reports' },
  { icon: User, label: 'Profile' },
  { icon: Bell, label: 'Notifications' },
];

export const DashboardPreview: React.FC = () => {
  return (
    <figure className="relative">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden="true" />
          <span className="ml-3 hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-mono text-slate-500">
            <Lock className="h-3 w-3 text-emerald-600" aria-hidden="true" />
            siwes-logbook / student / logbook
          </span>
        </div>

        <div className="flex">
          {/* Navigation rail */}
          <div
            className="hidden sm:flex w-14 shrink-0 flex-col items-center gap-3 bg-slate-900 py-4"
            aria-hidden="true"
          >
            {RAIL_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                    index === 0
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              );
            })}
          </div>

          {/* Preview content */}
          <div className="min-w-0 flex-1 bg-slate-50/70 p-4 sm:p-5 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Daily Logbook
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">Week 3 &middot; Draft</p>
              </div>
              <Badge variant="warning" size="sm">
                <Clock className="w-3 h-3 text-amber-600" aria-hidden="true" />
                In progress
              </Badge>
            </div>

            <ul className="space-y-2">
              {PREVIEW_DAYS.map((item) => (
                <li
                  key={item.day}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                    item.status === 'logged'
                      ? 'border-slate-200 bg-white'
                      : 'border-dashed border-slate-300 bg-white/60'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-900">{item.day}</span>
                    <span className="block text-[11px] text-slate-500 truncate">{item.entry}</span>
                  </span>
                  {item.status === 'logged' ? (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                      Logged
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      No entry
                    </Badge>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="h-8 w-8 shrink-0 rounded-lg border border-emerald-200/70 bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-900 truncate">
                    Weekly report
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate">
                    Compile and submit for review
                  </span>
                </span>
              </span>
              <Badge variant="info" size="sm">
                Ready
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Floating feedback chip (desktop only) */}
      <div className="hidden lg:flex absolute -left-6 bottom-9 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
        <span className="h-8 w-8 rounded-lg border border-emerald-200/70 bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-semibold text-slate-900">
            Supervisor feedback
          </span>
          <span className="block text-[10px] text-slate-500">Previous week approved</span>
        </span>
      </div>

      <figcaption className="mt-3 text-center text-xs text-slate-500">
        Illustrative preview of the student logbook interface.
      </figcaption>
    </figure>
  );
};
