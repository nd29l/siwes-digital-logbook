/**
 * @file src/components/common/Footer.tsx
 * @description Standardized footer presenting system version and institutional compliance.
 */

import React from 'react';
import { Layers } from 'lucide-react';
import { APP_METADATA } from '@/constants';

export const Footer: React.FC = () => {
  return (
    <footer id="app-footer" className="w-full bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span>{APP_METADATA.NAME}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Industrial Training Fund (ITF) Compliance Ready</span>
          <span className="text-slate-300">|</span>
          <span>TypeScript &bull; Supabase &bull; Tailwind CSS</span>
        </div>
      </div>
    </footer>
  );
};
