import Link from 'next/link';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/messages" className={`inline-flex items-center gap-2 font-bold ${className ?? ''}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg text-primary-foreground">
        G
      </span>
      <span className="text-xl tracking-tight">Gathera</span>
    </Link>
  );
}
