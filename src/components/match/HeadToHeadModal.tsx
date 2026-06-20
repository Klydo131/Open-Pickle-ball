'use client';

import { useEffect, useMemo, useState } from 'react';
import { Swords } from 'lucide-react';
import type { MatchRecord, Player } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { PlayerChip, PlayerName } from '@/components/players/PlayerName';
import { headToHead } from '@/lib/selectors';
import { formatDurationShort } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  players: Player[];
  history: MatchRecord[];
}

/** Compare any two players' opponent record from completed matches. */
export function HeadToHeadModal({ open, onClose, players, history }: Props) {
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  // Seed two distinct players when the modal opens. (Initial render can happen
  // before the persisted roster hydrates, so we reconcile on open instead.)
  useEffect(() => {
    if (!open || players.length === 0) return;
    const validA = players.some((p) => p.id === aId) ? aId : players[0].id;
    const validB =
      players.some((p) => p.id === bId) && bId !== validA
        ? bId
        : players.find((p) => p.id !== validA)?.id ?? validA;
    if (validA !== aId) setAId(validA);
    if (validB !== bId) setBId(validB);
    // Only reconcile when opening or the roster changes — not on every pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, players]);

  const a = players.find((p) => p.id === aId);
  const b = players.find((p) => p.id === bId);
  const sameOrMissing = !a || !b || aId === bId;

  const h2h = useMemo(
    () => (sameOrMissing ? null : headToHead(history, aId, bId)),
    [history, aId, bId, sameOrMissing],
  );

  const selectClass =
    'w-full rounded-md border border-glass bg-ocean-950/70 px-3 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white focus:border-pickle focus:outline-none';

  return (
    <Modal open={open} onClose={onClose} title="Head to Head">
      <div className="grid grid-cols-2 gap-2">
        <select aria-label="Player one" value={aId} onChange={(e) => setAId(e.target.value)} className={selectClass}>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select aria-label="Player two" value={bId} onChange={(e) => setBId(e.target.value)} className={selectClass}>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {sameOrMissing ? (
        <p className="mt-5 text-center text-sm text-muted">
          {players.length < 2 ? 'Add at least two players.' : 'Pick two different players.'}
        </p>
      ) : (
        <div className="mt-5">
          {/* scoreboard */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-glass/60 bg-ocean-950/50 p-4">
            <div className="flex flex-1 flex-col items-center gap-1 text-center">
              <PlayerChip player={a!} size={44} />
              <PlayerName player={a!} className="truncate text-sm" />
            </div>
            <div className="flex flex-col items-center">
              <div className="font-display text-3xl font-extrabold text-white">
                <span className="text-pickle">{h2h!.winsA}</span>
                <span className="mx-1 text-muted/50">–</span>
                <span className="text-electric">{h2h!.winsB}</span>
              </div>
              <Swords className="mt-1 h-4 w-4 text-muted" />
            </div>
            <div className="flex flex-1 flex-col items-center gap-1 text-center">
              <PlayerChip player={b!} size={44} />
              <PlayerName player={b!} className="truncate text-sm" />
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-muted">
            {h2h!.total === 0 ? (
              'They haven’t faced each other yet.'
            ) : (
              <>
                {h2h!.total} {h2h!.total === 1 ? 'meeting' : 'meetings'} as opponents
                {h2h!.last && (
                  <>
                    {' · last '}
                    {Math.max(h2h!.last.scoreA, h2h!.last.scoreB)}–
                    {Math.min(h2h!.last.scoreA, h2h!.last.scoreB)}
                    {h2h!.last.completedAt > h2h!.last.startedAt && (
                      <> · {formatDurationShort(h2h!.last.completedAt - h2h!.last.startedAt)}</>
                    )}
                  </>
                )}
              </>
            )}
          </p>
        </div>
      )}
    </Modal>
  );
}
