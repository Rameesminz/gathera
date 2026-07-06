import type { Club, ClubMember, ClubMembership, Event, Notification } from '@/types';

export interface OnlineUser {
  id: string;
  displayName: string;
}

export interface ChatWsMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  metadata: string;
  created_at: string;
}

export interface ClubWorkspaceContext {
  club: Club;
  membership: ClubMembership | null;
  members: ClubMember[];
  upcomingEvents: Event[];
  notifications: Notification[];
  unreadCount: number;
}
