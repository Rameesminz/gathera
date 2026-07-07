'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { TOKEN_KEYS, WS_BASE_URL } from '@/lib/constants';
import { useChatStore } from '@/stores/chat-store';
import type { ChatWsMessage } from '@/types/messaging';

interface UseChatWebSocketOptions {
  chatId: string;
  userId: string;
  displayName: string;
  enabled?: boolean;
  onMessage?: (message: ChatWsMessage) => void;
}

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000];

export function useChatWebSocket({
  chatId,
  enabled = true,
  onMessage,
}: UseChatWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers);
  const setTyping = useChatStore((s) => s.setTyping);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !chatId) return;

    let closed = false;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;

    function connect() {
      if (closed) return;

      const token = Cookies.get(TOKEN_KEYS.access);
      if (!token) return;

      const url = new URL(`${WS_BASE_URL}/chats/${chatId}/ws`);
      url.searchParams.set('token', token);

      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        attempt = 0;
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as Record<string, unknown>;
          switch (data.type) {
            case 'connected':
            case 'presence':
              setOnlineUsers((data.online as { id: string; displayName: string }[]) ?? []);
              break;
            case 'message':
              if (data.message) onMessageRef.current?.(data.message as ChatWsMessage);
              break;
            case 'typing':
              setTyping(
                {
                  userId: String(data.userId),
                  displayName: String(data.displayName ?? 'Someone'),
                },
                !!data.isTyping,
              );
              break;
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (pingTimer) clearInterval(pingTimer);
        if (closed) return;
        const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
        attempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      closed = true;
      if (pingTimer) clearInterval(pingTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      useChatStore.getState().reset();
    };
  }, [chatId, enabled, setOnlineUsers, setTyping]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content }));
    }
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', isTyping }));
    }
  }, []);

  return { connected, sendMessage, sendTyping };
}
