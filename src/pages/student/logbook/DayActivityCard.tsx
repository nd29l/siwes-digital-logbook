/**
 * @file src/pages/student/logbook/DayActivityCard.tsx
 * @description Card component for one of the 5 SIWES work days (Monday - Friday).
 * Displays recorded activity, equipment used, and action buttons for editing and deleting.
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DailyActivityRow, SiwesDay } from '@/types';
import { formatDate } from '@/utils';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Wrench,
  Plus,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DayActivityCardProps {
  day: SiwesDay;
  dateStr: string; // ISO YYYY-MM-DD
  activity: DailyActivityRow | null;
  isWeekEditable: boolean;
  onAdd: (day: SiwesDay, dateStr: string) => void;
  onEdit: (activity: DailyActivityRow) => void;
  onDelete: (activity: DailyActivityRow) => void;
}

export const DayActivityCard: React.FC<DayActivityCardProps> = ({
  day,
  dateStr,
  activity,
  isWeekEditable,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActivity = Boolean(activity);

  // Check whether the activity description is long
  const isLongDescription = Boolean(activity && activity.activity.length > 280);

  return (
    <Card
      id={`day-card-${day.toLowerCase()}`}
      className={`relative transition-all duration-150 overflow-hidden ${
        hasActivity
          ? 'border-slate-200/90 bg-white hover:border-slate-300'
          : 'border-dashed border-slate-300 bg-slate-50/40'
      }`}
    >
      {/* Top Day Header Bar */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
              hasActivity
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {day.substring(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">{day}</h3>
              {hasActivity ? (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Logged
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  <Clock className="w-3 h-3 text-slate-400" />
                  No Entry
                </Badge>
              )}
            </div>
            <p className="text-2xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400 inline" />
              {formatDate(dateStr)}
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-1.5">
          {activity && isWeekEditable && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(activity)}
                className="text-xs py-1 px-2.5 text-slate-700 hover:text-slate-900"
                id={`btn-edit-${day.toLowerCase()}`}
                title="Edit this activity"
                aria-label={`Edit activity for ${day}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(activity)}
                className="text-xs py-1 px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                id={`btn-delete-${day.toLowerCase()}`}
                title="Delete this activity"
                aria-label={`Delete activity for ${day}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          {activity && !isWeekEditable && (
            <div className="flex items-center gap-1 text-2xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              <Lock className="w-3 h-3" />
              <span>Locked</span>
            </div>
          )}

          {!activity && isWeekEditable && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAdd(day, dateStr)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 text-xs py-1 px-2.5 shadow-2xs"
              id={`btn-add-${day.toLowerCase()}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Activity</span>
            </Button>
          )}

          {!activity && !isWeekEditable && (
            <div className="flex items-center gap-1 text-2xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              <Lock className="w-3 h-3" />
              <span>Week Locked</span>
            </div>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="mt-3.5">
        {activity ? (
          <div className="space-y-3">
            {/* Title */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {activity.title}
              </h4>
            </div>

            {/* Narrative Description */}
            <div className="text-xs text-slate-700 leading-relaxed space-y-1">
              <p
                className={`whitespace-pre-line ${
                  !isExpanded && isLongDescription ? 'line-clamp-4' : ''
                }`}
              >
                {activity.activity}
              </p>

              {isLongDescription && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-2xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-1 cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>Read full narrative</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Equipment & Tools Used */}
            {activity.equipment_used && (
              <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-xs">
                <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Wrench className="w-3 h-3" />
                </div>
                <div>
                  <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500 block">
                    Equipment & Tools Handled:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    {activity.equipment_used.split(',').map((tool, idx) => {
                      const trimmed = tool.trim();
                      if (!trimmed) return null;
                      return (
                        <span
                          key={idx}
                          className="text-2xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-mono"
                        >
                          {trimmed}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty Day Slot */
          <div className="py-4 text-center space-y-2">
            <p className="text-xs text-slate-500">
              No technical activity recorded for {day}.
            </p>
            {isWeekEditable && (
              <p className="text-2xs text-slate-400">
                Click <strong>"Record Activity"</strong> above to document tasks, procedures, and tools for this day.
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
