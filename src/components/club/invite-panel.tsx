'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createInvite,
  fetchInvites,
  revokeInvite,
} from '@/lib/api/invites';
import { getApiErrorMessage } from '@/lib/api/client';
import type { ClubInvite } from '@/lib/api/invites';

export function InvitePanel({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [invites, setInvites] = useState<ClubInvite[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchInvites(clubId);
      setInvites(data);
      setLoaded(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await createInvite(clubId, { maxUses: 50, expiresInDays: 30 });
      setInvites((prev) => [result.invite, ...prev]);
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create invite'));
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await revokeInvite(clubId, inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!loaded) {
    return (
      <Button variant="outline" size="sm" onClick={() => void load()}>
        Load invites
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Invite links & codes</h3>
        <Button size="sm" onClick={() => void handleCreate()} disabled={loading}>
          <Plus className="mr-1 h-4 w-4" />
          New invite
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {invites.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active invites. Create one to share.</p>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => {
            const url = invite.inviteUrl ?? `${window.location.origin}/join/${invite.token}`;
            const waUrl = `https://wa.me/?text=${encodeURIComponent(`Join my club on Gathera: ${url}`)}`;
            return (
              <div key={invite.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-lg font-bold tracking-widest">{invite.code}</span>
                  <Button variant="ghost" size="icon" onClick={() => void handleRevoke(invite.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Uses: {invite.use_count}
                  {invite.max_uses ? ` / ${invite.max_uses}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void copyText(invite.code, invite.id + '-code')}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    {copied === invite.id + '-code' ? 'Copied!' : 'Copy code'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void copyText(url, invite.id + '-link')}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    {copied === invite.id + '-link' ? 'Copied!' : 'Copy link'}
                  </Button>
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" type="button">
                      <MessageCircle className="mr-1 h-3 w-3" />
                      WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="border-t border-border pt-3">
        <p className="mb-2 text-xs text-muted-foreground">Join with code</p>
        <JoinByCodeInput />
      </div>
    </div>
  );
}

function JoinByCodeInput() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { club } = await import('@/lib/api/invites').then((m) => m.joinByCode(code.trim()));
      router.push(`/clubs/${club.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Enter invite code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="font-mono uppercase"
      />
      <Button onClick={() => void handleJoin()} disabled={loading}>
        Join
      </Button>
      {error ? <p className="w-full text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
