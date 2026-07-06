import { api } from '@/lib/api/client';
import type { ApiSuccessResponse, Club, ClubMember, ClubMembership, RoleName } from '@/types';

export async function fetchClubs() {
  const { data } = await api.get<ApiSuccessResponse<{ clubs: Club[] }>>('/clubs');
  return data.data.clubs;
}

export async function fetchClub(clubId: string) {
  const { data } = await api.get<
    ApiSuccessResponse<{ club: Club; membership: ClubMembership | null }>
  >(`/clubs/${clubId}`);
  return data.data;
}

export async function createClub(input: {
  name: string;
  description?: string;
  logoUrl?: string;
}) {
  const { data } = await api.post<ApiSuccessResponse<{ club: Club }>>('/clubs', input);
  return data.data.club;
}

export async function joinClub(clubId: string) {
  const { data } = await api.post<ApiSuccessResponse<{ membership: ClubMembership }>>(
    `/clubs/${clubId}/join`,
  );
  return data.data.membership;
}

export async function leaveClub(clubId: string) {
  await api.post(`/clubs/${clubId}/leave`);
}

export async function fetchMembers(clubId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ members: ClubMember[] }>>(
    `/clubs/${clubId}/members`,
  );
  return data.data.members;
}

export async function updateMemberRole(clubId: string, userId: string, role: RoleName) {
  const { data } = await api.patch<ApiSuccessResponse<{ membership: ClubMembership }>>(
    `/clubs/${clubId}/members/${userId}`,
    { role },
  );
  return data.data.membership;
}

export async function updateClub(
  clubId: string,
  input: Partial<{ name: string; description: string | null; logoUrl: string | null }>,
) {
  const { data } = await api.patch<ApiSuccessResponse<{ club: Club }>>(
    `/clubs/${clubId}`,
    input,
  );
  return data.data.club;
}

export async function deleteClub(clubId: string) {
  await api.delete(`/clubs/${clubId}`);
}
