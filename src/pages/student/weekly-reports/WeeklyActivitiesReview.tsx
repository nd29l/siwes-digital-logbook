/**
 * @file src/pages/student/weekly-reports/WeeklyActivitiesReview.tsx
 * @description Consolidated 5-day daily activity review for weekly report compilation.
 */

import React from 'react';
import { DailyActivityRow, DaySlotInfo, RouteId } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  Wrench,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  BookOpen,
} from 'lucide-react';

interface WeeklyActivitiesReviewProps {
  daySlots: DaySlotInfo[];
  isEditable: boolean;
  onNavigateToLogbook: (weekNumber: number) => void;
  weekNumber: number;
}

export const WeeklyActivitiesReview: React.FC<WeeklyActivitiesReviewProps> = ({
  daySlots,
  isEditable,
  onNavigateToLogbook,
  weekNumber,
}) => {
  return (
    <div id="weekly-activities-review-section" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>5-Day Work Week Activity Review</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual technical activities compiled for Monday through Friday
          </p>
        </div>

        {isEditable && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNavigateToLogbook(weekNumber)}
            className="text-xs self-start sm:self-center"
            id="link-open-daily-logbook"
          >
            <span>Open Daily Logbook</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}
      </div>

      {/* 5-Day Stacked Cards */}
      <div className="space-y-3">
        {daySlots.map((slot) => {
          const { day, formattedDate, activity, isLogged } = slot;

          return (
            <Card
              key={day}
              id={`review-day-card-${day.toLowerCase()}`}
              className={`p-4 transition-colors ${
                isLogged
                  ? 'border-slate-200/90 bg-white hover:border-slate-300'
                  : 'border-dashed border-slate-300/80 bg-slate-50/60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                {/* Left: Day & Date Badge */}
                <div className="md:w-48 shrink-0 flex md:flex-col items-center md:items-start justify-between md:justify-start gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{day}</span>
                    {isLogged ? (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Logged
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Not Recorded
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formattedDate}</span>
                  </div>
                </div>

                {/* Right: Activity Content or Empty Notice */}
                <div className="flex-1 min-w-0 md:pl-4 md:border-l md:border-slate-100">
                  {isLogged && activity ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                        {activity.title}
                      </h4>

                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                        {activity.activity}
                      </p>

                      {activity.equipment_used && (
                        <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600">
                          <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium text-slate-800">Equipment / Tools: </span>
                            <span>{activity.equipment_used}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
                      <p className="text-xs text-slate-400 italic">
                        No technical activity recorded for {day}.
                      </p>

                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => onNavigateToLogbook(weekNumber)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer self-start sm:self-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add in Logbook</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
