'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createDonation, fetchFundOverview } from '@/lib/api/funds';
import { getApiErrorMessage } from '@/lib/api/client';

export function FundsPanel({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof fetchFundOverview>> | null>(null);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFundOverview(clubId).then(setOverview).catch(() => setOverview(null));
  }, [clubId]);

  const handleDonate = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setLoading(true);
    setError(null);
    try {
      await createDonation(clubId, { amount: value, purpose: purpose || undefined });
      setAmount('');
      setPurpose('');
      const updated = await fetchFundOverview(clubId);
      setOverview(updated);
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Club fund</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {overview?.fund?.currency ?? 'USD'} {overview?.fund?.balance?.toFixed(2) ?? '0.00'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Make a donation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
          <Input
            placeholder="Purpose (optional)"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button onClick={() => void handleDonate()} disabled={loading}>
            Donate
          </Button>
        </CardContent>
      </Card>

      {overview?.donations && overview.donations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent donations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {overview.donations.slice(0, 10).map((d) => (
              <div key={String(d.id)} className="flex justify-between border-b border-border py-2">
                <span>{String(d.donor_name)}</span>
                <span className="font-medium">${Number(d.amount).toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
