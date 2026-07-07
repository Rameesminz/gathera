import { api } from '@/lib/api/client';
import type { ApiSuccessResponse, Chat, Conversation, Message, PaginatedResult } from '@/types';

export async function fetchConversations() {
  const { data } = await api.get<ApiSuccessResponse<{ conversations: Conversation[] }>>('/chats');
  return data.data.conversations;
}

export async function createDirectChat(participantId: string) {
  const { data } = await api.post<ApiSuccessResponse<{ chat: Chat }>>('/chats', { participantId });
  return data.data.chat;
}

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

export async function fetchChatParticipants(chatId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ participantIds: string[] }>>(
    `/chats/${chatId}/participants`,
  );
  return data.data.participantIds;
}

export async function sendMessage(
  chatId: string,
  content: string,
  messageType: 'text' | 'image' | 'file' = 'text',
  metadata?: Record<string, unknown>,
) {
  const { data } = await api.post<ApiSuccessResponse<{ message: Message }>>(
    `/chats/${chatId}/messages`,
    { content, messageType, metadata },
  );
  return data.data.message;
}

export async function uploadChatFile(chatId: string, file: File) {
  const content = await fileToBase64(file);
  const { data } = await api.post<
    ApiSuccessResponse<{ file: Record<string, unknown>; message: Message }>
  >(`/chats/${chatId}/files`, {
    filename: file.name,
    mimeType: file.type,
    content,
  });
  return data.data;
}

export function getChatFileUrl(chatId: string, fileId: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8788/api/v1';
  return `${base}/chats/${chatId}/files/${fileId}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
