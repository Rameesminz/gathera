import { cn } from '@/lib/utils';

function SkeletonBubble({ mine, wide }: { mine: boolean; wide?: boolean }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'h-9 animate-pulse rounded-2xl',
          mine ? 'rounded-br-md bg-primary/20' : 'rounded-bl-md bg-muted',
          wide ? 'w-52' : 'w-36',
        )}
      />
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <SkeletonBubble mine={false} wide />
      <SkeletonBubble mine={false} />
      <SkeletonBubble mine />
      <SkeletonBubble mine wide />
      <SkeletonBubble mine={false} wide />
      <SkeletonBubble mine={false} />
      <SkeletonBubble mine />
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded bg-muted/70" />
          </div>
          <div className="h-3 w-8 animate-pulse rounded bg-muted/50" />
        </div>
      ))}
    </div>
  );
}
