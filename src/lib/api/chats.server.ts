import type { ApiSuccessResponse, Chat } from '@/types';
import { getServerApiClient } from '@/lib/api/server-client';

export async function fetchChatsServer(clubId: string) {
  const api = await getServerApiClient();
  const { data } = await api.get<ApiSuccessResponse<{ chats: Chat[] }>>(
    `/chats/clubs/${clubId}/chats`,
  );
  return data.data.chats;
}
