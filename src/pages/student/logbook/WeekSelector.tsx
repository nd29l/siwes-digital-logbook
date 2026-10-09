/**
 * @file src/pages/student/logbook/WeekSelector.tsx
 * @description Accessible week switcher toolbar with status badges, previous/next buttons, and week initialization.
 */

import React from 'react';
import { LogbookWeekRow, WeekStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Calendar,
} from 'lucide-react';

interface WeekSelectorProps {
  weeks: LogbookWeekRow[];
  selectedWeekNumber: number;
  onSelectWeek: (weekNumber: number) => void;
  onAddNextWeek: () => void;
  isAddingWeek?: boolean;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  weeks,
  selectedWeekNumber,
  onSelectWeek,
  onAddNextWeek,
  isAddingWeek = false,
}) => {
  const currentWeek = weeks.find((w) => w.week_number === selectedWeekNumber);
  const currentIndex = weeks.findIndex((w) => w.week_number === selectedWeekNumber);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < weeks.length - 1;

  const nextAvailableWeekNumber =
    weeks.length > 0
      ? Math.max(...weeks.map((w) => w.week_number)) + 1
      : 1;

  const getWeekBadge = (status: WeekStatus) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="info" size="sm">
            <Clock className="w-3 h-3" />
            Submitted
          </Badge>
        );
      case 'returned':
        return (
          <Badge variant="warning" size="sm">
            <AlertTriangle className="w-3 h-3" />
            Returned
          </Badge>
        );
      case 'draft':
      default:
        return (
          <Badge variant="neutral" size="sm">
            Draft
          </Badge>
        );
    }
  };

  return (
    <div
      id="week-selector-toolbar"
      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
    >
      {/* Left: Previous / Next Week and Current Selection */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Navigation Arrow Left */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => hasPrevious && onSelectWeek(weeks[currentIndex - 1].week_number)}
          disabled={!hasPrevious}
          className="text-xs px-2.5 py-1.5"
          id="btn-prev-week"
          title="Previous week"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev Week</span>
        </Button>

        {/* Week Dropdown Selector */}
        <div className="relative flex items-center">
          <select
            id="select-logbook-week"
            value={selectedWeekNumber}
            onChange={(e) => onSelectWeek(Number(e.target.value))}
            className="rounded-xl border border-slate-300 bg-slate-50/80 px-3 py-1.5 text-base sm:text-sm font-bold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 cursor-pointer max-w-[160px] min-[380px]:max-w-none"
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.week_number}>
                Week {w.week_number} ({w.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Arrow Right */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => hasNext && onSelectWeek(weeks[currentIndex + 1].week_number)}
          disabled={!hasNext}
          className="text-xs px-2.5 py-1.5"
          id="btn-next-week"
          title="Next week"
        >
          <span className="hidden sm:inline">Next Week</span>
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Current Week Status Badge */}
        {currentWeek && (
          <div className="flex items-center gap-1.5">
            {getWeekBadge(currentWeek.status)}
            {currentWeek.status !== 'draft' && currentWeek.status !== 'returned' && (
              <span className="hidden lg:flex items-center gap-1 text-2xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                <Lock className="w-3 h-3 text-slate-400" />
                Read-only
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Quick Week Pills & Add Next Week Action */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        {/* Quick pill tabs for up to 8 recent weeks */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {weeks.slice(0, 8).map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onSelectWeek(w.week_number)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                w.week_number === selectedWeekNumber
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              W{w.week_number}
            </button>
          ))}
        </div>

        {/* Add Next Week Button */}
        {nextAvailableWeekNumber <= 52 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddNextWeek}
            disabled={isAddingWeek}
            className="text-xs font-semibold border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100"
            id="btn-add-next-week"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Start Week {nextAvailableWeekNumber}</span>
          </Button>
        )}
      </div>
    </div>
  );
};
