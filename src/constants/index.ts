/**
 * @file src/constants/index.ts
 * @description Application-wide constants and architectural module roadmap.
 */

export const APP_METADATA = {
  NAME: 'SIWES Digital Logbook',
  SHORT_NAME: 'SIWES Logbook',
  VERSION: '0.13.0',
  DESCRIPTION:
    'A production-grade web application digitally replacing the traditional physical Students Industrial Work Experience Scheme (SIWES) logbook.',
} as const;

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const;

export const WEEK_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  RETURNED: 'returned',
} as const;

/**
 * Standard SIWES work week definition.
 * Traditional SIWES records are grouped into 5 working days per week.
 */
export const SIWES_WORK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
] as const;

/**
 * Database Table Names
 */
export const DB_TABLES = {
  PROFILES: 'profiles',
  LOGBOOK_WEEKS: 'logbook_weeks',
  DAILY_ACTIVITIES: 'daily_activities',
} as const;

/**
 * Module Roadmap tracking implementation milestones.
 */
export interface RoadmapModule {
  id: number;
  code: string;
  title: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  description: string;
}

export const MODULE_ROADMAP: readonly RoadmapModule[] = [
  {
    id: 1,
    code: 'MOD-01',
    title: 'Project Foundation & Dev Environment',
    status: 'completed',
    description: 'React, TypeScript, Vite, Tailwind CSS, ESLint, Supabase client base setup.',
  },
  {
    id: 2,
    code: 'MOD-02',
    title: 'Supabase Database Architecture',
    status: 'completed',
    description: 'PostgreSQL schema, profiles, daily activities, weekly submissions, and RLS policies.',
  },
  {
    id: 3,
    code: 'MOD-03',
    title: 'Authentication & Role-Based Access',
    status: 'completed',
    description: 'Supabase Auth login/signup, session management, and Student/Admin RBAC guards.',
  },
  {
    id: 4,
    code: 'MOD-04',
    title: 'Application Layout & Navigation',
    status: 'completed',
    description: 'Responsive desktop/mobile navigation, role-aware sidebars, and user headers.',
  },
  {
    id: 5,
    code: 'MOD-05',
    title: 'Student Profile & SIWES Details',
    status: 'completed',
    description: 'Company information, industrial placement details, institution and matric records.',
  },
  {
    id: 6,
    code: 'MOD-06',
    title: 'Student Dashboard',
    status: 'completed',
    description: 'Overview of logbook progress, current week tracker, and submission status badges.',
  },
  {
    id: 7,
    code: 'MOD-07',
    title: 'Daily Activity / Digital Logbook',
    status: 'completed',
    description: 'Daily entry editor, activity descriptions, equipment used, and diagrams/attachments.',
  },
  {
    id: 8,
    code: 'MOD-08',
    title: 'Weekly Report Submission',
    status: 'completed',
    description: '5-day week compilation, student declaration, and submission to admin review.',
  },
  {
    id: 9,
    code: 'MOD-09',
    title: 'Admin Dashboard',
    status: 'completed',
    description: 'Multi-student overview, submission queues, statistics, and pending reviews.',
  },
  {
    id: 10,
    code: 'MOD-10',
    title: 'Student Account Management',
    status: 'completed',
    description: 'Admin student directory, approval verification, and cohort filtering.',
  },
  {
    id: 11,
    code: 'MOD-11',
    title: 'Admin Report Review & Scoring',
    status: 'completed',
    description: 'Week-by-week logbook inspection, endorsement, grading, and approval workflows.',
  },
  {
    id: 12,
    code: 'MOD-12',
    title: 'Supervisor Remarks & Feedback',
    status: 'completed',
    description: 'Admin comments, correction requests, and student feedback history.',
  },
  {
    id: 13,
    code: 'MOD-13',
    title: 'Notifications & Status Feedback',
    status: 'completed',
    description: 'Real-time workflow alerts, unread badges, report status updates, and notification center.',
  },
  {
    id: 14,
    code: 'MOD-14',
    title: 'Testing, Security, PWA & Deployment',
    status: 'upcoming',
    description: 'Audit RLS security, offline service worker caching, and Vercel/Cloud Run deployment.',
  },
] as const;

export * from './navigation';
