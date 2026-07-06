'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPoll } from '@/lib/api/polls';
import { getApiErrorMessage } from '@/lib/api/client';

const schema = z.object({
  question: z.string().min(1).max(500),
  option1: z.string().min(1),
  option2: z.string().min(1),
  option3: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CreatePollForm({ clubId }: { clubId: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const options = [data.option1, data.option2, data.option3].filter(
      (o): o is string => !!o && o.trim().length > 0,
    );
    try {
      await createPoll(clubId, { question: data.question, options });
      router.refresh();
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Failed to create poll') });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <FormField label="Question" error={errors.question?.message}>
        <Input {...register('question')} />
      </FormField>
      <FormField label="Option 1" error={errors.option1?.message}>
        <Input {...register('option1')} />
      </FormField>
      <FormField label="Option 2" error={errors.option2?.message}>
        <Input {...register('option2')} />
      </FormField>
      <FormField label="Option 3 (optional)" error={errors.option3?.message}>
        <Input {...register('option3')} />
      </FormField>
      {errors.root ? <p className="text-sm text-destructive">{errors.root.message}</p> : null}
      <Button type="submit" isLoading={isSubmitting}>
        Create poll
      </Button>
    </form>
  );
}
