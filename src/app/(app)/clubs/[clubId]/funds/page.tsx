import { FundsPanel } from '@/components/club/funds-panel';
import { fetchClubServer } from '@/lib/api/clubs.server';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Funds' };

export default async function ClubFundsPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const { membership } = await fetchClubServer(clubId);
  if (!membership) redirect(`/clubs/${clubId}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Club Funds</h1>
        <p className="text-muted-foreground">Donations and fund management</p>
      </div>
      <FundsPanel clubId={clubId} />
    </div>
  );
}
