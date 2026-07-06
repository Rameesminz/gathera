'use client';

import { useCallback, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { TOKEN_KEYS, WS_BASE_URL } from '@/lib/constants';
import { useNotificationStore } from '@/stores/notification-store';

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000];

export function useNotificationsWebSocket(enabled = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const pushNotification = useNotificationStore((s) => s.pushNotification);

  const connect = useCallback(() => {
    if (!enabled) return;

    const token = Cookies.get(TOKEN_KEYS.access);
    if (!token) return;

    const url = new URL(`${WS_BASE_URL}/notifications/ws`);
    url.searchParams.set('token', token);

    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempt.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as Record<string, unknown>;
        if (data.type === 'notification') {
          pushNotification({
            id: crypto.randomUUID(),
            user_id: '',
            type: String(data.type ?? 'notification'),
            title: String(data.title ?? 'Notification'),
            body: data.body ? String(data.body) : null,
            data: JSON.stringify(data.data ?? {}),
            read: 0,
            created_at: new Date().toISOString(),
          });
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)];
      reconnectAttempt.current += 1;
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [enabled, pushNotification]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);
}
