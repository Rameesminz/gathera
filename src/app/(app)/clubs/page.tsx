import { AppShell } from '@/components/common/app-shell';
import { EmptyState } from '@/components/common/empty-state';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchClubsServer } from '@/lib/api/clubs.server';

export const metadata = { title: 'Clubs' };

export default async function ClubsPage() {
  let clubs: Awaited<ReturnType<typeof fetchClubsServer>> = [];
  try {
    clubs = await fetchClubsServer();
  } catch {
    clubs = [];
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your clubs</h1>
            <p className="text-muted-foreground">Communities you belong to</p>
          </div>
          <Link
            href="/clubs/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            New club
          </Link>
        </div>

        {clubs.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clubs yet"
            description="Create a club to start hosting events, polls, and chats."
            action={
              <Link
                href="/clubs/new"
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Create your first club
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Link key={club.id} href={`/clubs/${club.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{club.name}</CardTitle>
                      <Badge variant="muted">{club.status}</Badge>
                    </div>
                    <CardDescription className="line-clamp-3">
                      {club.description ?? 'No description'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
