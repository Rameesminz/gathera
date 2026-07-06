'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createGallery } from '@/lib/api/club-resources';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Gallery } from '@/types';

export function CreateGalleryForm({
  clubId,
  onCreated,
}: {
  clubId: string;
  onCreated?: (g: Gallery) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const gallery = await createGallery(clubId, { name, description: description || undefined });
      onCreated?.(gallery);
      setName('');
      setDescription('');
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <Input placeholder="Gallery name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" isLoading={loading}>
        Create gallery
      </Button>
    </form>
  );
}
