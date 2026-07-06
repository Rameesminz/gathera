import { ChatPanel } from '@/components/chat/chat-panel';
import { fetchMeServer } from '@/lib/api/auth.server';
import { fetchChatsServer } from '@/lib/api/chats.server';
import { fetchClubServer, fetchMembersServer } from '@/lib/api/clubs.server';
import { parseClubSettings } from '@/lib/club-settings';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Chat' };

export default async function ClubChatPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const [{ club, membership }, user] = await Promise.all([
    fetchClubServer(clubId),
    fetchMeServer(),
  ]);

  if (!membership) redirect(`/clubs/${clubId}`);

  let chats: Awaited<ReturnType<typeof fetchChatsServer>> = [];
  let members: Awaited<ReturnType<typeof fetchMembersServer>> = [];
  try {
    [chats, members] = await Promise.all([
      fetchChatsServer(clubId),
      fetchMembersServer(clubId),
    ]);
  } catch {
    chats = [];
    members = [];
  }

  return (
    <ChatPanel
      clubId={clubId}
      userId={user.id}
      displayName={user.display_name}
      initialChats={chats}
      members={members}
      clubSettings={parseClubSettings(club.settings)}
    />
  );
}
