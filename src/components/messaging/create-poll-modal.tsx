'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { createChatPoll } from '@/lib/api/polls';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Poll } from '@/types';

const schema = z.object({
  question: z.string().min(1).max(500),
  option1: z.string().min(1),
  option2: z.string().min(1),
  option3: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreatePollModalProps {
  chatId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (poll: Poll) => void;
}

export function CreatePollModal({ chatId, open, onClose, onCreated }: CreatePollModalProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!open) return null;

  const onSubmit = async (data: FormData) => {
    setError(null);
    const options = [data.option1, data.option2, data.option3].filter(
      (o): o is string => !!o && o.trim().length > 0,
    );
    try {
      const poll = await createChatPoll(chatId, { question: data.question, options });
      reset();
      onCreated(poll);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create poll'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create poll</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <FormField label="Question" error={errors.question?.message}>
            <Input {...register('question')} placeholder="Ask a question..." />
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
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create poll
          </Button>
        </form>
      </div>
    </div>
  );
}
