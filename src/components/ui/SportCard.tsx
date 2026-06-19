import { cn } from '@/lib/utils';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  halftone?: boolean;
}

/**
 * Glassy dark card primitive — the base surface for almost every section.
 * Children are rendered directly, so layout utilities (flex/grid/justify…) can
 * be passed via className. The optional halftone texture is a ::before layer,
 * so it never interferes with that layout.
 */
export function SportCard({ accent, halftone, className, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        'sport-card',
        accent && 'ring-1 ring-pickle/30',
        halftone && 'sport-card--halftone',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
