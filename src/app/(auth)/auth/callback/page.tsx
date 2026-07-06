import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';
import AuthCallbackClient from './callback-client';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
