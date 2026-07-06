import Link from 'next/link';
import { CreateTournamentForm } from '@/components/forms/create-tournament-form';
import { EmptyState } from '@/components/common/empty-state';
import { Badge } from '@/components/ui/badge';
import { fetchClubServer } from '@/lib/api/clubs.server';
import { fetchTournamentsServer } from '@/lib/api/club-resources.server';
import { Trophy } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Tournament' };

export default async function ClubTournamentPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const { membership } = await fetchClubServer(clubId);
  if (!membership) redirect(`/clubs/${clubId}`);

  let tournaments: Awaited<ReturnType<typeof fetchTournamentsServer>> = [];
  try {
    tournaments = await fetchTournamentsServer(clubId);
  } catch {
    tournaments = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <p className="text-muted-foreground">Organize club competitions</p>
      </div>
      <CreateTournamentForm clubId={clubId} />
      {tournaments.length === 0 ? (
        <EmptyState icon={Trophy} title="No tournaments" description="Create your first tournament." />
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/clubs/${clubId}/tournament/${t.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
            >
              <div>
                <h3 className="font-semibold">{t.name}</h3>
                {t.description ? (
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                ) : null}
              </div>
              <Badge variant="muted">{t.status}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
