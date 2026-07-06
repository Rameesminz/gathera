'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { TOKEN_KEYS, WS_BASE_URL } from '@/lib/constants';

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

  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal({ type: 'ice-candidate', payload: e.candidate.toJSON() });
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
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: withVideo,
    });
    localStreamRef.current = stream;
    const pc = pcRef.current ?? createPeer();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    return stream;
  }, [withVideo, createPeer]);

  useEffect(() => {
    if (!enabled || !callId) return;

    const token = Cookies.get(TOKEN_KEYS.access);
    if (!token) return;

    const url = new URL(`${WS_BASE_URL}/calls/${callId}/ws`);
    url.searchParams.set('token', token);

    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = async () => {
      await startLocalMedia();
      if (isInitiator && pcRef.current) {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        sendSignal({ type: 'offer', payload: offer });
      }
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type: string;
          from?: string;
          payload?: RTCSessionDescriptionInit | RTCIceCandidateInit;
        };
        if (data.from === userId) return;
        const pc = pcRef.current ?? createPeer();
        if (!localStreamRef.current) await startLocalMedia();

        if (data.type === 'offer' && data.payload) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.payload as RTCSessionDescriptionInit));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({ type: 'answer', payload: answer, targetUserId: data.from });
        } else if (data.type === 'answer' && data.payload) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.payload as RTCSessionDescriptionInit));
        } else if (data.type === 'ice-candidate' && data.payload) {
          await pc.addIceCandidate(new RTCIceCandidate(data.payload as RTCIceCandidateInit));
        }
      } catch {
        // ignore malformed signals
      }
    };

    ws.onclose = () => setConnected(false);

    return () => {
      ws.close();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [callId, userId, enabled, isInitiator, createPeer, sendSignal, startLocalMedia]);

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
    const sender = pc?.getSenders().find((s) => s.track?.kind === 'video');
    const track = screen.getVideoTracks()[0];
    if (sender && track) await sender.replaceTrack(track);
    localStreamRef.current = screen;
    setScreenSharing(true);
    track.onended = () => void toggleScreenShare();
  };

  return {
    localStream: localStreamRef.current,
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
