'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    const register = () => {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' });
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(register);
    } else {
      setTimeout(register, 2000);
    }
  }, []);

  return null;
}
