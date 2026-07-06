'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addGalleryItem, uploadFile } from '@/lib/api/club-resources';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Gallery } from '@/types';

export function GalleryCard({ clubId, gallery }: { clubId: string; gallery: Gallery }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const uploaded = await uploadFile(clubId, file);
      await addGalleryItem(clubId, gallery.id, { fileId: uploaded.id });
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to add photo'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{gallery.name}</h3>
          {gallery.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{gallery.description}</p>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="mr-1 h-4 w-4" />
          Add photo
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
