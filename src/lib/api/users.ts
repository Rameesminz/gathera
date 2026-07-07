import { api } from '@/lib/api/client';
import type { ApiSuccessResponse, PublicUser } from '@/types';

export async function searchUsers(query: string, limit = 10) {
  const { data } = await api.get<ApiSuccessResponse<{ users: PublicUser[] }>>('/users/search', {
    params: { query, limit },
  });
  return data.data.users;
}

export async function updateProfile(input: {
  displayName?: string;
  bio?: string | null;
  mobileNumber?: string | null;
}) {
  const { data } = await api.patch<ApiSuccessResponse<{ user: PublicUser }>>('/users/me', input);
  return data.data.user;
}
