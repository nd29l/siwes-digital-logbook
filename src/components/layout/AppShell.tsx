/**
 * @file src/components/layout/AppShell.tsx
 * @description Master authenticated application layout shell.
 * Integrates persistent desktop sidebar, sliding mobile drawer, accessible top bar, and content viewport.
 */

import React, { useState } from 'react';
import { RouteId } from '@/types';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { TopBar } from './TopBar';

interface AppShellProps {
  currentRoute: RouteId;
  onNavigate: (routeId: RouteId) => void;
  supabaseConfigured: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  onNavigate,
  supabaseConfigured,
  children,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div id="authenticated-app-shell" className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Desktop Persistent Sidebar */}
      <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        currentRoute={currentRoute}
        onNavigate={onNavigate}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Authenticated Top Bar */}
        <TopBar
          currentRoute={currentRoute}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          supabaseConfigured={supabaseConfigured}
          onNavigate={onNavigate}
        />

        {/* Dynamic Page Content Viewport */}
        <main
          id="app-page-viewport"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8"
        >
          <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
