'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MessagingState {
  lastReadAt: Record<string, string>;
  markRead: (chatId: string) => void;
  getUnreadCount: (chatId: string, lastMessageAt: string | null) => number;
}

export const useMessagingStore = create<MessagingState>()(
  persist(
    (set, get) => ({
      lastReadAt: {},
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
    }),
    { name: 'gathera-messaging' },
  ),
);
