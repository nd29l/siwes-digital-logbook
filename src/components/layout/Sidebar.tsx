/**
 * @file src/components/layout/Sidebar.tsx
 * @description Desktop persistent sidebar navigation for authenticated Student and Admin portals.
 * Accessible, semantic <aside> and <nav>, displaying grouped navigation sections, role badge, user card, and active states.
 */

import React from 'react';
import { useAuth } from '@/hooks';
import { getNavSectionsForRole } from '@/constants';
import { RouteId, NavItem } from '@/types';
import { BookOpenCheck, LogOut, User, Shield, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PWAInstallButton } from '@/components/pwa';

interface SidebarProps {
  currentRoute: RouteId;
  onNavigate: (routeId: RouteId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate }) => {
  const { user, profile, role, signOut } = useAuth();
  const navSections = getNavSectionsForRole(role);

  return (
    <aside
      id="app-desktop-sidebar"
      aria-label="Sidebar Navigation"
      className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 min-h-full select-none"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200">
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
          <BookOpenCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-slate-900 text-sm tracking-tight truncate">
            SIWES Logbook
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-slate-500 font-medium capitalize">
              {role === 'admin' ? 'Admin Portal' : 'Student Portal'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav
        id="sidebar-nav-sections"
        aria-label="Portal Navigation"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-6"
      >
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h2 className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {section.title}
            </h2>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item: NavItem) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;

                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                      isActive
                        ? role === 'admin'
                          ? 'bg-purple-900 text-white shadow-xs'
                          : 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? role === 'admin'
                              ? 'text-purple-300'
                              : 'text-emerald-400'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Card & Logout Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
        <PWAInstallButton className="w-full justify-center bg-white border-slate-300 text-slate-800 hover:bg-slate-100" />

        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-sky-100 text-sky-700'
              }`}
            >
              {role === 'admin' ? (
                <Shield className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                {profile?.full_name || 'Authenticated User'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono truncate">
                {user?.email}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <Badge
              variant={role === 'admin' ? 'purple' : 'info'}
              size="sm"
              className="text-[10px] py-0 px-2 uppercase font-mono tracking-wider"
            >
              {role}
            </Badge>

            <button
              id="sidebar-logout-btn"
              type="button"
              onClick={() => signOut()}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 transition-colors font-medium cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
