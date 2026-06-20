import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  streak: number;
  /** Show even for a streak of 1 (rarely needed). */
  min?: number;
  className?: string;
}

/**
 * Animated win-streak badge — a flickering flame + count. Hidden below `min`
 * (default 2) so it only celebrates real hot streaks. Brighter at 3+.
 */
export function StreakBadge({ streak, min = 2, className }: Props) {
  if (streak < min) return null;
  const hot = streak >= 3;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
        hot ? 'bg-serve/20 text-serve' : 'bg-pickle/15 text-pickle',
        className,
      )}
      title={`${streak}-match win streak`}
    >
      <Flame className="h-3 w-3 animate-flame motion-reduce:animate-none" />
      {streak}
    </span>
  );
}
