'use client';

import { useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { TOKEN_KEYS, WS_BASE_URL } from '@/lib/constants';
import { fetchWsTicket } from '@/lib/api/ws-ticket';
import { useNotificationStore } from '@/stores/notification-store';

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000];

export interface IncomingCallPayload {
  callId: string;
  callType: 'voice' | 'video';
  clubId?: string;
  title?: string;
}

interface UseNotificationsWebSocketOptions {
  enabled?: boolean;
  onIncomingCall?: (call: IncomingCallPayload) => void;
}

export function useNotificationsWebSocket({
  enabled = true,
  onIncomingCall,
}: UseNotificationsWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const onIncomingCallRef = useRef(onIncomingCall);
  const pushNotification = useNotificationStore((s) => s.pushNotification);

  useEffect(() => {
    onIncomingCallRef.current = onIncomingCall;
  }, [onIncomingCall]);

  useEffect(() => {
    if (!enabled) return;

    let closed = false;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    async function connect() {
      if (closed) return;

      const token = Cookies.get(TOKEN_KEYS.access);
      if (!token) return;

      const ticket = await fetchWsTicket();
      if (closed) return;

      const url = new URL(`${WS_BASE_URL}/notifications/ws`);
      if (ticket) {
        url.searchParams.set('ticket', ticket);
      } else {
        url.searchParams.set('token', token);
      }

      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as {
            type?: string;
            title?: string;
            body?: string;
            data?: { callId?: string; callType?: string; clubId?: string; type?: string };
          };

          if (data.type !== 'notification') return;

          const payload = data.data;
          if (payload?.callId) {
            onIncomingCallRef.current?.({
              callId: payload.callId,
              callType: payload.callType === 'video' ? 'video' : 'voice',
              clubId: payload.clubId,
              title: data.title,
            });
            return;
          }

          pushNotification({
            id: crypto.randomUUID(),
            user_id: '',
            type: payload?.type ?? 'notification',
            title: String(data.title ?? 'Notification'),
            body: data.body ? String(data.body) : null,
            data: JSON.stringify(payload ?? {}),
            read: 0,
            created_at: new Date().toISOString(),
          });
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (closed) return;
        const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
        attempt += 1;
        reconnectTimer = setTimeout(() => {
          void connect();
        }, delay);
      };

      ws.onerror = () => ws.close();
    }

    void connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [enabled, pushNotification]);
}
