import { api } from '@/lib/api/client';
import type { ApiSuccessResponse } from '@/types';

type TournamentDetail = {
  tournament: Record<string, unknown>;
  teams: Array<Record<string, unknown>>;
  matches: Array<Record<string, unknown>>;
  leaderboard: Array<Record<string, unknown>>;
};

export async function fetchTournament(tournamentId: string) {
  const { data } = await api.get<ApiSuccessResponse<TournamentDetail>>(`/tournaments/${tournamentId}`);
  return data.data;
}

export async function addTeam(tournamentId: string, name: string) {
  const { data } = await api.post<ApiSuccessResponse<{ team: Record<string, unknown> }>>(
    `/tournaments/${tournamentId}/teams`,
    { name },
  );
  return data.data.team;
}

export async function generateFixtures(tournamentId: string) {
  const { data } = await api.post<ApiSuccessResponse<TournamentDetail>>(
    `/tournaments/${tournamentId}/fixtures`,
  );
  return data.data;
}

export async function recordMatchScore(
  matchId: string,
  input: { winnerId: string; score?: Record<string, unknown> },
) {
  const { data } = await api.patch<ApiSuccessResponse<TournamentDetail>>(
    `/tournaments/matches/${matchId}/score`,
    input,
  );
  return data.data;
}
