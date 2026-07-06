'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { joinByToken, previewInvite } from '@/lib/api/invites';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const [token, setToken] = useState<string | null>(null);
  const [club, setClub] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    previewInvite(token)
      .then(setClub)
      .catch((err) => setError(getApiErrorMessage(err, 'Invalid invite')))
      .finally(() => setLoading(false));
  }, [token]);

  const handleJoin = async () => {
    if (!token) return;
    setJoining(true);
    setError(null);
    try {
      const result = await joinByToken(token);
      router.push(`/clubs/${result.club.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not join club'));
    } finally {
      setJoining(false);
    }
  };

  if (loading || !isInitialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to join</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need an account to accept this invite.
            </p>
            <Link href={`/login?redirect=/join/${token}`}>
              <Button className="w-full">Sign in</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {club?.name ?? 'club'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {club?.description ? (
            <p className="text-sm text-muted-foreground">{club.description}</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" onClick={() => void handleJoin()} disabled={joining}>
            {joining ? 'Joining...' : 'Accept invite'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
