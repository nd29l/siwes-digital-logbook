/**
 * @file src/components/pwa/PWAReloadPrompt.tsx
 * @description Accessible prompt notifying users when a new version of the SIWES Logbook is available.
 */

import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const PWAReloadPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Periodically check for updates (every hour)
        setInterval(() => {
          r.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] Service Worker registration failed:', error);
    },
  });

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 right-4 sm:right-6 sm:w-96 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-purple-500/40 animate-in slide-in-from-bottom-5 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/30">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-white">Application Update Ready</h4>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Dismiss update notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-2xs text-slate-300 mt-1 leading-relaxed">
            A new version of the SIWES Digital Logbook is ready. Reload when you are ready to apply updates.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => updateServiceWorker(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs py-1 px-3"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reload Now</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNeedRefresh(false)}
              className="text-slate-300 hover:text-white text-xs py-1 px-2.5"
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
