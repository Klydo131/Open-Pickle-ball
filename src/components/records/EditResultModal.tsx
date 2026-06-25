'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Minus, Plus, Trash2 } from 'lucide-react';
import type { MatchRecord, Player } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { PlayerName } from '@/components/players/PlayerName';
import { OfficialsPicker } from '@/components/play/OfficialsPicker';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface Props {
  record: MatchRecord | null;
  players: Record<string, Player>;
  onClose: () => void;
}

/**
 * Fix a slight mistake on an already-recorded match — adjust the score (or flip
 * the winner), or delete the result entirely. The store rolls W/L and streaks
 * back to stay consistent.
 */
export function EditResultModal({ record, players, onClose }: Props) {
  const editMatchRecord = useStore((s) => s.editMatchRecord);
  const setRecordOfficials = useStore((s) => s.setRecordOfficials);
  const deleteMatchRecord = useStore((s) => s.deleteMatchRecord);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [umpire, setUmpire] = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const roster = useMemo(() => Object.values(players), [players]);

  useEffect(() => {
    setScoreA(record?.scoreA ?? 0);
    setScoreB(record?.scoreB ?? 0);
    setUmpire(record?.umpire ?? '');
    setRecordedBy(record?.recordedBy ?? '');
    setConfirmDelete(false);
  }, [record?.id, record?.scoreA, record?.scoreB, record?.umpire, record?.recordedBy]);

  if (!record) return null;

  const teamNames = (ids: string[]) =>
    ids.map((id, i) => (
      <span key={id}>
        {i > 0 && <span className="text-muted"> & </span>}
        {players[id] ? <PlayerName player={players[id]} className="text-sm" /> : 'Player'}
      </span>
    ));

  function save() {
    if (!record) return;
    const r = editMatchRecord(record.id, scoreA, scoreB);
    if (r.ok) {
      // Score is the gate (it can fail on a tie); officials never fail, so apply
      // them only once the score change is accepted.
      setRecordOfficials(record.id, { umpire: umpire || null, recordedBy: recordedBy || null });
      toast('success', `Updated to ${Math.max(scoreA, scoreB)}–${Math.min(scoreA, scoreB)}`);
      onClose();
    } else {
      toast('error', r.message);
    }
  }

  function remove() {
    if (!record) return;
    const r = deleteMatchRecord(record.id);
    if (r.ok) {
      toast('info', 'Result deleted');
      onClose();
    } else {
      toast('error', r.message);
    }
  }

  return (
    <Modal open={!!record} onClose={onClose} title="Edit Result">
      <div className="grid grid-cols-2 gap-3">
        <ScoreColumn label="Team A" names={teamNames(record.teamA)} score={scoreA} onChange={setScoreA} tone="pickle" leading={scoreA > scoreB} />
        <ScoreColumn label="Team B" names={teamNames(record.teamB)} score={scoreB} onChange={setScoreB} tone="electric" leading={scoreB > scoreA} />
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Fixing the score replays W/L, streaks and local DUPR-style ratings from history.
      </p>

      <OfficialsPicker
        roster={roster}
        umpire={umpire}
        recordedBy={recordedBy}
        onUmpire={setUmpire}
        onRecordedBy={setRecordedBy}
      />

      <div className="mt-4">
        <PrimaryButton fullWidth onClick={save} icon={<Save className="h-5 w-5" />}>
          Save changes
        </PrimaryButton>
      </div>

      {confirmDelete ? (
        <div className="mt-3 rounded-md border border-serve/40 bg-serve/5 p-3">
          <p className="text-xs text-muted">Delete this result and roll back its W/L? This can’t be undone.</p>
          <div className="mt-2 flex gap-2">
            <PrimaryButton variant="secondary" fullWidth onClick={() => setConfirmDelete(false)}>
              Keep it
            </PrimaryButton>
            <PrimaryButton variant="danger" fullWidth onClick={remove} icon={<Trash2 className="h-4 w-4" />}>
              Delete
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="btn-press mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-glass/50 py-2 text-xs font-bold uppercase tracking-wide text-muted hover:border-serve/50 hover:text-serve"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete this result
        </button>
      )}
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
