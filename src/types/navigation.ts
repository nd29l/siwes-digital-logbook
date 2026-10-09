/**
 * @file src/types/navigation.ts
 * @description Navigation item definitions and route configuration types for SIWES Digital Logbook.
 */

import { LucideIcon } from 'lucide-react';
import { UserRole } from './index';

/**
 * Route keys supported by the system.
 */
export type RouteId =
  // Public routes
  | 'overview'
  | 'login'
  // Student routes
  | 'student-dashboard'
  | 'student-profile'
  | 'student-logbook'
  | 'student-weekly-reports'
  | 'student-settings'
  // Admin routes
  | 'admin-dashboard'
  | 'admin-students'
  | 'admin-reports'
  | 'admin-remarks'
  | 'admin-settings';

/**
 * Navigation item representation for desktop and mobile navigation.
 */
export interface NavItem {
  id: RouteId;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  path: string;
  allowedRoles: UserRole[];
  badge?: string;
  description?: string;
}

/**
 * Navigation section groupings (e.g., Core, Logbook, Account).
 */
export interface NavSection {
  title: string;
  items: NavItem[];
}
