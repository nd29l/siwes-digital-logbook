/**
 * @file src/components/common/Header.tsx
 * @description Main application header for public pages (Overview, Login) in the SIWES Digital Logbook.
 * Displays brand logo, connection status, quick view switcher, and authentication actions.
 */

import React from 'react';
import { BookOpenCheck, ShieldCheck, LogOut, User, Lock, LayoutDashboard } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { APP_METADATA } from '@/constants';
import { useAuth } from '@/hooks';
import { RouteId } from '@/types';

interface HeaderProps {
  supabaseConfigured: boolean;
  currentRoute?: RouteId;
  onNavigate?: (route: RouteId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  supabaseConfigured,
  currentRoute,
  onNavigate,
}) => {
  const { user, profile, role, isAuthenticated, signOut } = useAuth();

  const brandContent = (
    <>
      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
        <BookOpenCheck className="w-5 h-5 text-emerald-400" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 tracking-tight text-base sm:text-lg">
            {APP_METADATA.NAME}
          </span>
          <span className="hidden md:inline-block text-xs text-slate-400">
            v{APP_METADATA.VERSION}
          </span>
        </div>
        <p className="text-xs text-slate-500 hidden sm:block">
          Students Industrial Work Experience Scheme
        </p>
      </div>
    </>
  );

  return (
    <header id="app-public-header" className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo — returns the visitor to the public landing page */}
        {onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            aria-label={`${APP_METADATA.NAME} home`}
            className="flex items-center gap-3 cursor-pointer select-none text-left rounded-lg"
          >
            {brandContent}
          </button>
        ) : (
          <div className="flex items-center gap-3 select-none">{brandContent}</div>
        )}

        {/* Right Status Indicators & User Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Nav switcher */}
          {onNavigate && (
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => onNavigate('overview')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  currentRoute === 'overview'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  currentRoute === 'login'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => onNavigate(role === 'admin' ? 'admin-dashboard' : 'student-dashboard')}
                  className="px-3 py-1 rounded-md text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-1"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Enter {role === 'admin' ? 'Admin' : 'Student'} Portal
                </button>
              )}
            </div>
          )}

          {/* Connection status */}
          {supabaseConfigured ? (
            <Badge variant="success" size="sm" className="hidden sm:inline-flex">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Connected
            </Badge>
          ) : (
            <Badge variant="warning" size="sm" className="hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Standby
            </Badge>
          )}

          {/* User Status / Logout */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-slate-900 max-w-[140px] truncate">
                  {profile?.full_name || user.email}
                </div>
                <div className="text-[10px] text-slate-500 capitalize flex items-center justify-end gap-1">
                  {role === 'admin' ? (
                    <Lock className="w-2.5 h-2.5 text-purple-600 inline" />
                  ) : (
                    <User className="w-2.5 h-2.5 text-sky-600 inline" />
                  )}
                  {role}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="text-xs px-2.5"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            onNavigate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('login')}
                className="text-xs"
              >
                Sign In
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
