'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFile } from '@/lib/api/club-resources';
import { getApiErrorMessage } from '@/lib/api/client';

export function FileUploadForm({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      await uploadFile(clubId, file);
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
      <p className="mb-3 text-sm text-muted-foreground">Upload files to club storage</p>
      <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
        {loading ? 'Uploading...' : 'Choose file'}
        <input type="file" className="hidden" onChange={handleChange} disabled={loading} />
      </label>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
