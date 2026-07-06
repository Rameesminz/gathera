'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createEvent } from '@/lib/api/events';
import { getApiErrorMessage } from '@/lib/api/client';

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  startAt: z.string().min(1, 'Start date is required'),
});

type FormData = z.infer<typeof schema>;

export function CreateEventForm({ clubId }: { clubId: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      startAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createEvent(clubId, {
        ...data,
        startAt: new Date(data.startAt).toISOString(),
      });
      router.refresh();
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Failed to create event') });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <FormField label="Title" error={errors.title?.message}>
        <Input {...register('title')} />
      </FormField>
      <FormField label="Description" error={errors.description?.message}>
        <Textarea {...register('description')} />
      </FormField>
      <FormField label="Location" error={errors.location?.message}>
        <Input {...register('location')} />
      </FormField>
      <FormField label="Starts at" error={errors.startAt?.message}>
        <Input type="datetime-local" {...register('startAt')} />
      </FormField>
      {errors.root ? <p className="text-sm text-destructive">{errors.root.message}</p> : null}
      <Button type="submit" isLoading={isSubmitting}>
        Create event
      </Button>
    </form>
  );
}
