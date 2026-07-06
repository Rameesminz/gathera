import { create } from 'zustand';
import type { Club, ClubMembership } from '@/types';

interface ClubState {
  clubs: Club[];
  activeClub: Club | null;
  activeMembership: ClubMembership | null;
  isLoading: boolean;
  error: string | null;
  setClubs: (clubs: Club[]) => void;
  setActiveClub: (club: Club | null, membership?: ClubMembership | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useClubStore = create<ClubState>((set) => ({
  clubs: [],
  activeClub: null,
  activeMembership: null,
  isLoading: false,
  error: null,
  setClubs: (clubs) => set({ clubs, error: null }),
  setActiveClub: (activeClub, activeMembership = null) =>
    set({ activeClub, activeMembership, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () =>
    set({ clubs: [], activeClub: null, activeMembership: null, isLoading: false, error: null }),
}));
