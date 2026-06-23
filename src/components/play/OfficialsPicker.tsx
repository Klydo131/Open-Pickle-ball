'use client';

import { Gavel, ClipboardCheck } from 'lucide-react';
import type { Player } from '@/lib/types';

interface Props {
  /** The roster to choose officials from. */
  roster: Player[];
  /** Currently selected umpire player id ('' = none). */
  umpire: string;
  /** Currently selected recorder player id ('' = none). */
  recordedBy: string;
  onUmpire: (id: string) => void;
  onRecordedBy: (id: string) => void;
}

/**
 * Optional "who called it / who logged it" pickers shown under the score.
 * Recording the umpire and the scorer makes a result auditable and gives the
 * downloadable profile card real context — without adding friction (both
 * default to “—” and can be left blank).
 */
export function OfficialsPicker({ roster, umpire, recordedBy, onUmpire, onRecordedBy }: Props) {
  if (roster.length === 0) return null;
  return (
    <div className="mt-4 rounded-lg border border-glass/50 bg-ocean-950/40 p-3">
      <p className="mb-2 font-display text-[11px] font-bold uppercase tracking-wide text-muted">
        Officials <span className="font-sans normal-case text-muted/60">(optional)</span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        <OfficialSelect
          label="Umpire"
          icon={<Gavel className="h-3.5 w-3.5 text-electric" />}
          roster={roster}
          value={umpire}
          onChange={onUmpire}
        />
        <OfficialSelect
          label="Recorded by"
          icon={<ClipboardCheck className="h-3.5 w-3.5 text-pickle" />}
          roster={roster}
          value={recordedBy}
          onChange={onRecordedBy}
        />
      </div>
    </div>
  );
}

function OfficialSelect({
  label,
  icon,
  roster,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  roster: Player[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted">
        {icon} {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-glass/60 bg-ocean-950/70 px-2 py-2 text-sm text-white focus:border-pickle focus:outline-none"
      >
        <option value="">—</option>
        {roster.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
