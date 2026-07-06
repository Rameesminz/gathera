import type { ApiSuccessResponse, PublicUser } from '@/types';
import { getServerApiClient } from '@/lib/api/server-client';

export async function fetchMeServer() {
  const api = await getServerApiClient();
  const { data } = await api.get<ApiSuccessResponse<{ user: PublicUser }>>('/users/me');
  return data.data.user;
}
