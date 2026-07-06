'use client';

import { useEffect } from 'react';
import { fetchVapidPublicKey, subscribePush } from '@/lib/api/push';
import { useAuthStore } from '@/stores/auth-store';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    void (async () => {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const publicKey = await fetchVapidPublicKey();
      if (!publicKey) return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await subscribePush(subscription.toJSON());
    })();
  }, [isAuthenticated]);
}
