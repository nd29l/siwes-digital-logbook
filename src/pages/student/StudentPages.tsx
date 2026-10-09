/**
 * @file src/pages/student/StudentPages.tsx
 * @description Route placeholder views for Student Portal navigation in Module 04.
 */

import React from 'react';
import { ModulePlaceholderPage } from '@/components/common/ModulePlaceholderPage';
import { RouteId } from '@/types';
import { UserCheck, BookOpen, CalendarCheck, Settings } from 'lucide-react';

interface StudentPageRouteProps {
  onNavigate: (routeId: RouteId) => void;
}

export { StudentDashboardPage } from './StudentDashboardPage';
export { StudentProfilePage } from './StudentProfilePage';
export { StudentLogbookPage } from './logbook/StudentLogbookPage';
export { StudentWeeklyReportsPage } from './weekly-reports/StudentWeeklyReportsPage';

export const StudentSettingsPage: React.FC<StudentPageRouteProps> = ({ onNavigate }) => (
  <ModulePlaceholderPage
    featureTitle="Account Settings"
    icon={Settings}
    targetRole="student"
    description="Account security, notifications, and session preferences."
    features={[
      'Password update',
      'Notification preferences',
      'Session history',
      'Help and SIWES documentation',
    ]}
    onBackToDashboard={onNavigate}
  />
);
