import { api } from '@/lib/api/client';
import type { ApiSuccessResponse } from '@/types';

export async function initiateChatCall(
  chatId: string,
  input: { callType: 'voice' | 'video'; participantIds: string[] },
) {
  const { data } = await api.post<ApiSuccessResponse<{ call: Record<string, unknown>; participants: unknown[] }>>(
    `/calls/chats/${chatId}/calls`,
    input,
  );
  return data.data;
}

export async function initiateCall(
  clubId: string,
  input: { callType: 'voice' | 'video'; participantIds: string[]; chatId?: string },
) {
  const { data } = await api.post<ApiSuccessResponse<{ call: Record<string, unknown>; participants: unknown[] }>>(
    `/calls/clubs/${clubId}/calls`,
    input,
  );
  return data.data;
}

export async function getCall(callId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ call: Record<string, unknown>; participants: unknown[] }>>(
    `/calls/${callId}`,
  );
  return data.data;
}

export async function joinCall(callId: string) {
  const { data } = await api.post<ApiSuccessResponse<{ call: Record<string, unknown>; participants: unknown[] }>>(
    `/calls/${callId}/join`,
  );
  return data.data;
}

export async function leaveCall(callId: string) {
  await api.post(`/calls/${callId}/leave`);
}

export async function declineCall(callId: string) {
  await api.post(`/calls/${callId}/decline`);
}
