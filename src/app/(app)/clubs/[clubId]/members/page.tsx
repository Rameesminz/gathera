import { MembersList } from '@/components/common/members-list';
import { ErrorMessage } from '@/components/common/error-message';
import { fetchMeServer } from '@/lib/api/auth.server';
import { fetchClubServer, fetchMembersServer } from '@/lib/api/clubs.server';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Members' };

export default async function ClubMembersPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const [clubData, user] = await Promise.all([
    fetchClubServer(clubId),
    fetchMeServer(),
  ]);

  if (!clubData.membership) redirect(`/clubs/${clubId}`);

  let members: Awaited<ReturnType<typeof fetchMembersServer>>;
  try {
    members = await fetchMembersServer(clubId);
  } catch {
    return <ErrorMessage message="Could not load members." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-muted-foreground">
          {clubData.club.name} · {members.length} members
        </p>
      </div>
      <MembersList
        clubId={clubId}
        members={members}
        currentUserId={user.id}
        currentUserRole={clubData.membership.role_name}
        ownerId={clubData.club.owner_id}
      />
    </div>
  );
}
