/**
 * @file src/types/notification.ts
 * @description Strongly-typed schemas for notifications, user status alerts, and workflow triggers.
 */

export type NotificationType =
  | 'report_submitted'
  | 'report_approved'
  | 'report_returned'
  | 'feedback_added'
  | 'account_update';

/**
 * Direct database representation of a notification entity.
 */
export interface NotificationRow {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationInsert {
  id?: string;
  recipient_id: string;
  actor_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string | null;
  reference_type?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  created_at?: string;
}

export interface NotificationUpdate {
  is_read?: boolean;
  read_at?: string | null;
}

/**
 * Client-facing notification item augmented with actor details.
 */
export interface NotificationItem extends NotificationRow {
  actor_name?: string | null;
}

/**
 * Payload for creating notifications via client service or trigger.
 */
export interface CreateNotificationInput {
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string | null;
  referenceType?: string;
}
