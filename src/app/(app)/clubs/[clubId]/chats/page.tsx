import { fetchChatsServer } from '@/lib/api/chats.server';
import { redirect } from 'next/navigation';

export default async function ChatsRedirect({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/chat`);
}
