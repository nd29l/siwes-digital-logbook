/**
 * @file src/services/notificationService.ts
 * @description Dedicated service for dispatching, querying, and updating notifications and status alerts
 * backed by PostgreSQL public.notifications under Row-Level Security (RLS).
 * 
 * Architectural & Security Rules:
 * 1. Client-safe: Operates through public Supabase client under RLS policies.
 * 2. Privacy isolation: Users can only read their own notifications (recipient_id = auth.uid()).
 * 3. Graceful degradation: If the notifications table has not been provisioned yet in a given environment,
 *    methods degrade gracefully without crashing the UI.
 * 4. Duplicate suppression: Avoids spamming users with duplicate notifications for repeated actions.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  NotificationItem,
  NotificationRow,
  CreateNotificationInput,
  ServiceResult,
} from '@/types';

/**
 * Normalizes notification database errors into clean, readable messages.
 */
export function formatNotificationError(error: unknown): string {
  if (!error) return 'An unexpected error occurred while processing notifications.';

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  if (code === '42P01' || message.includes('relation "public.notifications" does not exist')) {
    return 'Notification system is in initialization mode (database migration pending).';
  }

  if (code === '42501' || message.includes('row-level security') || message.includes('policy')) {
    return 'Security Policy: Access restricted to authorized recipient.';
  }

  return message;
}

/**
 * In-memory fallback notification cache for local environments where migration is pending.
 */
const inMemoryFallbackStore: NotificationItem[] = [];

/**
 * Fetches notifications for a given user, ordered newest first.
 */
export async function getUserNotifications(
  userId: string,
  limit = 25,
  unreadOnly = false
): Promise<ServiceResult<NotificationItem[]>> {
  if (!isSupabaseConfigured()) {
    const userFallback = inMemoryFallbackStore.filter((n) => n.recipient_id === userId);
    return {
      data: unreadOnly ? userFallback.filter((n) => !n.is_read) : userFallback,
      error: null,
      success: true,
    };
  }

  if (!userId) {
    return {
      data: [],
      error: 'Missing user identifier.',
      success: false,
    };
  }

  try {
    let query = supabase
      .from('notifications')
      .select(`
        id,
        recipient_id,
        actor_id,
        type,
        title,
        message,
        reference_id,
        reference_type,
        is_read,
        read_at,
        created_at
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet, gracefully return in-memory items
      if (error.code === '42P01') {
        const userFallback = inMemoryFallbackStore.filter((n) => n.recipient_id === userId);
        return {
          data: unreadOnly ? userFallback.filter((n) => !n.is_read) : userFallback,
          error: null,
          success: true,
        };
      }

      return {
        data: null,
        error: formatNotificationError(error),
        success: false,
      };
    }

    // Batch resolve actor names if present
    const actorIds = Array.from(new Set((data || []).map((n) => n.actor_id).filter(Boolean))) as string[];
    const actorMap = new Map<string, string>();

    if (actorIds.length > 0) {
      const { data: actors } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', actorIds);

      (actors || []).forEach((a) => {
        actorMap.set(a.id, a.full_name);
      });
    }

    const items: NotificationItem[] = (data || []).map((row) => ({
      ...row,
      actor_name: row.actor_id ? actorMap.get(row.actor_id) || 'SIWES Directorate' : null,
    }));

    return {
      data: items,
      error: null,
      success: true,
    };
  } catch (err) {
    return {
      data: null,
      error: formatNotificationError(err),
      success: false,
    };
  }
}

/**
 * Counts unread notifications for a user.
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<ServiceResult<number>> {
  if (!isSupabaseConfigured() || !userId) {
    const count = inMemoryFallbackStore.filter(
      (n) => n.recipient_id === userId && !n.is_read
    ).length;
    return { data: count, error: null, success: true };
  }

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      if (error.code === '42P01') {
        const fallbackCount = inMemoryFallbackStore.filter(
          (n) => n.recipient_id === userId && !n.is_read
        ).length;
        return { data: fallbackCount, error: null, success: true };
      }

      return {
        data: 0,
        error: formatNotificationError(error),
        success: false,
      };
    }

    return {
      data: count || 0,
      error: null,
      success: true,
    };
  } catch (err) {
    return {
      data: 0,
      error: formatNotificationError(err),
      success: false,
    };
  }
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<ServiceResult<boolean>> {
  if (!notificationId || !userId) {
    return { data: false, error: 'Missing parameters', success: false };
  }

  // Update in-memory store if present
  const fallbackItem = inMemoryFallbackStore.find((n) => n.id === notificationId);
  if (fallbackItem) {
    fallbackItem.is_read = true;
    fallbackItem.read_at = new Date().toISOString();
  }

  if (!isSupabaseConfigured()) {
    return { data: true, error: null, success: true };
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (error && error.code !== '42P01') {
      return {
        data: false,
        error: formatNotificationError(error),
        success: false,
      };
    }

    return {
      data: true,
      error: null,
      success: true,
    };
  } catch (err) {
    return {
      data: false,
      error: formatNotificationError(err),
      success: false,
    };
  }
}

/**
 * Marks all notifications as read for a given user.
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<ServiceResult<boolean>> {
  if (!userId) {
    return { data: false, error: 'Missing user identifier', success: false };
  }

  // Update in-memory store
  inMemoryFallbackStore.forEach((n) => {
    if (n.recipient_id === userId) {
      n.is_read = true;
      n.read_at = new Date().toISOString();
    }
  });

  if (!isSupabaseConfigured()) {
    return { data: true, error: null, success: true };
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error && error.code !== '42P01') {
      return {
        data: false,
        error: formatNotificationError(error),
        success: false,
      };
    }

    return {
      data: true,
      error: null,
      success: true,
    };
  } catch (err) {
    return {
      data: false,
      error: formatNotificationError(err),
      success: false,
    };
  }
}

/**
 * Creates a notification with duplicate suppression (avoids spam within a 10-minute window).
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<ServiceResult<NotificationRow | null>> {
  const { recipientId, actorId, type, title, message, referenceId, referenceType = 'logbook_week' } = input;

  if (!recipientId || !title || !message) {
    return {
      data: null,
      error: 'Missing required notification fields.',
      success: false,
    };
  }

  // In-memory duplicate check
  const isDuplicateInMemory = inMemoryFallbackStore.some(
    (n) =>
      n.recipient_id === recipientId &&
      n.type === type &&
      n.reference_id === referenceId &&
      Date.now() - new Date(n.created_at).getTime() < 10 * 60 * 1000
  );

  if (isDuplicateInMemory) {
    return { data: null, error: null, success: true };
  }

  const newRecord: NotificationItem = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
    recipient_id: recipientId,
    actor_id: actorId || null,
    type,
    title,
    message,
    reference_id: referenceId || null,
    reference_type: referenceType,
    is_read: false,
    read_at: null,
    created_at: new Date().toISOString(),
  };

  inMemoryFallbackStore.unshift(newRecord);

  if (!isSupabaseConfigured()) {
    return { data: newRecord, error: null, success: true };
  }

  try {
    // Database duplicate check
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    let dupQuery = supabase
      .from('notifications')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq('type', type)
      .gte('created_at', tenMinutesAgo);

    if (referenceId) {
      dupQuery = dupQuery.eq('reference_id', referenceId);
    }

    const { data: existing } = await dupQuery.limit(1);

    if (existing && existing.length > 0) {
      return { data: null, error: null, success: true };
    }

    const { data: inserted, error: insertError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        actor_id: actorId || null,
        type,
        title,
        message,
        reference_id: referenceId || null,
        reference_type: referenceType,
        is_read: false,
      })
      .select('*')
      .single();

    if (insertError) {
      // Table doesn't exist yet, in-memory store already has it
      if (insertError.code === '42P01') {
        return { data: newRecord, error: null, success: true };
      }
      return {
        data: null,
        error: formatNotificationError(insertError),
        success: false,
      };
    }

    return {
      data: inserted as NotificationRow,
      error: null,
      success: true,
    };
  } catch (err) {
    return {
      data: null,
      error: formatNotificationError(err),
      success: false,
    };
  }
}

// -----------------------------------------------------------------------------
// WORKFLOW HELPER DISPATCHERS
// -----------------------------------------------------------------------------

/**
 * Notifies active administrators when a student submits a weekly report.
 */
export async function notifyAdminsOnReportSubmission(
  studentId: string,
  studentName: string,
  weekNumber: number,
  weekId: string
): Promise<void> {
  try {
    if (!isSupabaseConfigured()) return;

    // Fetch active admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) return;

    for (const admin of admins) {
      await createNotification({
        recipientId: admin.id,
        actorId: studentId,
        type: 'report_submitted',
        title: `Report Submitted (Week ${weekNumber})`,
        message: `${studentName || 'A student'} submitted their Week ${weekNumber} 5-day logbook report for review.`,
        referenceId: weekId,
        referenceType: 'logbook_week',
      });
    }
  } catch {
    // Non-blocking notification dispatch
  }
}

/**
 * Notifies a student when their weekly report is approved.
 */
export async function notifyStudentOnReportApproval(
  studentId: string,
  adminId: string,
  weekNumber: number,
  weekId: string,
  adminRemark?: string | null
): Promise<void> {
  try {
    await createNotification({
      recipientId: studentId,
      actorId: adminId,
      type: 'report_approved',
      title: `Week ${weekNumber} Report Approved`,
      message: adminRemark
        ? `Your Week ${weekNumber} logbook report has been endorsed and approved: "${adminRemark}"`
        : `Your Week ${weekNumber} 5-day logbook report has been endorsed and approved by the SIWES Directorate.`,
      referenceId: weekId,
      referenceType: 'logbook_week',
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Notifies a student when their weekly report is returned for corrections.
 */
export async function notifyStudentOnReportReturn(
  studentId: string,
  adminId: string,
  weekNumber: number,
  weekId: string,
  returnReason: string
): Promise<void> {
  try {
    await createNotification({
      recipientId: studentId,
      actorId: adminId,
      type: 'report_returned',
      title: `Week ${weekNumber} Report Returned for Revision`,
      message: returnReason
        ? `Action required: Your supervisor returned Week ${weekNumber} with revision instructions: "${returnReason}"`
        : `Action required: Your Week ${weekNumber} logbook report was returned for corrections.`,
      referenceId: weekId,
      referenceType: 'logbook_week',
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Notifies a student when supervisor remarks or feedback are added/updated.
 */
export async function notifyStudentOnFeedbackAdded(
  studentId: string,
  adminId: string,
  weekNumber: number,
  weekId: string,
  remarkText: string
): Promise<void> {
  try {
    await createNotification({
      recipientId: studentId,
      actorId: adminId,
      type: 'feedback_added',
      title: `Supervisor Remarks Updated (Week ${weekNumber})`,
      message: remarkText
        ? `New supervisor remarks have been recorded on your Week ${weekNumber} report: "${remarkText}"`
        : `New supervisor feedback has been recorded on your Week ${weekNumber} report.`,
      referenceId: weekId,
      referenceType: 'logbook_week',
    });
  } catch {
    // Non-blocking
  }
}
