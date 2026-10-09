/**
 * @file src/components/layout/TopBar.tsx
 * @description Accessible top bar header for authenticated application views.
 * Displays hamburger toggle for mobile, active page title, breadcrumb context, and user controls.
 */

import React, { useState } from 'react';
import { Menu, LogOut, User, Shield, ShieldCheck, AlertCircle, Bell } from 'lucide-react';
import { useAuth, useNotifications } from '@/hooks';
import { RouteId } from '@/types';
import { getNavItemById } from '@/constants';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { NotificationDropdown } from '@/components/notifications';
import { PWAInstallButton } from '@/components/pwa';

interface TopBarProps {
  currentRoute: RouteId;
  onOpenMobileNav: () => void;
  supabaseConfigured: boolean;
  onNavigate?: (routeId: RouteId) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentRoute,
  onOpenMobileNav,
  supabaseConfigured,
  onNavigate,
}) => {
  const { user, profile, role, signOut } = useAuth();
  const currentItem = getNavItemById(currentRoute);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading: isNotifLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  return (
    <header
      id="app-authenticated-topbar"
      className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20"
    >
      {/* Left: Mobile hamburger & Page Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
        <button
          id="mobile-nav-toggle-btn"
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-slate-400 capitalize hidden sm:inline shrink-0">
              {role === 'admin' ? 'Admin Portal' : 'Student Portal'} /
            </span>
            <h1 className="text-xs sm:text-base font-bold text-slate-900 tracking-tight truncate max-w-[110px] min-[380px]:max-w-[160px] sm:max-w-none">
              {currentItem?.label || 'SIWES Workspace'}
            </h1>
          </div>
          {currentItem?.description && (
            <p className="text-[11px] text-slate-500 hidden md:block truncate">
              {currentItem.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Notifications, Status and User Action */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA In-App Install Prompt */}
        <PWAInstallButton className="hidden sm:inline-flex" />

        {/* Supabase connection badge */}
        {supabaseConfigured ? (
          <Badge variant="success" size="sm" className="hidden md:inline-flex">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Connected
          </Badge>
        ) : (
          <Badge variant="warning" size="sm" className="hidden md:inline-flex">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Standby
          </Badge>
        )}

        {/* Notifications Bell & Dropdown */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            aria-expanded={isNotificationsOpen}
            aria-label={`Notifications, ${unreadCount} unread`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 ${
              isNotificationsOpen
                ? 'bg-purple-100 text-purple-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                id="notifications-unread-badge"
                className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-purple-600 text-white text-[10px] font-mono font-bold flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            unreadCount={unreadCount}
            isLoading={isNotifLoading}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onRefresh={refreshNotifications}
            onNavigate={onNavigate}
            userRole={role || 'student'}
          />
        </div>

        {/* User Pill & Sign Out */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="hidden sm:flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-sky-100 text-sky-700'
              }`}
            >
              {role === 'admin' ? (
                <Shield className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-900 leading-tight max-w-[140px] truncate">
                {profile?.full_name || user?.email}
              </div>
              <div className="text-[10px] text-slate-500 font-mono capitalize">
                Role: {role}
              </div>
            </div>
          </div>

          <Button
            id="topbar-signout-btn"
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="text-xs px-2 sm:px-2.5"
            title="Sign out of SIWES Logbook"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
