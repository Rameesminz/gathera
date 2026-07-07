'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Bell } from 'lucide-react';
import { Logo } from '@/components/common/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              {unreadCount > 0 ? (
                <span className="relative hidden sm:inline-flex">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              ) : null}
              <Link href="/profile" className="hidden items-center gap-3 sm:flex">
                <Avatar name={user.display_name} src={user.avatar_url} size="sm" />
                <div className="text-sm">
                  <p className="font-medium">{user.display_name}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
