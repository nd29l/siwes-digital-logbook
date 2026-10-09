/**
 * @file src/hooks/useNotifications.ts
 * @description Hook managing user notifications, unread badge counts, and read/unread status updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead as markAsReadService,
  markAllNotificationsAsRead as markAllAsReadService,
} from '@/services';
import { NotificationItem } from '@/types';

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (!userId) {
      return;
    }

    Promise.all([
      getUserNotifications(userId, 25),
      getUnreadNotificationCount(userId),
    ])
      .then(([listRes, countRes]) => {
        if (isCancelled) return;
        if (listRes.success && listRes.data) {
          setNotifications(listRes.data);
        } else if (listRes.error) {
          setError(listRes.error);
        }

        if (countRes.success && countRes.data !== null && countRes.data !== undefined) {
          setUnreadCount(countRes.data);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : 'Error fetching notifications');
      })
      .finally(() => {
        if (isCancelled) return;
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const refreshNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [listRes, countRes] = await Promise.all([
        getUserNotifications(userId, 25),
        getUnreadNotificationCount(userId),
      ]);

      if (listRes.success && listRes.data) {
        setNotifications(listRes.data);
      } else if (listRes.error) {
        setError(listRes.error);
      }

      if (countRes.success && countRes.data !== null && countRes.data !== undefined) {
        setUnreadCount(countRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching notifications');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await markAsReadService(notificationId, userId);
    },
    [userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await markAllAsReadService(userId);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  };
}
