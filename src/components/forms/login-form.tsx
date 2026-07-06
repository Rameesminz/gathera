'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getGoogleAuthUrl } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const err = searchParams.get('error');
    if (!err) return;
    const messages: Record<string, string> = {
      oauth_failed: 'Google sign-in failed. Please try again.',
      oauth_not_configured: 'Google sign-in is not configured on this server.',
      oauth_state_mismatch: 'Google sign-in session expired. Please try again.',
    };
    setError('root', { message: messages[err] ?? 'Sign-in failed' });
  }, [searchParams, setError]);

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Login failed') });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your Gathera account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          </FormField>
          <FormField label="Password" error={errors.password?.message}>
            <Input type="password" autoComplete="current-password" {...register('password')} />
          </FormField>
          {errors.root ? <p className="text-sm text-destructive">{errors.root.message}</p> : null}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign in
          </Button>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <a href={getGoogleAuthUrl()} className="block">
            <Button type="button" variant="outline" className="w-full">
              Continue with Google
            </Button>
          </a>
          <p className="text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
