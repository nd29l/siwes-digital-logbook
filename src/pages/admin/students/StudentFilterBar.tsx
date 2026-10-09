/**
 * @file src/pages/admin/students/StudentFilterBar.tsx
 * @description Accessible toolbar for searching, filtering by department/placement, and sorting the student directory.
 */

import React from 'react';
import { StudentFilterOptions } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Search, X } from 'lucide-react';

interface StudentFilterBarProps {
  filters: StudentFilterOptions;
  onFilterChange: (filters: StudentFilterOptions) => void;
  availableDepartments: string[];
  totalResults: number;
}

export const StudentFilterBar: React.FC<StudentFilterBarProps> = ({
  filters,
  onFilterChange,
  availableDepartments,
  totalResults,
}) => {
  const isFiltered =
    Boolean(filters.searchQuery.trim()) ||
    filters.department !== 'all' ||
    filters.placementStatus !== 'all';

  const handleResetFilters = () => {
    onFilterChange({
      searchQuery: '',
      department: 'all',
      placementStatus: 'all',
      sortBy: 'created_desc',
    });
  };

  return (
    <div
      id="student-filter-toolbar"
      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input: 5 cols */}
        <div className="lg:col-span-5 relative">
          <Input
            id="student-directory-search-input"
            type="search"
            placeholder="Search by name, email, matric, organisation..."
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
            id="filter-department-select"
            value={filters.department}
            aria-label="Filter by Department"
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

        {/* Placement Status Filter: 2 cols */}
        <div className="lg:col-span-2">
          <Select
            id="filter-placement-select"
            value={filters.placementStatus}
            aria-label="Filter by Placement Status"
            onChange={(e) =>
              onFilterChange({
                ...filters,
                placementStatus: e.target.value as StudentFilterOptions['placementStatus'],
              })
            }
          >
            <option value="all">All Placements</option>
            <option value="configured">Placement Set</option>
            <option value="pending">Placement Pending</option>
          </Select>
        </div>

        {/* Sort Order: 2 cols */}
        <div className="lg:col-span-2">
          <Select
            id="filter-sort-select"
            value={filters.sortBy}
            aria-label="Sort Student List"
            onChange={(e) =>
              onFilterChange({
                ...filters,
                sortBy: e.target.value as StudentFilterOptions['sortBy'],
              })
            }
          >
            <option value="created_desc">Newest First</option>
            <option value="name_asc">Name (A – Z)</option>
            <option value="name_desc">Name (Z – A)</option>
            <option value="matric_asc">Matric Number</option>
          </Select>
        </div>
      </div>

      {/* Filter Summary & Reset Bar */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-900">{totalResults}</strong> enrolled {totalResults === 1 ? 'student' : 'students'}
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
