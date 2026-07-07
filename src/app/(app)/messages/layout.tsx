import { AuthGuard } from '@/components/common/auth-guard';
import { Header } from '@/components/common/header';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-2 py-2 sm:px-4 sm:py-4">{children}</main>
      </div>
    </AuthGuard>
  );
}
