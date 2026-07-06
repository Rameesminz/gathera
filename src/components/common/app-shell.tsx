import { AuthGuard } from '@/components/common/auth-guard';
import { Header } from '@/components/common/header';
import { MobileNav } from '@/components/common/mobile-nav';
import { Sidebar } from '@/components/common/sidebar';

export function AppShell({
  children,
  clubId,
}: {
  children: React.ReactNode;
  clubId?: string;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <div className="mx-auto flex w-full max-w-7xl flex-1">
          <Sidebar clubId={clubId} />
          <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-6">{children}</main>
        </div>
        <MobileNav clubId={clubId} />
      </div>
    </AuthGuard>
  );
}
