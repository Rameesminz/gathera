import { formatDateSeparator } from '@/lib/utils';

export function DateSeparator({ dateStr }: { dateStr: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-border/60" />
      <span className="rounded-full bg-[var(--chat-bg)] px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border/40">
        {formatDateSeparator(dateStr)}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}
