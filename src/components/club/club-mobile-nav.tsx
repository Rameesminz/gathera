'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Vote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const primaryItems = [
  { href: '', label: 'Overview', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/polls', label: 'Polls', icon: Vote },
  { href: '/events', label: 'Events', icon: Calendar },
];

export function ClubMobileNav({ clubId }: { clubId: string }) {
  const pathname = usePathname();
  const base = `/clubs/${clubId}`;
  const moreActive = !primaryItems.some(({ href }) => {
    const path = `${base}${href}`;
    return href === '' ? pathname === base : pathname === path || pathname.startsWith(`${path}/`);
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-bottom lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
        {primaryItems.map(({ href, label, icon: Icon }) => {
          const path = `${base}${href}`;
          const active =
            href === ''
              ? pathname === base
              : pathname === path || pathname.startsWith(`${path}/`);
          return (
            <Link
              key={path}
              href={path}
              className={cn(
                'flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
        <Link
          href={`${base}/members`}
          className={cn(
            'flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium',
            moreActive ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </Link>
      </div>
    </nav>
  );
}
