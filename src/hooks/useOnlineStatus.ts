/**
 * @file src/hooks/useOnlineStatus.ts
 * @description Hook that subscribes to browser online and offline connectivity events.
 */

import { useEffect, useState, useRef } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const hadOfflineRef = useRef<boolean>(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleOnline = () => {
      setIsOnline(true);
      if (hadOfflineRef.current) {
        setShowReconnected(true);
        timer = setTimeout(() => {
          setShowReconnected(false);
          hadOfflineRef.current = false;
        }, 4000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      hadOfflineRef.current = true;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, showReconnected, dismissReconnected: () => setShowReconnected(false) };
}
