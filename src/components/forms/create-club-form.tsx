'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClub } from '@/lib/api/clubs';
import { getApiErrorMessage } from '@/lib/api/client';

const schema = z.object({
  name: z.string().min(1, 'Club name is required').max(100),
  description: z.string().max(2000).optional(),
});

type FormData = z.infer<typeof schema>;

export function CreateClubForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const club = await createClub(data);
      router.push(`/clubs/${club.id}`);
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Failed to create club') });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Club details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name" error={errors.name?.message}>
            <Input placeholder="Photography Club" {...register('name')} />
          </FormField>
          <FormField label="Description" error={errors.description?.message}>
            <Textarea placeholder="What is this club about?" {...register('description')} />
          </FormField>
          {errors.root ? <p className="text-sm text-destructive">{errors.root.message}</p> : null}
          <Button type="submit" isLoading={isSubmitting}>
            Create club
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
