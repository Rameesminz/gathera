import { AuthGuard } from '@/components/common/auth-guard';
import { Header } from '@/components/common/header';
import { ClubNav } from '@/components/club/club-nav';
import { ClubMobileNav } from '@/components/club/club-mobile-nav';
import { ClubRightSidebar } from '@/components/club/club-right-sidebar';
import { fetchClubServer, fetchMembersServer } from '@/lib/api/clubs.server';
import { fetchEventsServer } from '@/lib/api/events.server';
import { notFound } from 'next/navigation';

export async function ClubWorkspaceLayout({
  clubId,
  children,
}: {
  clubId: string;
  children: React.ReactNode;
}) {
  let clubData: Awaited<ReturnType<typeof fetchClubServer>>;
  try {
    clubData = await fetchClubServer(clubId);
  } catch {
    notFound();
  }

  const { club, membership } = clubData;

  let members: Awaited<ReturnType<typeof fetchMembersServer>> = [];
  let upcomingEvents: Awaited<ReturnType<typeof fetchEventsServer>> = [];

  if (membership) {
    try {
      [members, upcomingEvents] = await Promise.all([
        fetchMembersServer(clubId),
        fetchEventsServer(clubId),
      ]);
      upcomingEvents = upcomingEvents
        .filter((e) => e.status === 'scheduled' && new Date(e.start_at) >= new Date())
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
    } catch {
      // sidebar data is optional
    }
  }

  if (!membership) {
    return (
      <AuthGuard>
        <div className="flex min-h-dvh flex-col">
          <Header />
          <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col bg-background">
        <Header />
        <div className="flex min-h-0 flex-1">
          <div className="hidden lg:block">
            <ClubNav clubId={clubId} clubName={club.name} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
            <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-20 md:p-6 lg:pb-6">{children}</main>
            <ClubRightSidebar members={members} upcomingEvents={upcomingEvents} />
          </div>
        </div>
        <ClubMobileNav clubId={clubId} />
      </div>
    </AuthGuard>
  );
}
