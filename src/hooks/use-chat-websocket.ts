'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { TOKEN_KEYS, WS_BASE_URL } from '@/lib/constants';
import { useChatStore } from '@/stores/chat-store';
import type { ChatWsMessage } from '@/types/club-workspace';

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
  userId,
  displayName,
  enabled = true,
  onMessage,
}: UseChatWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [connected, setConnected] = useState(false);
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers);
  const setTyping = useChatStore((s) => s.setTyping);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!enabled || !chatId) return;

    const token = Cookies.get(TOKEN_KEYS.access);
    if (!token) return;

    const url = new URL(`${WS_BASE_URL}/chats/${chatId}/ws`);
    url.searchParams.set('token', token);

    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectAttempt.current = 0;
      pingInterval.current = setInterval(() => {
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
      if (pingInterval.current) clearInterval(pingInterval.current);
      const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)];
      reconnectAttempt.current += 1;
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [chatId, displayName, enabled, setOnlineUsers, setTyping, userId]);

  useEffect(() => {
    connect();
    return () => {
      if (pingInterval.current) clearInterval(pingInterval.current);
      wsRef.current?.close();
      useChatStore.getState().reset();
    };
  }, [connect]);

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
