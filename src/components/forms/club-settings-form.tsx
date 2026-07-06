'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateClub } from '@/lib/api/clubs';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Club } from '@/types';

export function ClubSettingsForm({ club }: { club: Club }) {
  const router = useRouter();
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await updateClub(club.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update club'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Club name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">Club updated.</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  );
}
