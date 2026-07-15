'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { exchangeOAuthHandoff } from '@/lib/api/auth';
import { Spinner } from '@/components/ui/spinner';

export default function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setOAuthTokens = useAuthStore((s) => s.setOAuthTokens);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const legacyAccess = searchParams.get('accessToken');
    const legacyRefresh = searchParams.get('refreshToken');
    const err = searchParams.get('error');

    if (err) {
      queueMicrotask(() => setError('Google sign-in failed'));
      return;
    }

    if (code) {
      void exchangeOAuthHandoff(code)
        .then((tokens) => setOAuthTokens(tokens.accessToken, tokens.refreshToken))
        .then(() => router.replace('/messages'))
        .catch(() => setError('Failed to complete sign-in'));
      return;
    }

    // Temporary backward compatibility for in-flight OAuth redirects.
    if (legacyAccess && legacyRefresh) {
      void setOAuthTokens(legacyAccess, legacyRefresh)
        .then(() => router.replace('/messages'))
        .catch(() => setError('Failed to complete sign-in'));
      return;
    }

    queueMicrotask(() => setError('Missing authentication code'));
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
