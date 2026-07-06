import { AppShell } from '@/components/common/app-shell';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchMeServer } from '@/lib/api/auth.server';
import { formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  let user: Awaited<ReturnType<typeof fetchMeServer>>;
  try {
    user = await fetchMeServer();
  } catch {
    redirect('/login');
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Your Gathera account</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar name={user.display_name} src={user.avatar_url} size="lg" />
            <div>
              <CardTitle>{user.display_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <span className="text-sm text-muted-foreground">Email verified</span>
              <Badge variant={user.email_verified ? 'success' : 'warning'}>
                {user.email_verified ? 'Verified' : 'Pending'}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <span className="text-sm text-muted-foreground">Member since</span>
              <span className="text-sm font-medium">{formatDate(user.created_at)}</span>
            </div>
            {user.bio ? (
              <div className="rounded-lg border border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">Bio</p>
                <p className="mt-1">{user.bio}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
