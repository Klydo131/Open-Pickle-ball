'use client';

import { useEffect, useMemo, useState } from 'react';
import { Swords } from 'lucide-react';
import type { Court, MatchType, Player } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { PlayerChip, PlayerName } from '@/components/players/PlayerName';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface Props {
  court: Court | null;
  onClose: () => void;
}

type Side = 'A' | 'B' | null;

/**
 * Multi-step-feel match builder: choose format, then assign players to each
 * side. Available players are filtered to those not already on a court. The
 * waiting queue is suggested first so the "next up" players go on.
 */
export function StartMatchModal({ court, onClose }: Props) {
  const players = useStore((s) => s.players);
  const matches = useStore((s) => s.matches);
  const waitingQueue = useStore((s) => s.waitingQueue);
  const startMatch = useStore((s) => s.startMatch);

  const [type, setType] = useState<MatchType>('doubles');
  const [assign, setAssign] = useState<Record<string, Side>>({});

  // Clear selections whenever a different court's modal is opened.
  useEffect(() => {
    setAssign({});
  }, [court?.id]);

  const perTeam = type === 'singles' ? 1 : 2;

  // Players already on a court can't be picked.
  const busy = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) for (const id of [...m.teamA, ...m.teamB]) set.add(id);
    return set;
  }, [matches]);

  // Available players: waiting-queue order first, then the rest.
  const available = useMemo(() => {
    const free = players.filter((p) => !busy.has(p.id));
    const order = new Map(waitingQueue.map((id, i) => [id, i]));
    return free.sort((a, b) => {
      const ai = order.has(a.id) ? order.get(a.id)! : Number.MAX_SAFE_INTEGER;
      const bi = order.has(b.id) ? order.get(b.id)! : Number.MAX_SAFE_INTEGER;
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name);
    });
  }, [players, busy, waitingQueue]);

  const teamA = Object.keys(assign).filter((id) => assign[id] === 'A');
  const teamB = Object.keys(assign).filter((id) => assign[id] === 'B');

  function setSide(id: string, side: Side) {
    setAssign((prev) => {
      const next = { ...prev };
      if (side === null || prev[id] === side) {
        delete next[id];
      } else {
        next[id] = side;
      }
      return next;
    });
  }

  function changeType(next: MatchType) {
    setType(next);
    setAssign({}); // reset assignments when switching format
  }

  function confirm() {
    if (!court) return;
    const r = startMatch(court.id, type, teamA, teamB);
    if (r.ok) {
      toast('success', `Match started on ${court.name}`);
      setAssign({});
      onClose();
    } else {
      toast('error', r.message);
    }
  }

  const ready = teamA.length === perTeam && teamB.length === perTeam;

  return (
    <Modal open={!!court} onClose={onClose} title={`Start on ${court?.name ?? ''}`}>
      {/* format toggle */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(['singles', 'doubles'] as MatchType[]).map((t) => (
          <button
            key={t}
            onClick={() => changeType(t)}
            className={cn(
              'btn-press rounded-md border py-2.5 font-display text-sm font-bold uppercase tracking-wide',
              type === t
                ? 'border-pickle bg-pickle/10 text-pickle'
                : 'border-glass/60 text-muted hover:text-white',
            )}
          >
            {t === 'singles' ? 'Singles · 1v1' : 'Doubles · 2v2'}
          </button>
        ))}
      </div>

      {/* team summary */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-center">
        <TeamSummary label="Team A" count={teamA.length} max={perTeam} tone="pickle" />
        <TeamSummary label="Team B" count={teamB.length} max={perTeam} tone="electric" />
      </div>

      {/* available players */}
      <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
        {available.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">
            No available players. Add players or finish a running match.
          </p>
        )}
        {available.map((p) => (
          <PlayerPickRow
            key={p.id}
            player={p}
            side={assign[p.id] ?? null}
            disableA={teamA.length >= perTeam && assign[p.id] !== 'A'}
            disableB={teamB.length >= perTeam && assign[p.id] !== 'B'}
            onPick={(side) => setSide(p.id, side)}
          />
        ))}
      </div>

      <div className="mt-4">
        <PrimaryButton fullWidth disabled={!ready} onClick={confirm} icon={<Swords className="h-5 w-5" />}>
          {ready ? 'Start Match' : `Pick ${perTeam} per side`}
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function TeamSummary({
  label,
  count,
  max,
  tone,
}: {
  label: string;
  count: number;
  max: number;
  tone: 'pickle' | 'electric';
}) {
  return (
    <div className={cn('rounded-md border py-2', count === max ? 'border-pickle/60' : 'border-glass/50')}>
      <div className={cn('font-display text-sm font-bold uppercase tracking-wide', tone === 'pickle' ? 'text-pickle' : 'text-electric')}>
        {label}
      </div>
      <div className="text-xs text-muted">
        {count}/{max}
      </div>
    </div>
  );
}

function PlayerPickRow({
  player,
  side,
  disableA,
  disableB,
  onPick,
}: {
  player: Player;
  side: Side;
  disableA: boolean;
  disableB: boolean;
  onPick: (side: Side) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-glass/40 bg-ocean-950/50 p-2">
      <PlayerChip player={player} size={34} />
      <PlayerName player={player} className="flex-1 truncate text-sm" />
      <button
        onClick={() => onPick('A')}
        disabled={disableA}
        className={cn(
          'btn-press h-8 w-8 rounded-md font-display text-sm font-bold',
          side === 'A' ? 'bg-pickle text-ocean-950' : 'border border-glass/60 text-muted disabled:opacity-30',
        )}
      >
        A
      </button>
      <button
        onClick={() => onPick('B')}
        disabled={disableB}
        className={cn(
          'btn-press h-8 w-8 rounded-md font-display text-sm font-bold',
          side === 'B' ? 'bg-electric text-ocean-950' : 'border border-glass/60 text-muted disabled:opacity-30',
        )}
      >
        B
      </button>
    </div>
  );
}
