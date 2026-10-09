/**
 * @file src/pages/public/landing/LandingNavbar.tsx
 * @description Responsive public navigation bar for the unauthenticated landing page.
 *
 * Features:
 * - Sticky, semantic <nav> with in-page anchors (Home, Features, How It Works, About).
 * - Login and Get Started actions routed through the existing string-based route state.
 * - Accessible mobile disclosure menu with Escape-to-close and aria-expanded state.
 */

import React, { useEffect, useState } from 'react';
import { BookOpenCheck, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { APP_METADATA } from '@/constants';
import { RouteId } from '@/types';

interface LandingNavbarProps {
  onNavigate: (route: RouteId) => void;
}

interface LandingNavLink {
  label: string;
  href: string;
}

const LANDING_NAV_LINKS: LandingNavLink[] = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
];

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const handleLogin = () => {
    setIsMenuOpen(false);
    onNavigate('login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200">
      <nav
        aria-label="Primary"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4"
      >
        {/* Brand */}
        <a
          href="#home"
          className="flex items-center gap-3 select-none rounded-lg"
        >
          <span className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
            <BookOpenCheck className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          </span>
          <span className="hidden sm:block leading-tight">
            <span className="block font-semibold text-slate-900 tracking-tight text-base">
              {APP_METADATA.NAME}
            </span>
            <span className="block text-xs text-slate-500">
              Students Industrial Work Experience Scheme
            </span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleLogin}>
            Login
          </Button>
          <Button variant="primary" size="sm" onClick={handleLogin}>
            Get Started
          </Button>
        </div>

        {/* Mobile disclosure trigger */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          {isMenuOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div id="landing-mobile-menu" className="lg:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-4 flex flex-col gap-1">
            {LANDING_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Button variant="outline" size="md" onClick={handleLogin} className="w-full">
                Login
              </Button>
              <Button variant="primary" size="md" onClick={handleLogin} className="w-full">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
