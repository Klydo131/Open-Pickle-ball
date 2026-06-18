'use client';

import { useState } from 'react';
import { Palette, Hourglass, Trash2, Flame } from 'lucide-react';
import type { Player } from '@/lib/types';
import { SportCard } from '@/components/ui/SportCard';
import { PlayerChip, PlayerName } from './PlayerName';
import { ThemePicker } from './ThemePicker';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { winRate } from '@/lib/utils';

interface Props {
  player: Player;
  /** Is this player currently in the waiting queue? */
  waiting: boolean;
  /** Is this player currently on a court? */
  playing: boolean;
}

/** Roster row: name in theme, W/L record, theme picker, queue + remove. */
export function PlayerCard({ player, waiting, playing }: Props) {
  const [editing, setEditing] = useState(false);
  const setPlayerTheme = useStore((s) => s.setPlayerTheme);
  const removePlayer = useStore((s) => s.removePlayer);
  const joinQueue = useStore((s) => s.joinQueue);
  const leaveQueue = useStore((s) => s.leaveQueue);

  const rate = winRate(player.wins, player.losses);

  return (
    <SportCard className="p-3">
      <div className="flex items-center gap-3">
        <PlayerChip player={player} size={46} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PlayerName player={player} className="truncate text-lg" />
            {playing && (
              <span className="rounded-full bg-serve/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-serve">
                On court
              </span>
            )}
            {waiting && !playing && (
              <span className="rounded-full bg-electric/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-electric">
                Waiting
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
            <span><b className="text-emerald-400">{player.wins}</b> W</span>
            <span><b className="text-serve">{player.losses}</b> L</span>
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-pickle" />
              {rate}%
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            aria-label="Change theme"
            onClick={() => setEditing((v) => !v)}
            className="btn-press rounded-full p-2 text-muted hover:bg-ocean-800 hover:text-pickle"
          >
            <Palette className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 border-t border-glass/40 pt-3">
          <ThemePicker
            value={player.themeId}
            onChange={(themeId) => {
              setPlayerTheme(player.id, themeId);
            }}
          />
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {playing ? (
          <button
            disabled
            className="flex-1 rounded-md border border-glass/60 py-2 text-xs font-bold uppercase tracking-wide text-muted/60"
          >
            In match
          </button>
        ) : waiting ? (
          <button
            onClick={() => leaveQueue(player.id)}
            className="btn-press flex-1 rounded-md border border-electric/50 py-2 text-xs font-bold uppercase tracking-wide text-electric hover:bg-electric/10"
          >
            Leave queue
          </button>
        ) : (
          <button
            onClick={() => {
              const r = joinQueue(player.id);
              if (r.ok) toast('info', `${player.name} joined the waiting area`);
              else toast('error', r.message);
            }}
            className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-md border border-glass/60 py-2 text-xs font-bold uppercase tracking-wide text-white hover:border-electric/60"
          >
            <Hourglass className="h-3.5 w-3.5" /> Wait for court
          </button>
        )}
        <button
          aria-label={`Remove ${player.name}`}
          onClick={() => {
            const r = removePlayer(player.id);
            if (r.ok) toast('info', `${player.name} removed`);
            else toast('error', r.message);
          }}
          className="btn-press rounded-md border border-glass/60 px-3 text-muted hover:border-serve/60 hover:text-serve"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </SportCard>
  );
}
