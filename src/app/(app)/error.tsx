'use client';

import { useEffect } from 'react';
import { ErrorMessage } from '@/components/common/error-message';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <ErrorMessage
        title="Page error"
        message={error.message || 'Failed to load this page.'}
        onRetry={reset}
      />
    </div>
  );
}
