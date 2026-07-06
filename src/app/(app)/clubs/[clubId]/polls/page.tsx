import { CreatePollForm } from '@/components/forms/create-poll-form';
import { PollCard } from '@/components/polls/poll-card';
import { EmptyState } from '@/components/common/empty-state';
import { fetchMeServer } from '@/lib/api/auth.server';
import { fetchClubServer } from '@/lib/api/clubs.server';
import { fetchPollsServer } from '@/lib/api/polls.server';
import { Vote } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Polls' };

export default async function ClubPollsPage({
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

  let polls: Awaited<ReturnType<typeof fetchPollsServer>> = [];
  try {
    polls = await fetchPollsServer(clubId);
  } catch {
    polls = [];
  }

  const active = polls.filter(
    (p) => !p.closesAt || new Date(p.closesAt) >= new Date(),
  );
  const history = polls.filter(
    (p) => p.closesAt && new Date(p.closesAt) < new Date(),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Polls</h1>
        <p className="text-muted-foreground">Vote and see live results</p>
      </div>

      <CreatePollForm clubId={clubId} />

      {active.length === 0 && history.length === 0 ? (
        <EmptyState icon={Vote} title="No polls yet" description="Create a poll above." />
      ) : (
        <>
          {active.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Active</h2>
              {active.map((poll) => (
                <PollCard key={poll.id} poll={poll} userId={user.id} />
              ))}
            </section>
          ) : null}
          {history.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">History</h2>
              {history.map((poll) => (
                <PollCard key={poll.id} poll={poll} userId={user.id} />
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
