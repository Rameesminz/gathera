'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/api/club-resources';
import { getApiErrorMessage } from '@/lib/api/client';
import type { ClubFile } from '@/types';

export function FileListItem({ clubId, file }: { clubId: string; file: ClubFile }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      await downloadFile(clubId, file.id, file.filename);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Download failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="font-medium">{file.filename}</p>
        <p className="text-xs text-muted-foreground">
          {file.mime_type ?? 'unknown'} ·{' '}
          {file.size_bytes ? `${Math.round(file.size_bytes / 1024)} KB` : '—'}
        </p>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <Button variant="outline" size="sm" disabled={loading} onClick={() => void handleDownload()}>
        <Download className="mr-1 h-4 w-4" />
        Download
      </Button>
    </div>
  );
}
