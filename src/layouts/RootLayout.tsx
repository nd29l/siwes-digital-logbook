/**
 * @file src/layouts/RootLayout.tsx
 * @description Master responsive layout wrapper providing consistent header, main, and footer constraints.
 */

import React from 'react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { RouteId } from '@/types';

interface RootLayoutProps {
  children: React.ReactNode;
  supabaseConfigured?: boolean;
  currentRoute?: RouteId;
  onNavigate?: (route: RouteId) => void;
}

export const RootLayout: React.FC<RootLayoutProps> = ({
  children,
  supabaseConfigured = false,
  currentRoute,
  onNavigate,
}) => {
  return (
    <div id="app-root-layout" className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      <Header
        supabaseConfigured={supabaseConfigured}
        currentRoute={currentRoute}
        onNavigate={onNavigate}
      />
      <main id="app-main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
};
