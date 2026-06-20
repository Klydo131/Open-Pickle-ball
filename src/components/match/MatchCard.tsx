'use client';

import type { Court, Match, Player } from '@/lib/types';
import { SportCard } from '@/components/ui/SportCard';
import { PlayerChip, PlayerName } from '@/components/players/PlayerName';

interface Props {
  match: Match;
  court?: Court;
  players: Record<string, Player>;
  /** Optional action row (Record / Cancel) shown on the Play screen. */
  actions?: React.ReactNode;
}

function TeamColumn({
  ids,
  players,
  align,
}: {
  ids: string[];
  players: Record<string, Player>;
  align: 'left' | 'right';
}) {
  return (
    <div className={`flex flex-1 flex-col gap-2 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      {ids.map((id) => {
        const p = players[id];
        if (!p) return null;
        return (
          <div
            key={id}
            className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}
          >
            <PlayerChip player={p} size={34} />
            <PlayerName player={p} className="max-w-[5.5rem] truncate text-sm" />
          </div>
        );
      })}
    </div>
  );
}

/** Active match card: team A vs team B with a bold VS divider and live status. */
export function MatchCard({ match, court, players, actions }: Props) {
  return (
    <SportCard accent halftone className="p-4">
      {/* live sheen sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-sheen motion-reduce:hidden"
      />
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-sm font-bold uppercase tracking-wide text-pickle">
          {court?.name ?? 'Court'}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-serve/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-serve">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-serve" />
          Live · {match.type}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <TeamColumn ids={match.teamA} players={players} align="left" />
        <div className="flex flex-col items-center px-1">
          <span className="font-display text-xl font-extrabold italic text-muted">VS</span>
        </div>
        <TeamColumn ids={match.teamB} players={players} align="right" />
      </div>

      {actions && <div className="mt-4">{actions}</div>}
    </SportCard>
  );
}
