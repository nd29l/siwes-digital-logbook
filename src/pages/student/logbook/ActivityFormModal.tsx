/**
 * @file src/pages/student/logbook/ActivityFormModal.tsx
 * @description Accessible modal dialog for creating and editing daily SIWES logbook entries.
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { validateDailyActivityForm } from '@/services';
import {
  DailyActivityFormData,
  DailyActivityRow,
  ActivityValidationErrors,
  SiwesDay,
} from '@/types';
import { formatDate } from '@/utils';
import {
  Calendar,
  Save,
  Loader2,
  Wrench,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DailyActivityFormData) => Promise<{ success: boolean; error?: string }>;
  initialActivity?: DailyActivityRow | null;
  day: SiwesDay;
  activityDate: string; // ISO YYYY-MM-DD
  weekNumber: number;
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialActivity,
  day,
  activityDate,
  weekNumber,
}) => {
  const isEditing = Boolean(initialActivity);

  const [formData, setFormData] = useState<DailyActivityFormData>({
    title: initialActivity?.title || '',
    activity: initialActivity?.activity || '',
    equipment_used: initialActivity?.equipment_used || '',
    activity_date: activityDate,
    day,
  });

  const [formErrors, setFormErrors] = useState<ActivityValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (field: keyof DailyActivityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const { isValid, errors } = validateDailyActivityForm(formData);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await onSave(formData);
      if (res.success) {
        onClose();
      } else {
        setSubmitError(res.error || 'Failed to save activity entry.');
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'An unexpected error occurred while saving.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick equipment suggestions for common technical placements
  const commonTools = [
    'Multimeter',
    'Oscilloscope',
    'Soldering Station',
    'VS Code',
    'Linux CLI',
    'Network Analyzer',
    'Hydraulic Press',
    'AutoCAD',
  ];

  const handleAddEquipmentTag = (toolName: string) => {
    const current = formData.equipment_used.trim();
    if (!current) {
      handleInputChange('equipment_used', toolName);
    } else if (!current.toLowerCase().includes(toolName.toLowerCase())) {
      handleInputChange('equipment_used', `${current}, ${toolName}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Activity — ${day}` : `Record Activity — ${day}`}
      description={`Week ${weekNumber} • ${day}, ${formatDate(activityDate)}`}
      size="lg"
      id="activity-form-modal"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 text-xs shadow-sm"
            id="activity-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Save Changes' : 'Record Activity'}</span>
              </>
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Date & Week Slot Badge Bar */}
        <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 gap-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-900">{day}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-slate-600">{activityDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            Week {weekNumber} Working Day
          </div>
        </div>

        {/* Global Error Banner */}
        {submitError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to save daily activity</p>
              <p className="mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {/* Field 1: Technical Activity Title */}
        <div>
          <Input
            id="activity-title"
            label="Activity Title / Focus Area"
            required
            placeholder="e.g. Local Area Network cabling and switch configuration"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            error={formErrors.title}
            helperText="Concise summary of the primary technical assignment completed today."
          />
        </div>

        {/* Field 2: Detailed Technical Activity Narrative */}
        <Textarea
          id="activity-description"
          label="Detailed Work Description & Procedures"
          required
          rows={5}
          maxLength={5000}
          showCount
          placeholder="Detail the technical procedures performed, tools handled, steps followed, problems identified, and practical engineering/scientific knowledge acquired..."
          value={formData.activity}
          onChange={(e) => handleInputChange('activity', e.target.value)}
          error={formErrors.activity}
          helperText="Accurate, structured technical descriptions are evaluated by your institutional supervisor during logbook review."
        />

        {/* Field 3: Equipment, Machinery & Tools Used */}
        <div className="space-y-1.5">
          <label htmlFor="activity-equipment" className="block text-xs font-semibold text-slate-700">
            Equipment, Tools & Technologies Handled
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <input
              id="activity-equipment"
              type="text"
              placeholder="e.g. Fluke Multimeter, Crimping Tool, Cisco Catalyst Switch, Wireshark"
              value={formData.equipment_used}
              onChange={(e) => handleInputChange('equipment_used', e.target.value)}
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            />
          </div>
          {formErrors.equipment_used && (
            <p className="text-xs text-rose-600 mt-1">{formErrors.equipment_used}</p>
          )}

          {/* Quick tool suggestion tags */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-2xs text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Quick add:
            </span>
            {commonTools.map((tool) => (
              <button
                key={tool}
                type="button"
                onClick={() => handleAddEquipmentTag(tool)}
                className="text-2xs px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/70 transition-colors cursor-pointer"
              >
                + {tool}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
