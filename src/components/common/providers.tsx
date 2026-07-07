'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useCallStore } from '@/stores/call-store';
import { useNotificationsWebSocket } from '@/hooks/use-notifications-websocket';
import { usePushNotifications } from '@/hooks/use-push-notifications';

function NotificationSocketBridge() {
  const isAuthenticated = useAuthStore((s) => !!s.user);
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);

  useNotificationsWebSocket({
    enabled: isAuthenticated,
    onIncomingCall: setIncomingCall,
  });
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
