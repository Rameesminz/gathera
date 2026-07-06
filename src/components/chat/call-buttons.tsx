'use client';

import { Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Chat, ClubMember } from '@/types';

interface CallButtonsProps {
  selectedChat: Chat;
  userId: string;
  members: ClubMember[];
  enableCall?: boolean;
  startingCall?: boolean;
  onStartCall: (callType: 'voice' | 'video') => void;
}

export function getCallParticipantIds(
  selectedChat: Chat,
  members: ClubMember[],
  userId: string,
): string[] {
  const activeMembers = members.filter((m) => m.user_id !== userId && m.status === 'active');

  if (selectedChat.type === 'direct') {
    return activeMembers.slice(0, 1).map((m) => m.user_id);
  }

  return activeMembers.map((m) => m.user_id);
}

export function CallButtons({
  selectedChat,
  userId,
  members,
  enableCall = true,
  startingCall = false,
  onStartCall,
}: CallButtonsProps) {
  if (!enableCall) return null;

  const participantIds = getCallParticipantIds(selectedChat, members, userId);

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Start voice call"
        title="Voice call"
        disabled={startingCall || participantIds.length === 0}
        onClick={() => onStartCall('voice')}
      >
        <Phone className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Start video call"
        title="Video call"
        disabled={startingCall || participantIds.length === 0}
        onClick={() => onStartCall('video')}
      >
        <Video className="h-4 w-4" />
      </Button>
    </div>
  );
}
