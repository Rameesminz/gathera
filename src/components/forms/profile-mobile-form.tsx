'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api/client';
import { isValidMobileNumber, normalizeMobileNumber } from '@/lib/phone';
import { useAuthStore } from '@/stores/auth-store';
import type { PublicUser } from '@/types';

const schema = z.object({
  mobileNumber: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidMobileNumber(value), {
      message: 'Enter a valid mobile number',
    }),
});

type FormData = z.infer<typeof schema>;

interface ProfileMobileFormProps {
  user: PublicUser;
}

export function ProfileMobileForm({ user }: ProfileMobileFormProps) {
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      mobileNumber: user.mobile_number ?? '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const trimmed = data.mobileNumber?.trim() ?? '';
      const mobileNumber = trimmed ? normalizeMobileNumber(trimmed) : null;
      const updated = await updateProfile({ mobileNumber });
      reset({ mobileNumber: updated.mobile_number ?? '' });
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Failed to update mobile number') });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact</CardTitle>
        <CardDescription>Add or update your mobile number for account discovery</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Mobile number" error={errors.mobileNumber?.message}>
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="+1 555 123 4567"
              {...register('mobileNumber')}
            />
          </FormField>
          {errors.root ? <p className="text-sm text-destructive">{errors.root.message}</p> : null}
          <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
            Save mobile number
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
