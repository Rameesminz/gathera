'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  FolderOpen,
  Image,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Trophy,
  Users,
  Vote,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const clubNavItems = [
  { href: '', label: 'Overview', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/polls', label: 'Polls', icon: Vote },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/gallery', label: 'Gallery', icon: Image },
  { href: '/files', label: 'Files', icon: FolderOpen },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/tournament', label: 'Tournament', icon: Trophy },
  { href: '/funds', label: 'Funds', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function ClubNav({ clubId, clubName }: { clubId: string; clubName: string }) {
  const pathname = usePathname();
  const base = `/clubs/${clubId}`;

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-border bg-[var(--sidebar)] lg:w-56 xl:w-60">
      <div className="border-b border-border px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Club</p>
        <h2 className="mt-1 truncate font-semibold">{clubName}</h2>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {clubNavItems.map(({ href, label, icon: Icon }) => {
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
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-[var(--sidebar-active)] text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
