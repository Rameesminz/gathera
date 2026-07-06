'use client';

import { useEffect } from 'react';
import { Bell, Calendar, Circle } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useChatStore } from '@/stores/chat-store';
import { useNotificationStore } from '@/stores/notification-store';
import type { ClubMember, Event } from '@/types';

export function ClubRightSidebar({
  members,
  upcomingEvents,
}: {
  members: ClubMember[];
  upcomingEvents: Event[];
}) {
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const { notifications, unreadCount, fetchAll, fetchUnreadCount, markRead, markAllRead } =
    useNotificationStore();

  useEffect(() => {
    void fetchUnreadCount();
    void fetchAll();
  }, [fetchAll, fetchUnreadCount]);

  const onlineIds = new Set(onlineUsers.map((u) => u.id));

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-4 border-l border-border bg-[var(--sidebar)] p-4 xl:flex">
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
          Online — {onlineUsers.length || members.filter((m) => m.status === 'active').length}
        </h3>
        <div className="space-y-2">
          {(onlineUsers.length > 0
            ? onlineUsers.map((u) => ({ user_id: u.id, display_name: u.displayName, role_name: 'member' as const }))
            : members.filter((m) => m.status === 'active').slice(0, 8)
          ).map((member) => (
            <div key={member.user_id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
              <Avatar name={member.display_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.display_name}</p>
                {'role_name' in member ? (
                  <p className="text-xs text-muted-foreground">{member.role_name}</p>
                ) : null}
              </div>
              {onlineIds.has(member.user_id) || onlineUsers.length === 0 ? (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4" />
          Upcoming Events
        </h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.slice(0, 4).map((event) => (
              <div key={event.id} className="rounded-md border border-border bg-card p-3">
                <p className="text-sm font-medium">{event.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.start_at)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 ? <Badge>{unreadCount}</Badge> : null}
          </h3>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void markAllRead()}>
              Mark all read
            </Button>
          ) : null}
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications</p>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => void markRead(n.id)}
                className={`w-full rounded-md border p-2 text-left text-sm transition-colors hover:bg-muted ${
                  n.read ? 'border-border opacity-70' : 'border-primary/30 bg-accent/50'
                }`}
              >
                <p className="font-medium">{n.title}</p>
                {n.body ? <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p> : null}
              </button>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
