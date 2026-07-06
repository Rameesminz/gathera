'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Settings,
  User,
  Users,
  Vote,
} from 'lucide-react';

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clubs', label: 'My Clubs', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function navClass(active: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? 'bg-accent text-accent-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;
}

export function Sidebar({ clubId }: { clubId?: string }) {
  const pathname = usePathname();

  const clubNav = clubId
    ? [
        { href: `/clubs/${clubId}`, label: 'Overview', icon: LayoutDashboard },
        { href: `/clubs/${clubId}/members`, label: 'Members', icon: Users },
        { href: `/clubs/${clubId}/events`, label: 'Events', icon: Calendar },
        { href: `/clubs/${clubId}/polls`, label: 'Polls', icon: Vote },
        { href: `/clubs/${clubId}/chats`, label: 'Chats', icon: MessageSquare },
      ]
    : [];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {mainNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
          return (
            <Link key={href} href={href} className={navClass(active)}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}

        {clubNav.length > 0 ? (
          <>
            <div className="my-3 border-t border-border" />
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Club
            </p>
            {clubNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={navClass(pathname === href || pathname.startsWith(`${href}/`))}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </>
        ) : null}

        <div className="mt-4">
          <Link
            href="/clubs/new"
            className="inline-flex h-10 w-full items-center justify-start gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            New club
          </Link>
        </div>
      </nav>
    </aside>
  );
}
