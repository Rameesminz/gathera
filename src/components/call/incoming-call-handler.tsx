'use client';

import { useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { CallOverlay } from '@/components/call/call-overlay';
import { Button } from '@/components/ui/button';
import { declineCall, joinCall } from '@/lib/api/calls';
import { useCallStore } from '@/stores/call-store';

interface ActiveCallState {
  callId: string;
  withVideo: boolean;
  isInitiator: boolean;
}

export function IncomingCallHandler({ userId }: { userId: string }) {
  const incoming = useCallStore((s) => s.incomingCall);
  const clearIncomingCall = useCallStore((s) => s.clearIncomingCall);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [responding, setResponding] = useState(false);

  const handleAccept = async () => {
    if (!incoming || responding) return;
    setResponding(true);
    try {
      await joinCall(incoming.callId);
      setActiveCall({
        callId: incoming.callId,
        withVideo: incoming.callType === 'video',
        isInitiator: false,
      });
      clearIncomingCall();
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    if (!incoming || responding) return;
    setResponding(true);
    try {
      await declineCall(incoming.callId);
      clearIncomingCall();
    } finally {
      setResponding(false);
    }
  };

  if (activeCall) {
    return (
      <CallOverlay
        callId={activeCall.callId}
        userId={userId}
        isInitiator={activeCall.isInitiator}
        withVideo={activeCall.withVideo}
        onEnd={() => setActiveCall(null)}
      />
    );
  }

  if (!incoming) return null;

  const isVideo = incoming.callType === 'video';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          {isVideo ? <Video className="h-6 w-6 text-primary" /> : <Phone className="h-6 w-6 text-primary" />}
          <div>
            <p className="font-semibold">{incoming.title ?? `Incoming ${incoming.callType} call`}</p>
            <p className="text-sm text-muted-foreground">Someone is calling you</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => void handleAccept()}
            isLoading={responding}
            disabled={responding}
          >
            Accept
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => void handleDecline()}
            disabled={responding}
          >
            <PhoneOff className="h-4 w-4" />
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
