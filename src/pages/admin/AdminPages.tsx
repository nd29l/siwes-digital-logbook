/**
 * @file src/pages/admin/AdminPages.tsx
 * @description Route placeholder views for Admin Portal navigation in Module 04.
 */

import React from 'react';
import { ModulePlaceholderPage } from '@/components/common/ModulePlaceholderPage';
import { RouteId } from '@/types';
import { Users, FileCheck, MessageSquareText, Settings } from 'lucide-react';

interface AdminPageRouteProps {
  onNavigate: (routeId: RouteId) => void;
}

export { AdminDashboardPage } from './AdminDashboardPage';
export { AdminStudentsPage } from './students/AdminStudentsPage';
export { AdminReportsPage } from './reports/AdminReportsPage';
export { AdminRemarksPage } from './remarks/AdminRemarksPage';

export const AdminSettingsPage: React.FC<AdminPageRouteProps> = ({ onNavigate }) => (
  <ModulePlaceholderPage
    featureTitle="SIWES System Settings"
    icon={Settings}
    targetRole="admin"
    description="Institution SIWES calendar configuration, coordinator assignments, and audit controls."
    features={[
      'Academic session and SIWES cycle calendar dates',
      'Departmental coordinator role assignments',
      'Export logbook archives to PDF',
      'System security and access logs',
    ]}
    onBackToDashboard={onNavigate}
  />
);
