/**
 * @file src/constants/navigation.ts
 * @description Centralized navigation schema defining menu routes for Student and Admin portals.
 */

import {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  CalendarCheck,
  Settings,
  Users,
  FileCheck,
  MessageSquareText,
} from 'lucide-react';
import { NavSection, NavItem, UserRole, RouteId } from '@/types';

/**
 * Student portal navigation sections.
 * Maps to roadmap modules: MOD-06 (Dashboard), MOD-05 (Profile), MOD-07 (Daily Logbook), MOD-08 (Weekly Reports).
 */
export const STUDENT_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      {
        id: 'student-dashboard',
        label: 'Dashboard',
        shortLabel: 'Overview',
        icon: LayoutDashboard,
        path: '/student/dashboard',
        allowedRoles: ['student'],
        description: 'Logbook overview, current week progress & quick actions',
      },
      {
        id: 'student-logbook',
        label: 'Daily Logbook',
        shortLabel: 'Logbook',
        icon: BookOpen,
        path: '/student/logbook',
        allowedRoles: ['student'],
        description: 'Record daily SIWES technical activities & tasks',
      },
      {
        id: 'student-weekly-reports',
        label: 'Weekly Reports',
        shortLabel: 'Reports',
        icon: CalendarCheck,
        path: '/student/weekly-reports',
        allowedRoles: ['student'],
        description: 'Compile 5-day cycle reports & submit to admin',
      },
    ],
  },
  {
    title: 'Account & SIWES Info',
    items: [
      {
        id: 'student-profile',
        label: 'Profile & Placement',
        shortLabel: 'Profile',
        icon: UserCheck,
        path: '/student/profile',
        allowedRoles: ['student'],
        description: 'Organisation details, supervisor, matric & department',
      },
      {
        id: 'student-settings',
        label: 'Account Settings',
        shortLabel: 'Settings',
        icon: Settings,
        path: '/student/settings',
        allowedRoles: ['student'],
        description: 'Password, security preferences & notifications',
      },
    ],
  },
];

/**
 * Admin portal navigation sections.
 * Maps to roadmap modules: MOD-09 (Dashboard), MOD-10 (Student Directory), MOD-11 (Report Review), MOD-12 (Remarks).
 */
export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: 'SIWES Directorate',
    items: [
      {
        id: 'admin-dashboard',
        label: 'Admin Overview',
        shortLabel: 'Overview',
        icon: LayoutDashboard,
        path: '/admin/dashboard',
        allowedRoles: ['admin'],
        description: 'Institutional submission queues, metrics & summary stats',
      },
      {
        id: 'admin-students',
        label: 'Student Directory',
        shortLabel: 'Students',
        icon: Users,
        path: '/admin/students',
        allowedRoles: ['admin'],
        description: 'Student account provisioning, verification & cohort management',
      },
      {
        id: 'admin-reports',
        label: 'Report Review',
        shortLabel: 'Reviews',
        icon: FileCheck,
        path: '/admin/reports',
        allowedRoles: ['admin'],
        badge: 'Pending',
        description: 'Review, endorse, grade, and approve weekly 5-day submissions',
      },
      {
        id: 'admin-remarks',
        label: 'Remarks & Feedback',
        shortLabel: 'Remarks',
        icon: MessageSquareText,
        path: '/admin/remarks',
        allowedRoles: ['admin'],
        description: 'Audit logbook feedback, supervisor corrections & communication',
      },
    ],
  },
  {
    title: 'System Management',
    items: [
      {
        id: 'admin-settings',
        label: 'System Configuration',
        shortLabel: 'Settings',
        icon: Settings,
        path: '/admin/settings',
        allowedRoles: ['admin'],
        description: 'Institution rules, SIWES session calendars & coordinators',
      },
    ],
  },
];

/**
 * Helper to fetch navigation sections tailored strictly to a user's role.
 */
export function getNavSectionsForRole(role: UserRole | null): NavSection[] {
  if (role === 'student') return STUDENT_NAV_SECTIONS;
  if (role === 'admin') return ADMIN_NAV_SECTIONS;
  return [];
}

/**
 * Flat list of all navigation items for active route lookup.
 */
export function getAllNavItems(): NavItem[] {
  return [
    ...STUDENT_NAV_SECTIONS.flatMap((s) => s.items),
    ...ADMIN_NAV_SECTIONS.flatMap((s) => s.items),
  ];
}

/**
 * Lookup nav item details by RouteId.
 */
export function getNavItemById(id: RouteId): NavItem | undefined {
  return getAllNavItems().find((item) => item.id === id);
}
