import { api } from '@/lib/api/client';
import type { ApiSuccessResponse, Poll } from '@/types';

export async function fetchChatPolls(chatId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ polls: Poll[] }>>(
    `/polls/chats/${chatId}/polls`,
  );
  return data.data.polls;
}

export async function createChatPoll(
  chatId: string,
  input: {
    question: string;
    options: string[];
    multipleChoice?: boolean;
    anonymous?: boolean;
    closesAt?: string;
  },
) {
  const { data } = await api.post<ApiSuccessResponse<{ poll: Poll }>>(
    `/polls/chats/${chatId}/polls`,
    input,
  );
  return data.data.poll;
}

export async function closePoll(pollId: string) {
  const { data } = await api.post<ApiSuccessResponse<{ poll: Poll }>>(`/polls/${pollId}/close`);
  return data.data.poll;
}

export async function fetchPolls(clubId: string) {
  const { data } = await api.get<ApiSuccessResponse<{ polls: Poll[] }>>(
    `/polls/clubs/${clubId}/polls`,
  );
  return data.data.polls;
}

export async function createPoll(
  clubId: string,
  input: {
    question: string;
    options: string[];
    multipleChoice?: boolean;
    anonymous?: boolean;
    closesAt?: string;
  },
) {
  const { data } = await api.post<ApiSuccessResponse<{ poll: Poll }>>(
    `/polls/clubs/${clubId}/polls`,
    input,
  );
  return data.data.poll;
}

export async function votePoll(pollId: string, optionIndexes: number[]) {
  const { data } = await api.post<ApiSuccessResponse<{ poll: Poll }>>(
    `/polls/${pollId}/vote`,
    { optionIndexes },
  );
  return data.data.poll;
}
