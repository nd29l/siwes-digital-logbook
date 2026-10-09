/**
 * @file src/components/pwa/OfflineIndicator.tsx
 * @description Accessible real-time offline status indicator and reconnection alert.
 */

import React, { useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi, X } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, showReconnected, dismissReconnected } = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  // If online and not showing the reconnected toast, render nothing
  if (isOnline && !showReconnected) {
    return null;
  }

  // Reconnected Toast
  if (isOnline && showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-3 rounded-2xl bg-emerald-700 text-white shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200 border border-emerald-600"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-800/80 flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold leading-tight">Connection Restored</h4>
            <p className="text-2xs text-emerald-100 truncate">
              You are back online. Server operations are active.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissReconnected}
          className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800/60 transition-colors cursor-pointer"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Offline Warning Banner
  if (!isOnline && !isDismissed) {
    return (
      <div
        role="status"
        aria-live="assertive"
        className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 p-3.5 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 border border-slate-700"
      >
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <WifiOff className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>Offline Mode Active</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </h4>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Dismiss offline banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-2xs text-slate-300 mt-1 leading-relaxed">
            The cached application shell is loaded. Creating logbook entries, submitting weekly reports, and database queries require an active internet connection.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
