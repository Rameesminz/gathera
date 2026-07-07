import { MessagingApp } from '@/components/messaging/messaging-app';
import { fetchMeServer } from '@/lib/api/auth.server';
import { fetchConversationsServer } from '@/lib/api/chats.server';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Messages' };

export default async function MessagesPage() {
  let user: Awaited<ReturnType<typeof fetchMeServer>>;
  try {
    user = await fetchMeServer();
  } catch {
    redirect('/login');
  }

  let conversations: Awaited<ReturnType<typeof fetchConversationsServer>> = [];
  try {
    conversations = await fetchConversationsServer();
  } catch {
    conversations = [];
  }

  return (
    <MessagingApp
      userId={user.id}
      displayName={user.display_name}
      avatarUrl={user.avatar_url}
      initialConversations={conversations}
    />
  );
}
