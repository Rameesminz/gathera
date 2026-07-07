'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IncomingCallHandler } from '@/components/call/incoming-call-handler';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) {
      queueMicrotask(() => setHydrated(true));
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated) void fetchUser();
  }, [hydrated, fetchUser]);

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, isInitialized, router]);

  if (!hydrated || !isInitialized || isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      {user ? <IncomingCallHandler userId={user.id} /> : null}
      {children}
    </>
  );
}
