/**
 * @file src/components/notifications/NotificationItem.tsx
 * @description Accessible notification item displaying status icons, relative timestamp,
 * unread state, and actionable links to relevant reports.
 */

import React from 'react';
import { NotificationItem as NotificationItemType, RouteId } from '@/types';
import { formatTimeAgo } from '@/utils';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  User,
  Check,
  ExternalLink,
} from 'lucide-react';

interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkAsRead: (id: string) => void;
  onNavigate?: (routeId: RouteId) => void;
  onCloseDropdown?: () => void;
  userRole?: 'student' | 'admin';
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onNavigate,
  onCloseDropdown,
  userRole,
}) => {
  const { id, type, title, message, is_read, created_at } = notification;

  const getTypeIcon = () => {
    switch (type) {
      case 'report_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'report_returned':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'feedback_added':
        return <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'report_submitted':
        return <Clock className="w-4 h-4 text-sky-600 shrink-0" />;
      case 'account_update':
      default:
        return <User className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
  };

  const getContainerBg = () => {
    if (is_read) return 'bg-white hover:bg-slate-50/80';
    switch (type) {
      case 'report_returned':
        return 'bg-amber-50/50 hover:bg-amber-50/80';
      case 'report_approved':
        return 'bg-emerald-50/40 hover:bg-emerald-50/70';
      case 'feedback_added':
        return 'bg-purple-50/40 hover:bg-purple-50/70';
      default:
        return 'bg-sky-50/40 hover:bg-sky-50/70';
    }
  };

  const handleClickItem = () => {
    if (!is_read) {
      onMarkAsRead(id);
    }

    if (onNavigate) {
      if (userRole === 'admin') {
        if (type === 'report_submitted') {
          onNavigate('admin-reports');
        } else if (type === 'feedback_added') {
          onNavigate('admin-remarks');
        } else {
          onNavigate('admin-reports');
        }
      } else {
        // Student target
        onNavigate('student-weekly-reports');
      }
      if (onCloseDropdown) {
        onCloseDropdown();
      }
    }
  };

  return (
    <div
      id={`notification-item-${id}`}
      className={`p-3.5 border-b border-slate-100 last:border-b-0 transition-colors flex items-start gap-3 relative ${getContainerBg()}`}
    >
      {/* Type Icon Container */}
      <div className="mt-0.5 p-1.5 rounded-lg bg-white shadow-2xs border border-slate-100 shrink-0">
        {getTypeIcon()}
      </div>

      {/* Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={handleClickItem}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClickItem();
          }
        }}
        aria-label={`${title}. ${message}`}
      >
        <div className="flex items-center justify-between gap-1.5">
          <h4 className={`text-xs font-semibold truncate ${is_read ? 'text-slate-800' : 'text-slate-950 font-bold'}`}>
            {title}
          </h4>
          {!is_read && (
            <span
              className="w-2 h-2 rounded-full bg-purple-600 shrink-0 animate-pulse"
              title="Unread notification"
            />
          )}
        </div>

        <p className={`text-xs mt-0.5 line-clamp-2 leading-relaxed ${is_read ? 'text-slate-500' : 'text-slate-700'}`}>
          {message}
        </p>

        <div className="mt-1.5 flex items-center gap-2 text-2xs text-slate-400 font-mono">
          <span>{formatTimeAgo(created_at)}</span>
          {notification.actor_name && (
            <>
              <span>&bull;</span>
              <span>By {notification.actor_name}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        {!is_read && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(id);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-purple-600 hover:bg-white transition-colors cursor-pointer"
            title="Mark as read"
            aria-label="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClickItem();
          }}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
          title="Open relevant page"
          aria-label="Open report page"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
