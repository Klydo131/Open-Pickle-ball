import { SportCard } from './SportCard';

export interface Stat {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

/** Four-column glanceable stat area: icon, big number, label. */
export function StatsStrip({ stats }: { stats: Stat[] }) {
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
