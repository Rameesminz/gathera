import type { ApiSuccessResponse, Club, ClubMember, ClubMembership } from '@/types';
import { getServerApiClient } from '@/lib/api/server-client';

export async function fetchClubsServer() {
  const api = await getServerApiClient();
  const { data } = await api.get<ApiSuccessResponse<{ clubs: Club[] }>>('/clubs');
  return data.data.clubs;
}

export async function fetchClubServer(clubId: string) {
  const api = await getServerApiClient();
  const { data } = await api.get<
    ApiSuccessResponse<{ club: Club; membership: ClubMembership | null }>
  >(`/clubs/${clubId}`);
  return data.data;
}

export async function fetchMembersServer(clubId: string) {
  const api = await getServerApiClient();
  const { data } = await api.get<ApiSuccessResponse<{ members: ClubMember[] }>>(
    `/clubs/${clubId}/members`,
  );
  return data.data.members;
}
