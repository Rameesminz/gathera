'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { TOKEN_KEYS, WS_BASE_URL } from '@/lib/constants';
import { fetchWsTicket } from '@/lib/api/ws-ticket';

interface UseWebRTCCallOptions {
  callId: string;
  userId: string;
  enabled?: boolean;
  isInitiator?: boolean;
  withVideo?: boolean;
}

const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

export function useWebRTCCall({
  callId,
  userId,
  enabled = true,
  isInitiator = false,
  withVideo = false,
}: UseWebRTCCallOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  const sendSignal = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const sendOffer = useCallback(
    async (targetUserId?: string) => {
      const pc = pcRef.current;
      if (!pc) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({
        type: 'offer',
        payload: offer,
        ...(targetUserId ? { targetUserId } : {}),
      });
    },
    [sendSignal],
  );

  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal({
          type: 'ice-candidate',
          payload: e.candidate.toJSON(),
          ...(remoteUserIdRef.current ? { targetUserId: remoteUserIdRef.current } : {}),
        });
      }
    };
    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0] ?? null);
    };
    pc.onconnectionstatechange = () => {
      setConnected(pc.connectionState === 'connected');
    };
    pcRef.current = pc;
    return pc;
  }, [sendSignal]);

  const startLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: withVideo,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    const pc = pcRef.current ?? createPeer();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    return stream;
  }, [withVideo, createPeer]);

  useEffect(() => {
    if (!enabled || !callId) return;

    let cancelled = false;
    let ws: WebSocket | null = null;

    void (async () => {
      const token = Cookies.get(TOKEN_KEYS.access);
      if (!token) return;

      const ticket = await fetchWsTicket();
      if (cancelled) return;

      const url = new URL(`${WS_BASE_URL}/calls/${callId}/ws`);
      if (ticket) {
        url.searchParams.set('ticket', ticket);
      } else {
        url.searchParams.set('token', token);
      }

      ws = new WebSocket(url.toString());
      wsRef.current = ws;

      ws.onopen = async () => {
        if (isInitiator) {
          await startLocalMedia();
          return;
        }
        await createPeer();
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data as string) as {
            type: string;
            from?: string;
            userId?: string;
            payload?: RTCSessionDescriptionInit | RTCIceCandidateInit;
          };
          if (data.from === userId) return;

          const pc = pcRef.current ?? createPeer();
          if (!localStreamRef.current) await startLocalMedia();

          if (data.type === 'peer-joined' && data.userId) {
            if (isInitiator) {
              remoteUserIdRef.current = data.userId;
              await sendOffer(data.userId);
            }
            return;
          }

          if (data.type === 'offer' && data.payload) {
            if (data.from) remoteUserIdRef.current = data.from;
            await pc.setRemoteDescription(
              new RTCSessionDescription(data.payload as RTCSessionDescriptionInit),
            );
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal({ type: 'answer', payload: answer, targetUserId: data.from });
          } else if (data.type === 'answer' && data.payload) {
            await pc.setRemoteDescription(
              new RTCSessionDescription(data.payload as RTCSessionDescriptionInit),
            );
          } else if (data.type === 'ice-candidate' && data.payload) {
            await pc.addIceCandidate(new RTCIceCandidate(data.payload as RTCIceCandidateInit));
          }
        } catch {
          // ignore malformed signals
        }
      };

      ws.onclose = () => setConnected(false);
    })();

    return () => {
      cancelled = true;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      wsRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
      setConnected(false);
    };
  }, [callId, userId, enabled, isInitiator, createPeer, sendSignal, sendOffer, startLocalMedia]);

  const toggleMute = () => {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (audio) {
      audio.enabled = !audio.enabled;
      setMuted(!audio.enabled);
    }
  };

  const toggleCamera = () => {
    const video = localStreamRef.current?.getVideoTracks()[0];
    if (video) {
      video.enabled = !video.enabled;
      setCameraOff(!video.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      await startLocalMedia();
      setScreenSharing(false);
      return;
    }
    const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const pc = pcRef.current;
    if (!pc) return;
    if (!pc) return; // Guard against race condition

    const sender = pc?.getSenders().find((s) => s.track?.kind === 'video');
    const track = screen.getVideoTracks()[0];
    if (sender && track) await sender.replaceTrack(track);
    localStreamRef.current = screen;
    setLocalStream(screen);
    setScreenSharing(true);
    track.onended = () => {
      void toggleScreenShare();
    };
  };

  return {
    localStream,
    remoteStream,
    connected,
    muted,
    cameraOff,
    screenSharing,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  };
}
