'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { updateClubSettings } from '@/lib/api/invites';
import { getApiErrorMessage } from '@/lib/api/client';

export function ClubJoinPolicyForm({
  clubId,
  initial,
}: {
  clubId: string;
  initial: { joinPolicy?: string; visibility?: string };
}) {
  const router = useRouter();
  const [joinPolicy, setJoinPolicy] = useState(initial.joinPolicy ?? 'open');
  const [visibility, setVisibility] = useState(initial.visibility ?? 'public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateClubSettings(clubId, {
        joinPolicy: joinPolicy as 'open' | 'invite_only' | 'approval',
        visibility: visibility as 'public' | 'private',
      });
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Join policy</label>
        <select
          className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
          value={joinPolicy}
          onChange={(e) => setJoinPolicy(e.target.value)}
        >
          <option value="open">Open — anyone can join</option>
          <option value="invite_only">Invite only — code or link required</option>
          <option value="approval">Approval — admin must approve</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Visibility</label>
        <select
          className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button onClick={() => void handleSave()} disabled={loading}>
        Save join settings
      </Button>
    </div>
  );
}
