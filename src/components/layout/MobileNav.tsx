/**
 * @file src/components/layout/MobileNav.tsx
 * @description Slide-over responsive navigation drawer for mobile and tablet screens.
 * Accessible dialog semantics, role-separated navigation items, and backdrop closing.
 */

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks';
import { getNavSectionsForRole } from '@/constants';
import { RouteId, NavItem } from '@/types';
import { BookOpenCheck, X, LogOut, User, Shield, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PWAInstallButton } from '@/components/pwa';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute: RouteId;
  onNavigate: (routeId: RouteId) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  currentRoute,
  onNavigate,
}) => {
  const { user, profile, role, signOut } = useAuth();
  const navSections = getNavSectionsForRole(role);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="mobile-nav-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 lg:hidden flex"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        id="mobile-nav-panel"
        className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200"
      >
        {/* Header with Close Button */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <BookOpenCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-bold text-slate-900 text-sm">SIWES Logbook</span>
          </div>
          <button
            id="mobile-nav-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav
          id="mobile-nav-items"
          aria-label="Mobile Menu"
          className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
        >
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </h3>
              <div className="space-y-1 pt-1">
                {section.items.map((item: NavItem) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium transition-all group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 ${
                        isActive
                          ? role === 'admin'
                            ? 'bg-purple-900 text-white shadow-xs'
                            : 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? role === 'admin'
                                ? 'text-purple-300'
                                : 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-800">
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Mobile User Profile & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <PWAInstallButton className="w-full justify-center bg-white border-slate-300 text-slate-800 hover:bg-slate-100" />

          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
              }`}
            >
              {role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
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

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <Badge
              variant={role === 'admin' ? 'purple' : 'info'}
              size="sm"
              className="text-[10px] uppercase font-mono"
            >
              {role}
            </Badge>

            <button
              id="mobile-nav-logout-btn"
              type="button"
              onClick={() => {
                onClose();
                signOut();
              }}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium py-1 px-2 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
