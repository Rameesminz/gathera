import { AppShell } from '@/components/common/app-shell';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchClubsServer } from '@/lib/api/clubs.server';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  let clubs: Awaited<ReturnType<typeof fetchClubsServer>> = [];
  try {
    clubs = await fetchClubsServer();
  } catch {
    clubs = [];
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Welcome back to Gathera</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Your clubs</CardDescription>
              <CardTitle className="text-3xl">{clubs.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Quick action</CardDescription>
              <CardTitle className="text-lg">
                <Link href="/clubs/new" className="inline-flex items-center gap-2 text-primary hover:underline">
                  <Plus className="h-4 w-4" /> Create a club
                </Link>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent clubs</h2>
          {clubs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No clubs yet. Create your first one!</p>
                <Link
                  href="/clubs/new"
                  className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  Create club
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {clubs.slice(0, 4).map((club) => (
                <Link key={club.id} href={`/clubs/${club.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle>{club.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {club.description ?? 'No description'}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
