import type { ApiSuccessResponse, Conversation } from '@/types';
import { getServerApiClient } from '@/lib/api/server-client';

export async function fetchConversationsServer() {
  const api = await getServerApiClient();
  const { data } = await api.get<ApiSuccessResponse<{ conversations: Conversation[] }>>('/chats');
  return data.data.conversations;
}
