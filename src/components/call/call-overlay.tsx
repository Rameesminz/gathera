'use client';

import { useEffect, useRef } from 'react';
import { Mic, MicOff, Monitor, PhoneOff, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebRTCCall } from '@/hooks/use-webrtc-call';
import { leaveCall } from '@/lib/api/calls';

interface CallOverlayProps {
  callId: string;
  userId: string;
  isInitiator?: boolean;
  withVideo?: boolean;
  onEnd: () => void;
}

export function CallOverlay({ callId, userId, isInitiator, withVideo, onEnd }: CallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    localStream,
    remoteStream,
    connected,
    muted,
    cameraOff,
    screenSharing,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  } = useWebRTCCall({ callId, userId, isInitiator, withVideo });

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEnd = async () => {
    try {
      await leaveCall(callId);
    } finally {
      onEnd();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95">
      <div className="relative flex-1">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-20 right-4 h-32 w-24 rounded-lg border border-white/20 object-cover md:h-40 md:w-28"
        />
        <p className="absolute left-4 top-4 text-sm text-white/80">
          {connected ? 'Connected' : 'Connecting...'}
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 border-t border-white/10 p-4 safe-bottom">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-white/20 bg-white/10 text-white"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        {withVideo ? (
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-white/20 bg-white/10 text-white"
            onClick={toggleCamera}
            aria-label={cameraOff ? 'Camera on' : 'Camera off'}
          >
            {cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-white/20 bg-white/10 text-white"
          onClick={() => void toggleScreenShare()}
          aria-label="Screen share"
        >
          <Monitor className="h-5 w-5" />
          {screenSharing ? ' (on)' : ''}
        </Button>
        <Button
          size="icon"
          className="rounded-full bg-destructive text-white"
          onClick={() => void handleEnd()}
          aria-label="End call"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
