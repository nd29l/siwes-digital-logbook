/**
 * @file src/pages/admin/remarks/RemarksFilterToolbar.tsx
 * @description Accessible toolbar for filtering supervisor remarks by category, searching, and sorting.
 */

import React from 'react';
import { FeedbackFilterOptions } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Search, X, MessageSquare, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';

interface RemarksFilterToolbarProps {
  filters: FeedbackFilterOptions;
  onFilterChange: (filters: FeedbackFilterOptions) => void;
  availableDepartments: string[];
  totalResults: number;
  categoryCounts: {
    allWithFeedback: number;
    returned: number;
    approved: number;
    all: number;
  };
}

export const RemarksFilterToolbar: React.FC<RemarksFilterToolbarProps> = ({
  filters,
  onFilterChange,
  availableDepartments,
  totalResults,
  categoryCounts,
}) => {
  const isFiltered =
    Boolean(filters.searchQuery.trim()) ||
    filters.department !== 'all' ||
    filters.feedbackType !== 'all_with_feedback';

  const handleResetFilters = () => {
    onFilterChange({
      searchQuery: '',
      feedbackType: 'all_with_feedback',
      department: 'all',
      sortBy: 'reviewed_desc',
    });
  };

  const tabs: Array<{
    id: FeedbackFilterOptions['feedbackType'];
    label: string;
    count: number;
    icon: React.ElementType;
    activeClass: string;
  }> = [
    {
      id: 'all_with_feedback',
      label: 'All Remarks & Feedback',
      count: categoryCounts.allWithFeedback,
      icon: MessageSquare,
      activeClass: 'bg-purple-700 text-white shadow-xs',
    },
    {
      id: 'returned',
      label: 'Correction Instructions',
      count: categoryCounts.returned,
      icon: AlertTriangle,
      activeClass: 'bg-rose-600 text-white shadow-xs',
    },
    {
      id: 'approved',
      label: 'Commendation Remarks',
      count: categoryCounts.approved,
      icon: CheckCircle2,
      activeClass: 'bg-emerald-600 text-white shadow-xs',
    },
    {
      id: 'all',
      label: 'All Evaluated Weeks',
      count: categoryCounts.all,
      icon: Layers,
      activeClass: 'bg-slate-700 text-white shadow-xs',
    },
  ];

  return (
    <div
      id="remarks-filter-toolbar"
      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5"
    >
      {/* 1. Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = filters.feedbackType === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange({ ...filters, feedbackType: tab.id })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? tab.activeClass
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-2xs font-mono font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Search & Select Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input: 6 cols */}
        <div className="lg:col-span-6 relative">
          <Input
            id="remarks-search-input"
            type="search"
            placeholder="Search by student, matric, department, or remark text..."
            icon={Search}
            value={filters.searchQuery}
            onChange={(e) =>
              onFilterChange({ ...filters, searchQuery: e.target.value })
            }
            className="text-xs sm:text-sm py-2"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Department Filter: 3 cols */}
        <div className="lg:col-span-3">
          <Select
            id="remarks-filter-department"
            value={filters.department}
            aria-label="Filter remarks by department"
            onChange={(e) =>
              onFilterChange({ ...filters, department: e.target.value })
            }
          >
            <option value="all">All Departments</option>
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </Select>
        </div>

        {/* Sort Order: 3 cols */}
        <div className="lg:col-span-3">
          <Select
            id="remarks-filter-sort"
            value={filters.sortBy}
            aria-label="Sort remarks"
            onChange={(e) =>
              onFilterChange({
                ...filters,
                sortBy: e.target.value as FeedbackFilterOptions['sortBy'],
              })
            }
          >
            <option value="reviewed_desc">Latest Feedback Date</option>
            <option value="reviewed_asc">Oldest Feedback Date</option>
            <option value="week_desc">Week Number (Highest)</option>
            <option value="student_asc">Student Name (A – Z)</option>
          </Select>
        </div>
      </div>

      {/* 3. Summary & Reset */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>
            Found <strong className="text-slate-900">{totalResults}</strong> report {totalResults === 1 ? 'record' : 'records'} with feedback
          </span>
          {isFiltered && (
            <span className="text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Active Filters
            </span>
          )}
        </div>

        {isFiltered && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="text-2xs py-1 px-2.5 text-slate-600 hover:text-slate-900 border-slate-200"
          >
            <X className="w-3 h-3 mr-1" />
            <span>Reset Filters</span>
          </Button>
        )}
      </div>
    </div>
  );
};
