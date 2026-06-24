'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trophy, Minus, Plus } from 'lucide-react';
import type { Match, Player } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { PlayerName } from '@/components/players/PlayerName';
import { OfficialsPicker } from './OfficialsPicker';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { burstConfetti } from '@/lib/confetti';
import { cn } from '@/lib/utils';

interface Props {
  match: Match | null;
  players: Record<string, Player>;
  onClose: () => void;
}

/** Big-tap-target score entry — sweaty-hands friendly per the UX guidelines. */
export function RecordResultModal({ match, players, onClose }: Props) {
  const recordResult = useStore((s) => s.recordResult);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [umpire, setUmpire] = useState('');
  const [recordedBy, setRecordedBy] = useState('');

  // Everyone on the roster can officiate or record — listed for the dropdowns.
  const roster = useMemo(() => Object.values(players), [players]);

  // Start fresh whenever a different match is opened.
  useEffect(() => {
    setScoreA(0);
    setScoreB(0);
    setUmpire('');
    setRecordedBy('');
  }, [match?.id]);

  function reset() {
    setScoreA(0);
    setScoreB(0);
    setUmpire('');
    setRecordedBy('');
  }

  function submit() {
    if (!match) return;
    const r = recordResult(match.id, scoreA, scoreB, {
      umpire: umpire || null,
      recordedBy: recordedBy || null,
    });
    if (r.ok) {
      const winner = scoreA > scoreB ? 'Team A' : 'Team B';
      burstConfetti();
      toast('success', `${winner} takes it ${Math.max(scoreA, scoreB)}–${Math.min(scoreA, scoreB)}`);
      reset();
      onClose();
    } else {
      toast('error', r.message);
    }
  }

  if (!match) return null;

  const teamNames = (ids: string[]) =>
    ids.map((id, i) => (
      <span key={id}>
        {i > 0 && <span className="text-muted"> & </span>}
        {players[id] ? <PlayerName player={players[id]} className="text-sm" /> : 'Player'}
      </span>
    ));

  return (
    <Modal open={!!match} onClose={onClose} title="Record Result">
      <div className="grid grid-cols-2 gap-3">
        <ScoreColumn
          label="Team A"
          names={teamNames(match.teamA)}
          score={scoreA}
          onChange={setScoreA}
          tone="pickle"
          leading={scoreA > scoreB}
        />
        <ScoreColumn
          label="Team B"
          names={teamNames(match.teamB)}
          score={scoreB}
          onChange={setScoreB}
          tone="electric"
          leading={scoreB > scoreA}
        />
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Winners earn a W, the other side takes an L. No ties allowed.
      </p>

      <OfficialsPicker
        roster={roster}
        umpire={umpire}
        recordedBy={recordedBy}
        onUmpire={setUmpire}
        onRecordedBy={setRecordedBy}
      />

      <div className="mt-4">
        <PrimaryButton fullWidth onClick={submit} icon={<Trophy className="h-5 w-5" />}>
          Save Result
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function ScoreColumn({
  label,
  names,
  score,
  onChange,
  tone,
  leading,
}: {
  label: string;
  names: React.ReactNode;
  score: number;
  onChange: (n: number) => void;
  tone: 'pickle' | 'electric';
  leading: boolean;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(99, n));
  return (
    <div
      className={cn(
        'rounded-lg border bg-ocean-950/50 p-3 text-center transition-colors',
        leading ? (tone === 'pickle' ? 'border-pickle' : 'border-electric') : 'border-glass/50',
      )}
    >
      <div className={cn('font-display text-sm font-bold uppercase tracking-wide', tone === 'pickle' ? 'text-pickle' : 'text-electric')}>
        {label}
      </div>
      <div className="mb-2 truncate text-xs text-muted">{names}</div>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        value={score}
        onChange={(e) => onChange(clamp(Math.floor(Number(e.target.value) || 0)))}
        aria-label={`${label} score`}
        className="w-full bg-transparent text-center font-display text-5xl font-extrabold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          aria-label={`Decrease ${label} score`}
          onClick={() => onChange(clamp(score - 1))}
          className="btn-press flex h-12 w-12 items-center justify-center rounded-md border border-glass/60 text-white hover:border-serve/60 hover:text-serve"
        >
          <Minus className="h-6 w-6" />
        </button>
        <button
          aria-label={`Increase ${label} score`}
          onClick={() => onChange(clamp(score + 1))}
          className="btn-press flex h-12 w-12 items-center justify-center rounded-md bg-pickle text-ocean-950 hover:shadow-glow"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
