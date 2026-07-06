import { cookies } from 'next/headers';
import axios from 'axios';
import { API_BASE_URL, TOKEN_KEYS } from '@/lib/constants';

export async function getServerApiClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEYS.access)?.value;

  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
