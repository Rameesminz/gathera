'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  approveJoinRequest,
  fetchJoinRequests,
  rejectJoinRequest,
  type JoinRequest,
} from '@/lib/api/invites';
import { getApiErrorMessage } from '@/lib/api/client';

export function JoinRequestsPanel({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setRequests(await fetchJoinRequests(clubId));
      setLoaded(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveJoinRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectJoinRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  if (!loaded) {
    return (
      <Button variant="outline" size="sm" onClick={() => void load()}>
        Load join requests
      </Button>
    );
  }

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending join requests.</p>;
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {requests.map((req) => (
        <div
          key={req.id}
          className="flex items-center justify-between rounded-lg border border-border p-3"
        >
          <div>
            <p className="font-medium">{req.display_name}</p>
            <p className="text-xs text-muted-foreground">{req.email}</p>
            {req.message ? <p className="mt-1 text-sm">{req.message}</p> : null}
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="outline" onClick={() => void handleApprove(req.id)}>
              <Check className="h-4 w-4 text-emerald-600" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => void handleReject(req.id)}>
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
