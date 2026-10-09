/**
 * @file src/pages/public/landing/LandingFooter.tsx
 * @description Public footer for the landing page with project summary, quick links and copyright.
 *
 * Deliberately makes no claims of institutional approval or endorsement by KASU, ITF,
 * or any other body.
 */

import React from 'react';
import { BookOpenCheck } from 'lucide-react';
import { APP_METADATA } from '@/constants';
import { RouteId } from '@/types';

interface LandingFooterProps {
  onNavigate: (route: RouteId) => void;
}

interface FooterLink {
  label: string;
  href?: string;
  route?: RouteId;
}

const FOOTER_LINKS: FooterLink[] = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Login', route: 'login' },
  { label: 'About', href: '#about' },
];

export const LandingFooter: React.FC<LandingFooterProps> = ({ onNavigate }) => {
  const year = new Date().getFullYear();

  return (
    <footer id="landing-footer" className="w-full bg-slate-950 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand & description */}
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <BookOpenCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold text-white tracking-tight">
                {APP_METADATA.NAME}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              A digital logbook for recording industrial training activities, compiling weekly
              reports, and receiving supervisor feedback during your SIWES placement.
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer" className="shrink-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quick Links
            </h2>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  {link.route ? (
                    <button
                      type="button"
                      onClick={() => onNavigate(link.route as RouteId)}
                      className="text-sm text-slate-300 hover:text-white transition-colors cursor-pointer rounded focus-visible:outline-none"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-slate-300 hover:text-white transition-colors rounded"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-9 pt-6 border-t border-white/10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400">
          <p>
            &copy; {year} {APP_METADATA.NAME}. All rights reserved.
          </p>
          <p>React &bull; TypeScript &bull; Supabase &bull; Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
};
