/**
 * @file src/components/pwa/PWAInstallButton.tsx
 * @description In-app PWA install trigger button supporting Chromium and iOS Safari.
 */

import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running inside an installed standalone PWA, suppress the install prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      await install();
      setIsInstalling(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If not installable and not iOS, render nothing
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <Button
        id="pwa-install-btn"
        type="button"
        variant={variant}
        size={size}
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-1.5 transition-all text-xs font-semibold ${className}`}
        title="Install SIWES Digital Logbook on your device"
        aria-label="Install SIWES Digital Logbook on your device"
      >
        <Download className="w-3.5 h-3.5 text-purple-600" />
        <span>Install App</span>
      </Button>

      {/* iOS Safari Home Screen Installation Modal */}
      {showIOSGuide && (
        <Modal
          isOpen={showIOSGuide}
          onClose={() => setShowIOSGuide(false)}
          title="Install on iPhone / iPad"
          description="Add SIWES Digital Logbook to your iOS Home Screen for a fullscreen, offline-ready app experience."
          size="sm"
          id="pwa-ios-install-modal"
          footer={
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setShowIOSGuide(false)}
              className="w-full bg-slate-900 text-white"
            >
              Got it
            </Button>
          }
        >
          <div className="space-y-4 py-1 text-xs text-slate-700">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Tap Share in Safari</span>
                  <p className="text-slate-500 mt-0.5 leading-relaxed flex items-center gap-1">
                    Tap the <Share2 className="w-3.5 h-3.5 inline text-sky-600" /> <strong>Share</strong> icon in the bottom Safari toolbar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200/70">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Add to Home Screen</span>
                  <p className="text-slate-500 mt-0.5 leading-relaxed flex items-center gap-1">
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-purple-600" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-2xs leading-relaxed">
              Once added, the SIWES Logbook will open directly from your Home Screen with standalone navigation and instant cached loading.
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
