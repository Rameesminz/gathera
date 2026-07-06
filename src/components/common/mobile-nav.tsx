'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, User, Users } from 'lucide-react';

const items = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/clubs', label: 'Clubs', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav({ clubId }: { clubId?: string }) {
  const pathname = usePathname();

  if (clubId) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-bottom lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
