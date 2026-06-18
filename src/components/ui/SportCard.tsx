import { cn } from '@/lib/utils';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  halftone?: boolean;
}

/** Glassy dark card primitive — the base surface for almost every section. */
export function SportCard({ accent, halftone, className, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        'sport-card p-4',
        accent && 'ring-1 ring-pickle/30',
        className,
      )}
      {...rest}
    >
      {halftone && <div className="halftone pointer-events-none absolute inset-0 opacity-60" />}
      <div className="relative">{children}</div>
    </div>
  );
}
