import { CreateEventForm } from '@/components/forms/create-event-form';
import { EventCalendar, EventCard } from '@/components/events/event-card';
import { EmptyState } from '@/components/common/empty-state';
import { fetchMeServer } from '@/lib/api/auth.server';
import { fetchClubServer } from '@/lib/api/clubs.server';
import { fetchEventsServer } from '@/lib/api/events.server';
import { Calendar } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Events' };

export default async function ClubEventsPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const [clubData, user] = await Promise.all([
    fetchClubServer(clubId),
    fetchMeServer(),
  ]);

  if (!clubData.membership) redirect(`/clubs/${clubId}`);

  let events: Awaited<ReturnType<typeof fetchEventsServer>> = [];
  try {
    events = await fetchEventsServer(clubId);
  } catch {
    events = [];
  }

  const upcoming = events
    .filter((e) => e.status === 'scheduled' && new Date(e.start_at) >= new Date())
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-muted-foreground">Schedule meetups and track RSVPs</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CreateEventForm clubId={clubId} />
          {upcoming.length === 0 ? (
            <EmptyState icon={Calendar} title="No upcoming events" description="Create one above." />
          ) : (
            <div className="space-y-4">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} userId={user.id} />
              ))}
            </div>
          )}
        </div>
        <EventCalendar events={events} />
      </div>
    </div>
  );
}
