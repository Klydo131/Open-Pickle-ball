'use client';

import { useEffect, useState } from 'react';
import { Palette, Hourglass, Trash2, QrCode, Check } from 'lucide-react';
import type { Player } from '@/lib/types';
import { SportCard } from '@/components/ui/SportCard';
import { PlayerChip, PlayerName } from './PlayerName';
import { StreakBadge } from './StreakBadge';
import { ThemePicker } from './ThemePicker';
import { PhotoPicker } from './PhotoPicker';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { winRate } from '@/lib/utils';
import { getPlayerTheme } from '@/lib/playerThemes';

interface Props {
  player: Player;
  /** Is this player currently in the waiting queue? */
  waiting: boolean;
  /** Is this player currently on a court? */
  playing: boolean;
  /** Open the share sheet for this player. */
  onShare: (player: Player) => void;
}

/** Roster row: name in theme, W/L record, photo + theme editor, share, queue, remove. */
export function PlayerCard({ player, waiting, playing, onShare }: Props) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(player.name);
  const setPlayerTheme = useStore((s) => s.setPlayerTheme);
  const setPlayerPhoto = useStore((s) => s.setPlayerPhoto);
  const renamePlayer = useStore((s) => s.renamePlayer);
  const removePlayer = useStore((s) => s.removePlayer);
  const joinQueue = useStore((s) => s.joinQueue);
  const leaveQueue = useStore((s) => s.leaveQueue);

  // Resync the field to the canonical name after a rename / when switching cards
  // (while typing, player.name is unchanged, so this never clobbers input).
  useEffect(() => setNameInput(player.name), [player.name]);

  function saveName() {
    const r = renamePlayer(player.id, nameInput);
    if (r.ok) {
      toast('success', 'Name updated');
    } else {
      toast('error', r.message);
      setNameInput(player.name);
    }
  }

  const rate = winRate(player.wins, player.losses);
  const theme = getPlayerTheme(player.themeId);

  return (
    <SportCard className="p-3 pl-4">
      {/* team-colour accent stripe + soft corner glow tie the card to the theme */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: `linear-gradient(to bottom, ${theme.accent}, ${theme.accent}44)` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-6 h-20 w-20 rounded-full blur-2xl"
        style={{ background: `${theme.accent}1f` }}
      />
      <div className="flex items-center gap-3">
        <PlayerChip player={player} size={46} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PlayerName player={player} className="truncate text-lg" />
            <StreakBadge streak={player.streak} />
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
            <span>{rate}% <span className="text-muted/60">win</span></span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            aria-label={`Share ${player.name}'s profile`}
            onClick={() => onShare(player)}
            className="btn-press rounded-full p-2 text-muted hover:bg-ocean-800 hover:text-electric"
          >
            <QrCode className="h-4 w-4" />
          </button>
          <button
            aria-label="Edit name, photo & theme"
            onClick={() => setEditing((v) => !v)}
            className="btn-press rounded-full p-2 text-muted hover:bg-ocean-800 hover:text-pickle"
          >
            <Palette className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 space-y-3 border-t border-glass/40 pt-3">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Name</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveName();
              }}
              className="flex gap-2"
            >
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={24}
                aria-label={`Rename ${player.name}`}
                placeholder="Player name"
                className="min-w-0 flex-1 rounded-md border border-glass/60 bg-ocean-950/70 px-3 py-2 text-sm text-white placeholder:text-muted/50 focus:border-pickle focus:outline-none"
              />
              <button
                type="submit"
                disabled={!nameInput.trim() || nameInput.trim() === player.name}
                aria-label="Save name"
                className="btn-press flex items-center gap-1.5 rounded-md border border-pickle/50 px-3 font-display text-xs font-bold uppercase tracking-wide text-pickle hover:bg-pickle/10 disabled:opacity-40"
              >
                <Check className="h-4 w-4" /> Save
              </button>
            </form>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Photo</p>
            <PhotoPicker
              value={player.photo}
              themeId={player.themeId}
              onChange={(photo) => {
                const r = setPlayerPhoto(player.id, photo);
                if (!r.ok) toast('error', r.message);
              }}
            />
          </div>
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
