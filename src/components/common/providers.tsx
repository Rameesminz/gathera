'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsWebSocket } from '@/hooks/use-notifications-websocket';
import { usePushNotifications } from '@/hooks/use-push-notifications';

function NotificationSocketBridge() {
  const isAuthenticated = useAuthStore((s) => !!s.user);
  useNotificationsWebSocket(isAuthenticated);
  usePushNotifications();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <NotificationSocketBridge />
      {children}
    </ThemeProvider>
  );
}
