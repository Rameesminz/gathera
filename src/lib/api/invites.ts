import { api } from '@/lib/api/client';
import type { ApiSuccessResponse, Club, ClubMembership } from '@/types';

export interface ClubInvite {
  id: string;
  club_id: string;
  code: string;
  token: string;
  created_by: string;
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
  created_at: string;
  inviteUrl?: string;
}

export interface JoinRequest {
  id: string;
  club_id: string;
  user_id: string;
  message: string | null;
  status: string;
  display_name?: string;
  email?: string;
  created_at: string;
}

export async function createInvite(clubId: string, input?: { maxUses?: number; expiresInDays?: number }) {
  const { data } = await api.post<
    ApiSuccessResponse<{ invite: ClubInvite; inviteUrl: string; whatsappUrl: string }>
  >(`/invites/clubs/${clubId}/invites`, input ?? {});
  return data.data;
}

export async function fetchInvites(clubId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ invites: ClubInvite[] }>>(
    `/invites/clubs/${clubId}/invites`,
  );
  return data.data.invites;
}

export async function revokeInvite(clubId: string, inviteId: string) {
  await api.delete(`/invites/clubs/${clubId}/invites/${inviteId}`);
}

export async function joinByCode(code: string) {
  const { data } = await api.post<
    ApiSuccessResponse<{ club: Club; membership: ClubMembership }>
  >('/invites/join/code', { code });
  return data.data;
}

export async function joinByToken(token: string) {
  const { data } = await api.post<
    ApiSuccessResponse<{ club: Club; membership: ClubMembership }>
  >(`/invites/join/token/${token}`);
  return data.data;
}

export async function previewInvite(token: string) {
  const { data } = await api.get<
    ApiSuccessResponse<{ club: { id: string; name: string; description: string | null } }>
  >(`/invites/preview/${token}`);
  return data.data.club;
}

export async function requestJoin(clubId: string, message?: string) {
  const { data } = await api.post<ApiSuccessResponse<{ request: JoinRequest }>>(
    `/invites/clubs/${clubId}/join-request`,
    { message },
  );
  return data.data.request;
}

export async function fetchJoinRequests(clubId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ requests: JoinRequest[] }>>(
    `/invites/clubs/${clubId}/join-requests`,
  );
  return data.data.requests;
}

export async function approveJoinRequest(requestId: string) {
  const { data } = await api.post<ApiSuccessResponse<{ membership: ClubMembership }>>(
    `/invites/join-requests/${requestId}/approve`,
  );
  return data.data.membership;
}

export async function rejectJoinRequest(requestId: string) {
  await api.post(`/invites/join-requests/${requestId}/reject`);
}

export async function fetchClubSettings(clubId: string) {
  const { data } = await api.get<
    ApiSuccessResponse<{ settings: { joinPolicy?: string; visibility?: string } }>
  >(`/clubs/${clubId}/settings`);
  return data.data.settings;
}

export async function updateClubSettings(
  clubId: string,
  settings: { joinPolicy?: 'open' | 'invite_only' | 'approval'; visibility?: 'public' | 'private' },
) {
  const { data } = await api.patch<ApiSuccessResponse<{ club: Club }>>(
    `/clubs/${clubId}/settings`,
    settings,
  );
  return data.data.club;
}
