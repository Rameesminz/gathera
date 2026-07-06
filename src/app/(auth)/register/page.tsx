import { RegisterForm } from '@/components/forms/register-form';
import { Logo } from '@/components/common/logo';

export const metadata = { title: 'Sign up' };

export default function RegisterPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <RegisterForm />
    </div>
  );
}
