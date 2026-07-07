'use client';

import { Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallButtonsProps {
  participantIds: string[];
  startingCall?: boolean;
  onStartCall: (callType: 'voice' | 'video') => void;
}

export function CallButtons({
  participantIds,
  startingCall = false,
  onStartCall,
}: CallButtonsProps) {
  const disabled = startingCall || participantIds.length === 0;

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Start voice call"
        title="Voice call"
        disabled={disabled}
        onClick={() => onStartCall('voice')}
      >
        <Phone className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Start video call"
        title="Video call"
        disabled={disabled}
        onClick={() => onStartCall('video')}
      >
        <Video className="h-5 w-5" />
      </Button>
    </div>
  );
}
