'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { rsvpEvent } from '@/lib/api/events';
import { getApiErrorMessage } from '@/lib/api/client';
import { cn, formatDate } from '@/lib/utils';
import type { Event } from '@/types';

const RSVP_OPTIONS = [
  { value: 'going' as const, label: 'Going' },
  { value: 'maybe' as const, label: 'Maybe' },
  { value: 'not_going' as const, label: "Can't go" },
];

export function EventCard({ event, userId }: { event: Event; userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const myRsvp = event.attendees?.find((a) => a.user_id === userId)?.status;

  const handleRsvp = async (status: 'going' | 'maybe' | 'not_going') => {
    setLoading(true);
    try {
      await rsvpEvent(event.id, status);
      router.refresh();
    } catch (err) {
      console.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-semibold">{event.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{formatDate(event.start_at)}</p>
      {event.location ? <p className="text-sm text-muted-foreground">{event.location}</p> : null}
      {event.description ? (
        <p className="mt-3 text-sm text-muted-foreground">{event.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {RSVP_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            size="sm"
            variant={myRsvp === opt.value ? 'primary' : 'outline'}
            disabled={loading}
            onClick={() => handleRsvp(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      {event.attendees && event.attendees.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {event.attendees.filter((a) => a.status === 'going').length} going ·{' '}
          {event.attendees.filter((a) => a.status === 'maybe').length} maybe
        </p>
      ) : null}
    </div>
  );
}

export function EventCalendar({ events }: { events: Event[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventDays = new Set(
    events
      .filter((e) => {
        const d = new Date(e.start_at);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map((e) => new Date(e.start_at).getDate()),
  );

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 font-semibold">
        {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="py-1 font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={cn(
              'flex h-9 items-center justify-center rounded-md text-sm',
              day === now.getDate() ? 'bg-primary text-primary-foreground font-semibold' : '',
              day && eventDays.has(day) ? 'ring-2 ring-primary/40' : '',
            )}
          >
            {day ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}
