import { SportCard } from './SportCard';

export interface Stat {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

/**
 * Glanceable stats. `row` (default) = four columns with dividers (mobile strip).
 * `grid` = responsive 2-up that fills wider desktop columns nicely.
 */
export function StatsStrip({
  stats,
  variant = 'row',
}: {
  stats: Stat[];
  variant?: 'row' | 'grid';
}) {
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <SportCard key={s.label} className="flex items-center gap-3 px-4 py-4">
            <div>{s.icon}</div>
            <div>
              <div className="font-display text-2xl font-bold leading-none text-white">{s.value}</div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted">{s.label}</div>
            </div>
          </SportCard>
        ))}
      </div>
    );
  }

  return (
    <SportCard className="px-2 py-4">
      <div className="flex items-stretch">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-1 flex-col items-center gap-1 px-1 ${
              i < stats.length - 1 ? 'border-r border-glass/50' : ''
            }`}
          >
            <div className="mb-0.5">{s.icon}</div>
            <div className="font-display text-2xl font-bold leading-none text-white">{s.value}</div>
            <div className="text-center text-[10px] font-medium uppercase tracking-wide text-muted">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </SportCard>
  );
}
