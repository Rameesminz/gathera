'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

const schema = z.object({
  displayName: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.email, data.password, data.displayName);
      router.push('/dashboard');
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Registration failed') });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Join Gathera and start building communities</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Display name" error={errors.displayName?.message}>
            <Input autoComplete="name" placeholder="Jane Doe" {...register('displayName')} />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          </FormField>
          <FormField label="Password" error={errors.password?.message}>
            <Input type="password" autoComplete="new-password" {...register('password')} />
          </FormField>
          {errors.root ? <p className="text-sm text-destructive">{errors.root.message}</p> : null}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
