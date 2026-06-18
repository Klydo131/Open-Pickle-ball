import { cn } from '@/lib/utils';

interface Props {
  size?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Consistent brand mark: a pickle-yellow ball with red speed streaks + wordmark.
 * Used in the header and as the seed for the PWA icons. Do not swap for a
 * random logo (design-system rule).
 */
export function LogoMark({ size = 36, showText = true, className }: Props) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
        {/* red speed streaks */}
        <path d="M2 18 L14 16 M1 24 L12 23 M3 31 L13 30" stroke="#FF314F" strokeWidth="3" strokeLinecap="round" />
        {/* ball */}
        <circle cx="28" cy="24" r="15" fill="#FFD626" />
        <circle cx="28" cy="24" r="15" stroke="#061B3A" strokeOpacity="0.25" strokeWidth="1.5" />
        {/* pickleball holes */}
        <g fill="#061B3A" fillOpacity="0.55">
          <circle cx="24" cy="17" r="1.7" />
          <circle cx="33" cy="19" r="1.7" />
          <circle cx="22" cy="26" r="1.7" />
          <circle cx="31" cy="28" r="1.7" />
          <circle cx="28" cy="22" r="1.7" />
        </g>
      </svg>
      {showText && (
        <div className="leading-none">
          <span className="block font-display text-lg font-extrabold uppercase italic tracking-tight text-white">
            Open
          </span>
          <span className="block font-display text-[10px] font-bold uppercase tracking-[0.25em] text-pickle">
            Pickle Ball
          </span>
        </div>
      )}
    </div>
  );
}
