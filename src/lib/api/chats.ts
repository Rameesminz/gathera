import { api } from '@/lib/api/client';
import type { ApiSuccessResponse, Chat, Message, PaginatedResult } from '@/types';

export async function fetchChats(clubId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ chats: Chat[] }>>(
    `/chats/clubs/${clubId}/chats`,
  );
  return data.data.chats;
}

export async function createChat(
  clubId: string,
  input: { type: 'group' | 'direct'; name?: string; participantIds: string[] },
) {
  const { data } = await api.post<ApiSuccessResponse<{ chat: Chat }>>(
    `/chats/clubs/${clubId}/chats`,
    input,
  );
  return data.data.chat;
}

export async function fetchMessages(chatId: string, page = 1, limit = 30) {
  const { data } = await api.get<ApiSuccessResponse<PaginatedResult<Message>>>(
    `/chats/${chatId}/messages`,
    { params: { page, limit } },
  );
  return data.data;
}

export async function sendMessage(chatId: string, content: string) {
  const { data } = await api.post<ApiSuccessResponse<{ message: Message }>>(
    `/chats/${chatId}/messages`,
    { content, messageType: 'text' },
  );
  return data.data.message;
}
