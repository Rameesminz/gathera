import { ClubMembershipActions } from '@/components/common/club-membership-actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchClubServer } from '@/lib/api/clubs.server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  try {
    const { club } = await fetchClubServer(clubId);
    return { title: club.name };
  } catch {
    return { title: 'Club' };
  }
}

export default async function ClubOverviewPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;

  let data: Awaited<ReturnType<typeof fetchClubServer>>;
  try {
    data = await fetchClubServer(clubId);
  } catch {
    notFound();
  }

  const { club, membership } = data;
  const isOwner = club.owner_id === membership?.user_id;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold md:text-3xl">{club.name}</h1>
          <Badge>{club.status}</Badge>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          {club.description ?? 'No description provided.'}
        </p>
        <ClubMembershipActions clubId={clubId} membership={membership} isOwner={!!isOwner} />
      </div>

      {membership ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: `/clubs/${clubId}/chat`, label: 'Chat', desc: 'Message your club' },
            { href: `/clubs/${clubId}/events`, label: 'Events', desc: 'Meetups & RSVPs' },
            { href: `/clubs/${clubId}/polls`, label: 'Polls', desc: 'Vote on decisions' },
            { href: `/clubs/${clubId}/members`, label: 'Members', desc: 'Manage roles' },
            { href: `/clubs/${clubId}/gallery`, label: 'Gallery', desc: 'Photo albums' },
            { href: `/clubs/${clubId}/tournament`, label: 'Tournament', desc: 'Competitions' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
