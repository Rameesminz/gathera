import { create } from 'zustand';
import type { OnlineUser } from '@/types/club-workspace';

interface TypingUser {
  userId: string;
  displayName: string;
}

interface ChatState {
  onlineUsers: OnlineUser[];
  typingUsers: TypingUser[];
  setOnlineUsers: (users: OnlineUser[]) => void;
  setTyping: (user: TypingUser, isTyping: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  onlineUsers: [],
  typingUsers: [],
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setTyping: (user, isTyping) =>
    set((state) => {
      const filtered = state.typingUsers.filter((u) => u.userId !== user.userId);
      return {
        typingUsers: isTyping ? [...filtered, user] : filtered,
      };
    }),
  reset: () => set({ onlineUsers: [], typingUsers: [] }),
}));
