'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Spinner } from '@/components/ui/spinner';

export default function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setOAuthTokens = useAuthStore((s) => s.setOAuthTokens);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const err = searchParams.get('error');

    if (err) {
      queueMicrotask(() => setError('Google sign-in failed'));
      return;
    }

    if (accessToken && refreshToken) {
      void setOAuthTokens(accessToken, refreshToken)
        .then(() => router.replace('/messages'))
        .catch(() => setError('Failed to complete sign-in'));
    } else {
      queueMicrotask(() => setError('Missing authentication tokens'));
    }
  }, [searchParams, setOAuthTokens, router]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner />
    </div>
  );
}
