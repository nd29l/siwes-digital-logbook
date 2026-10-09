/**
 * @file src/pages/admin/dashboard/AdminCohortDistribution.tsx
 * @description Visual breakdown of enrolled SIWES students distributed across academic departments.
 */

import React from 'react';
import { DepartmentMetric } from '@/types';
import { Card } from '@/components/ui/Card';
import { GraduationCap, Users } from 'lucide-react';

interface AdminCohortDistributionProps {
  departments: DepartmentMetric[];
  totalStudents: number;
}

export const AdminCohortDistribution: React.FC<AdminCohortDistributionProps> = ({
  departments,
  totalStudents,
}) => {
  return (
    <Card id="admin-cohort-distribution-card" className="p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-purple-700" />
          <h3 className="text-sm font-bold text-slate-900">Student Cohort by Department</h3>
        </div>
        <span className="text-xs font-mono text-slate-500 font-semibold">
          {totalStudents} {totalStudents === 1 ? 'Student' : 'Students'}
        </span>
      </div>

      {departments.length === 0 || totalStudents === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 space-y-1">
          <p>No departmental enrollment records found.</p>
          <p className="text-2xs text-slate-400">Students will appear here as they register and set up their profiles.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {departments.map((dept) => (
            <div key={dept.department} className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 truncate max-w-[200px] sm:max-w-xs">
                  {dept.department}
                </span>
                <span className="font-mono text-slate-600 font-semibold shrink-0">
                  {dept.count} ({dept.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, dept.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
