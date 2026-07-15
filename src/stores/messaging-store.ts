'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message } from '@/types';

export interface PendingMessage {
  clientMessageId: string;
  chatId: string;
  content: string;
  createdAt: string;
}

interface MessagingState {
  lastReadAt: Record<string, string>;
  pendingMessages: PendingMessage[];

  markRead: (chatId: string) => void;
  getUnreadCount: (chatId: string, lastMessageAt: string | null) => number;

  /** Add a message to the offline pending queue. */
  enqueuePending: (msg: PendingMessage) => void;
  /** Remove a pending message once it has been ACK'd or confirmed delivered. */
  dequeuePending: (clientMessageId: string) => void;
  /** Return pending messages for a given chat. */
  getPendingForChat: (chatId: string) => PendingMessage[];
  /** Build an optimistic Message object from a pending entry. */
  buildOptimisticMessage: (pending: PendingMessage, senderId: string) => Message;
}

export const useMessagingStore = create<MessagingState>()(
  persist(
    (set, get) => ({
      lastReadAt: {},
      pendingMessages: [],

      markRead: (chatId) =>
        set((state) => ({
          lastReadAt: { ...state.lastReadAt, [chatId]: new Date().toISOString() },
        })),

      getUnreadCount: (chatId, lastMessageAt) => {
        if (!lastMessageAt) return 0;
        const readAt = get().lastReadAt[chatId];
        if (!readAt) return 1;
        return new Date(lastMessageAt) > new Date(readAt) ? 1 : 0;
      },

      enqueuePending: (msg) =>
        set((state) => ({
          pendingMessages: [
            ...state.pendingMessages.filter((m) => m.clientMessageId !== msg.clientMessageId),
            msg,
          ],
        })),

      dequeuePending: (clientMessageId) =>
        set((state) => ({
          pendingMessages: state.pendingMessages.filter(
            (m) => m.clientMessageId !== clientMessageId,
          ),
        })),

      getPendingForChat: (chatId) =>
        get().pendingMessages.filter((m) => m.chatId === chatId),

      buildOptimisticMessage: (pending, senderId): Message => ({
        id: `pending-${pending.clientMessageId}`,
        chat_id: pending.chatId,
        sender_id: senderId,
        content: pending.content,
        message_type: 'text',
        metadata: '{}',
        client_message_id: pending.clientMessageId,
        ack_status: 'pending',
        created_at: pending.createdAt,
      }),
    }),
    { name: 'gathera-messaging' },
  ),
);
