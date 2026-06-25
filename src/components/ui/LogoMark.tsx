import { cn } from '@/lib/utils';

interface Props {
  size?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Consistent brand mark: paddle + pickleball with red speed streaks + wordmark.
 * Used in the header and as the seed for the PWA icons. Do not swap for a
 * random logo (design-system rule).
 */
export function LogoMark({ size = 36, showText = true, className }: Props) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
        {/* red speed streaks */}
        <path d="M2 18 L12 16 M1 25 L11 24 M3 32 L13 30" stroke="#FF314F" strokeWidth="3" strokeLinecap="round" />
        {/* paddle */}
        <g transform="rotate(-28 23 25)">
          <rect x="15" y="8" width="16" height="25" rx="8" fill="#15C7C9" />
          <rect x="18" y="11" width="10" height="19" rx="5" fill="#0B2748" fillOpacity="0.24" />
          <rect x="20.5" y="31" width="6" height="12" rx="3" fill="#E7F5FF" />
          <rect x="20.5" y="35" width="6" height="8" rx="3" fill="#061B3A" fillOpacity="0.35" />
        </g>
        {/* pickleball */}
        <circle cx="31" cy="26" r="10" fill="#FFD626" />
        <circle cx="31" cy="26" r="10" stroke="#061B3A" strokeOpacity="0.25" strokeWidth="1.5" />
        {/* pickleball holes */}
        <g fill="#061B3A" fillOpacity="0.55">
          <circle cx="28" cy="21" r="1.25" />
          <circle cx="34" cy="22" r="1.25" />
          <circle cx="27" cy="28" r="1.25" />
          <circle cx="34" cy="30" r="1.25" />
          <circle cx="31" cy="25" r="1.25" />
        </g>
      </svg>
      {showText && (
        <div className="leading-none">
          <span className="block font-display text-lg font-extrabold uppercase italic tracking-tight text-white">
            Open
          </span>
          <span className="block font-display text-[10px] font-bold uppercase tracking-[0.25em] text-pickle">
            Pickleball
          </span>
        </div>
      )}
    </div>
  );
}
