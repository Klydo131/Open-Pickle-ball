'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const base =
  'btn-press inline-flex items-center justify-center gap-2 rounded-md font-display font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950';

const variants: Record<Variant, string> = {
  primary: 'bg-pickle text-ocean-950 hover:shadow-glow focus-visible:ring-pickle',
  secondary:
    'border border-glass bg-ocean-900/60 text-white hover:border-electric/70 focus-visible:ring-electric',
  danger: 'bg-serve text-white hover:brightness-110 focus-visible:ring-serve',
  ghost: 'text-muted hover:text-white focus-visible:ring-electric',
};

/**
 * Yellow, high-contrast, all-caps primary action per the design brief.
 * Ships with loading / disabled / pressed states (acceptance criteria).
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', loading, icon, fullWidth, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], fullWidth && 'w-full', 'px-5 py-3 text-base', className)}
      {...rest}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      {children}
    </button>
  ),
);
PrimaryButton.displayName = 'PrimaryButton';
