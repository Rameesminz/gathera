import { Suspense } from 'react';
import { LoginForm } from '@/components/forms/login-form';
import { Logo } from '@/components/common/logo';
import { Spinner } from '@/components/ui/spinner';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <Suspense fallback={<Spinner />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
