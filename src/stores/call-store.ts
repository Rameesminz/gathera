import { create } from 'zustand';
import type { IncomingCallPayload } from '@/hooks/use-notifications-websocket';

interface CallState {
  incomingCall: IncomingCallPayload | null;
  setIncomingCall: (call: IncomingCallPayload) => void;
  clearIncomingCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  incomingCall: null,
  setIncomingCall: (call) =>
    set((state) => ({
      incomingCall: state.incomingCall ?? call,
    })),
  clearIncomingCall: () => set({ incomingCall: null }),
}));
