'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { joinClub, leaveClub } from '@/lib/api/clubs';
import { getApiErrorMessage } from '@/lib/api/client';
import type { ClubMembership } from '@/types';

interface ClubMembershipActionsProps {
  clubId: string;
  membership: ClubMembership | null;
  isOwner: boolean;
}

export function ClubMembershipActions({
  clubId,
  membership,
  isOwner,
}: ClubMembershipActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      await joinClub(clubId);
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to join club'));
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this club?')) return;
    setLoading(true);
    setError(null);
    try {
      await leaveClub(clubId);
      router.push('/clubs');
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to leave club'));
    } finally {
      setLoading(false);
    }
  };

  if (membership) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Your role: <strong className="text-foreground">{membership.role_name}</strong>
        </span>
        {!isOwner ? (
          <Button variant="outline" size="sm" isLoading={loading} onClick={handleLeave}>
            Leave club
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Owners cannot leave</span>
        )}
        {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <Button isLoading={loading} onClick={handleJoin}>
        Join club
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
