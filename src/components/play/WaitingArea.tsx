'use client';

import { Hourglass, X } from 'lucide-react';
import type { Player } from '@/lib/types';
import { SportCard } from '@/components/ui/SportCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PlayerChip, PlayerName } from '@/components/players/PlayerName';
import { useStore } from '@/lib/store';

interface Props {
  queue: string[];
  players: Record<string, Player>;
}

/** Ordered "next up" list. First in, first on a free court. */
export function WaitingArea({ queue, players }: Props) {
  const leaveQueue = useStore((s) => s.leaveQueue);

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={<Hourglass className="h-9 w-9" />}
        title="Waiting area is empty"
        message="When courts are full, send players here from the Players tab to hold their spot in line."
      />
    );
  }

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {queue.map((id, index) => {
        const p = players[id];
        if (!p) return null;
        return (
          <SportCard key={id} className="flex items-center gap-3 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean-800 font-display text-sm font-bold text-pickle">
              {index + 1}
            </span>
            <PlayerChip player={p} size={36} />
            <PlayerName player={p} className="flex-1 truncate text-base" />
            <button
              aria-label={`Remove ${p.name} from queue`}
              onClick={() => leaveQueue(id)}
              className="btn-press rounded-full p-2 text-muted hover:bg-ocean-800 hover:text-serve"
            >
              <X className="h-4 w-4" />
            </button>
          </SportCard>
        );
      })}
    </div>
  );
}
