'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { votePoll } from '@/lib/api/polls';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Poll } from '@/types';

export function PollCard({ poll, userId }: { poll: Poll; userId: string }) {
  const router = useRouter();
  const [localPoll, setLocalPoll] = useState(poll);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasVoted = localPoll.userVotes.length > 0;
  const closed = localPoll.closesAt ? new Date(localPoll.closesAt) < new Date() : false;

  const handleVote = async (optionIndex: number) => {
    if (closed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const indexes = localPoll.multipleChoice
        ? localPoll.userVotes.includes(optionIndex)
          ? localPoll.userVotes.filter((i) => i !== optionIndex)
          : [...localPoll.userVotes, optionIndex]
        : [optionIndex];
      if (indexes.length === 0) return;
      const updated = await votePoll(localPoll.id, indexes);
      setLocalPoll(updated);
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Vote failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="font-semibold">{localPoll.question}</h3>
        <span className="shrink-0 text-xs text-muted-foreground">{localPoll.totalVotes} votes</span>
      </div>
      <div className="space-y-2">
        {localPoll.options.map((option, index) => {
          const count = localPoll.voteCounts[index] ?? 0;
          const pct = localPoll.totalVotes > 0 ? Math.round((count / localPoll.totalVotes) * 100) : 0;
          const selected = localPoll.userVotes.includes(index);
          return (
            <button
              key={option}
              type="button"
              disabled={closed || loading}
              onClick={() => handleVote(index)}
              className={`relative w-full overflow-hidden rounded-lg border px-4 py-3 text-left transition-colors ${
                selected ? 'border-primary bg-accent' : 'border-border hover:bg-muted'
              } ${closed ? 'cursor-default opacity-80' : ''}`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary/15 transition-all"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex justify-between text-sm">
                <span>{option}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {closed ? <p className="mt-2 text-xs text-muted-foreground">Poll closed</p> : null}
      {hasVoted && !closed ? (
        <p className="mt-2 text-xs text-muted-foreground">Tap options to change your vote</p>
      ) : null}
    </div>
  );
}
