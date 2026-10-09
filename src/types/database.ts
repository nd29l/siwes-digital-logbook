/**
 * @file src/types/database.ts
 * @description Strongly-typed database entity interfaces mapping directly to the PostgreSQL schema.
 * Represents tables, columns, relationships, and Supabase client type definitions.
 */

import { UserRole, WeekStatus, SiwesDay } from './index';
import {
  NotificationRow,
  NotificationInsert,
  NotificationUpdate,
} from './notification';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      logbook_weeks: {
        Row: LogbookWeekRow;
        Insert: LogbookWeekInsert;
        Update: LogbookWeekUpdate;
        Relationships: [
          {
            foreignKeyName: 'logbook_weeks_student_id_fkey';
            columns: ['student_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'logbook_weeks_reviewed_by_fkey';
            columns: ['reviewed_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      daily_activities: {
        Row: DailyActivityRow;
        Insert: DailyActivityInsert;
        Update: DailyActivityUpdate;
        Relationships: [
          {
            foreignKeyName: 'daily_activities_week_id_fkey';
            columns: ['week_id'];
            referencedRelation: 'logbook_weeks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'daily_activities_student_id_fkey';
            columns: ['student_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
        Relationships: [
          {
            foreignKeyName: 'notifications_recipient_id_fkey';
            columns: ['recipient_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_actor_id_fkey';
            columns: ['actor_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_week_editable_by_student: {
        Args: {
          check_week_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      week_status: WeekStatus;
      siwes_day: SiwesDay;
    };
  };
}

/**
 * Profiles Table Row Entity
 */
export interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  matric_number: string | null;
  institution: string | null;
  department: string | null;
  organisation: string | null;
  siwes_start_date: string | null; // ISO Date YYYY-MM-DD
  siwes_end_date: string | null;   // ISO Date YYYY-MM-DD
  created_at: string;              // ISO Timestamptz
  updated_at: string;              // ISO Timestamptz
}

export type ProfileInsert = Omit<ProfileRow, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Partial<ProfileInsert>;

/**
 * Logbook Weeks Table Row Entity
 */
export interface LogbookWeekRow {
  id: string;
  student_id: string;
  week_number: number;
  status: WeekStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_remark: string | null;
  admin_feedback: string | null;
  created_at: string;
  updated_at: string;
}

export type LogbookWeekInsert = Omit<LogbookWeekRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type LogbookWeekUpdate = Partial<LogbookWeekInsert>;

/**
 * Daily Activities Table Row Entity
 */
export interface DailyActivityRow {
  id: string;
  week_id: string;
  student_id: string;
  day: SiwesDay;
  activity_date: string; // ISO Date YYYY-MM-DD
  title: string;
  activity: string;
  equipment_used: string | null;
  created_at: string;
  updated_at: string;
}

export type DailyActivityInsert = Omit<DailyActivityRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type DailyActivityUpdate = Partial<DailyActivityInsert>;

/**
 * Composite view of a full weekly report with its 5 daily activities
 */
export interface CompleteWeeklyReport extends LogbookWeekRow {
  student?: ProfileRow;
  reviewer?: ProfileRow | null;
  activities: DailyActivityRow[];
}
