import { cn, getInitials } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  xs: { cls: 'h-7 w-7 text-[10px]', px: 28 },
  sm: { cls: 'h-9 w-9 text-xs',     px: 36 },
  md: { cls: 'h-11 w-11 text-sm',   px: 44 },
  lg: { cls: 'h-14 w-14 text-base', px: 56 },
};

// Deterministic gradient from name so each user gets a consistent colour
const gradients = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-orange-400 to-rose-500',
  'from-pink-500 to-fuchsia-600',
  'from-amber-400 to-orange-500',
  'from-sky-500 to-indigo-500',
  'from-teal-400 to-green-500',
];

function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const { cls, px } = sizes[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className={cn('shrink-0 rounded-full object-cover ring-2 ring-white/20', cls, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'shrink-0 rounded-full bg-gradient-to-br font-semibold text-white',
        'flex items-center justify-center select-none',
        gradientFor(name),
        cls,
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
