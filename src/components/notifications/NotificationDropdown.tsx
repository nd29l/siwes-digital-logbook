/**
 * @file src/components/notifications/NotificationDropdown.tsx
 * @description Accessible notification dropdown menu panel for desktop and mobile viewports.
 * Features real-time unread badges, filter tabs, mark-all-as-read, and report navigation.
 */

import React, { useState } from 'react';
import { NotificationItem as NotificationItemType, RouteId } from '@/types';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/Button';
import {
  Bell,
  CheckCheck,
  Inbox,
  RefreshCw,
  X,
} from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItemType[];
  unreadCount: number;
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
  onNavigate?: (routeId: RouteId) => void;
  userRole?: 'student' | 'admin';
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh,
  onNavigate,
  userRole,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  return (
    <>
      {/* Backdrop for click-outside dismissal */}
      <div
        className="fixed inset-0 z-30 bg-black/10 sm:bg-transparent"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popover Card */}
      <div
        id="notification-dropdown-panel"
        className="fixed sm:absolute left-2.5 right-2.5 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-96 rounded-2xl bg-white border border-slate-200/90 shadow-xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        role="dialog"
        aria-label="Notifications panel"
      >
        {/* Panel Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-700" />
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-2xs font-mono font-bold bg-purple-100 text-purple-700">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRefresh}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh notifications"
              disabled={isLoading}
              aria-label="Refresh notifications"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close panel"
              aria-label="Close notifications panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs & Quick Action */}
        <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-2xs py-0.5 px-2 text-purple-700 border-purple-200 hover:bg-purple-50 h-auto"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              <span>Mark all read</span>
            </Button>
          )}
        </div>

        {/* Scrollable Notification Items List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
          {isLoading && notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
              <p className="text-2xs text-slate-500">Checking for updates...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Inbox className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-2xs text-slate-400 max-w-[200px] mx-auto">
                {activeTab === 'unread'
                  ? 'You are all caught up on your logbook reports.'
                  : 'Status alerts and review updates will appear here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                onMarkAsRead={onMarkAsRead}
                onNavigate={onNavigate}
                onCloseDropdown={onClose}
                userRole={userRole}
              />
            ))
          )}
        </div>

        {/* Panel Footer */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 text-center">
          <button
            type="button"
            onClick={() => {
              if (onNavigate) {
                if (userRole === 'admin') {
                  onNavigate('admin-reports');
                } else {
                  onNavigate('student-weekly-reports');
                }
              }
              onClose();
            }}
            className="text-2xs font-semibold text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
          >
            {userRole === 'admin' ? 'View Weekly Reports Review Queue' : 'View All Weekly Reports'}
          </button>
        </div>
      </div>
    </>
  );
};
