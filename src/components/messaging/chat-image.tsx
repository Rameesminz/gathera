'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';

export function ChatImage({ chatId, fileId, alt }: { chatId: string; fileId: string; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    void api
      .get(`/chats/${chatId}/files/${fileId}`, { responseType: 'blob' })
      .then((response) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(response.data as Blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [chatId, fileId]);

  if (!src) {
    return <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="max-h-64 w-full object-cover" />;
}
