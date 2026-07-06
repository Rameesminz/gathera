import { TournamentDetail } from '@/components/tournament/tournament-detail';
import { fetchClubServer } from '@/lib/api/clubs.server';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Tournament' };

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ clubId: string; tournamentId: string }>;
}) {
  const { clubId, tournamentId } = await params;
  const { membership } = await fetchClubServer(clubId);
  if (!membership) redirect(`/clubs/${clubId}`);

  return <TournamentDetail tournamentId={tournamentId} />;
}
