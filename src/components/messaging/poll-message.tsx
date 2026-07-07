'use client';

import { useState } from 'react';
import { closePoll, votePoll } from '@/lib/api/polls';
import { getApiErrorMessage } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import type { Poll } from '@/types';

export function PollMessage({ poll, userId, onUpdate }: { poll: Poll; userId: string; onUpdate: (poll: Poll) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closed = poll.closesAt ? new Date(poll.closesAt) < new Date() : false;
  const canClose = poll.createdBy === userId && !closed;

  const handleVote = async (optionIndex: number) => {
    if (closed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const indexes = poll.multipleChoice
        ? poll.userVotes.includes(optionIndex)
          ? poll.userVotes.filter((i) => i !== optionIndex)
          : [...poll.userVotes, optionIndex]
        : [optionIndex];
      if (indexes.length === 0) return;
      const updated = await votePoll(poll.id, indexes);
      onUpdate(updated);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Vote failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!canClose || loading) return;
    setLoading(true);
    try {
      const updated = await closePoll(poll.id);
      onUpdate(updated);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to close poll'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Poll</p>
        <span className="text-xs text-muted-foreground">{poll.totalVotes} votes</span>
      </div>
      <p className="mb-3 font-medium">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const count = poll.voteCounts[index] ?? 0;
          const pct = poll.totalVotes > 0 ? Math.round((count / poll.totalVotes) * 100) : 0;
          const selected = poll.userVotes.includes(index);
          return (
            <button
              key={option}
              type="button"
              disabled={closed || loading}
              onClick={() => void handleVote(index)}
              className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                selected ? 'border-primary bg-accent' : 'border-border hover:bg-muted'
              }`}
            >
              <div className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${pct}%` }} />
              <div className="relative flex justify-between gap-2">
                <span>{option}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {closed ? <p className="mt-2 text-xs text-muted-foreground">Poll closed</p> : null}
      {canClose ? (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void handleClose()} disabled={loading}>
          Close poll
        </Button>
      ) : null}
    </div>
  );
}
