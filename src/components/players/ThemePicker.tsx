'use client';

import { Check } from 'lucide-react';
import { PLAYER_THEMES } from '@/lib/playerThemes';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (themeId: string) => void;
}

/** Grid of name themes — "players choose their theme in their name". */
export function ThemePicker({ value, onChange }: Props) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Name theme</p>
      <div className="grid grid-cols-3 gap-2">
        {PLAYER_THEMES.map((theme) => {
          const selected = theme.id === value;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange(theme.id)}
              aria-pressed={selected}
              className={cn(
                'btn-press relative overflow-hidden rounded-md border bg-ocean-950/60 p-2 text-left',
                selected ? 'border-pickle' : 'border-glass/50 hover:border-electric/50',
              )}
            >
              <span
                className="mb-1 block h-1.5 w-full rounded-full bg-gradient-to-r"
                style={{ backgroundImage: `linear-gradient(to right, ${theme.accent}, ${theme.accent}55)` }}
              />
              <span className={cn('block truncate font-display text-xs font-bold', theme.textClass)}>
                {theme.label}
              </span>
              {selected && (
                <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-pickle" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
