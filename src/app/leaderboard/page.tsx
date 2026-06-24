'use client';

import { useMemo, useState } from 'react';
import { Trophy, Medal, History, RotateCcw, Crown, Swords, Clock, Pencil, Download, Gavel, ClipboardCheck, Database } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SportCard } from '@/components/ui/SportCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { PlayerChip, PlayerName } from '@/components/players/PlayerName';
import { StreakBadge } from '@/components/players/StreakBadge';
import { HeadToHeadModal } from '@/components/match/HeadToHeadModal';
import { EditResultModal } from '@/components/records/EditResultModal';
import { ExportRecordsModal } from '@/components/records/ExportRecordsModal';
import { BackupRestoreModal } from '@/components/records/BackupRestoreModal';
import { RecordsPrintSheet } from '@/components/records/RecordsPrintSheet';
import type { MatchRecord } from '@/lib/types';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/hooks/useHydrated';
import { rankPlayers, byId } from '@/lib/selectors';
import { winRate, formatDurationShort } from '@/lib/utils';

const medalColor = ['text-pickle', 'text-slate-300', 'text-amber-600'];

export default function LeaderboardPage() {
  const hydrated = useHydrated();
  const players = useStore((s) => s.players);
  const history = useStore((s) => s.history);
  const resetAll = useStore((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);
  const [h2hOpen, setH2hOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MatchRecord | null>(null);

  const ranked = useMemo(() => rankPlayers(players).filter((p) => p.wins + p.losses > 0), [players]);
  const playerMap = useMemo(() => byId(players), [players]);
  const hasRecords = history.length > 0;

  return (
    <div className="pt-4">
      <PageHeader
        title="Ranks"
        subtitle="Wins, losses & match history"
        action={
          hydrated ? (
            <div className="flex items-center gap-2">
              {hasRecords && (
                <PrimaryButton variant="secondary" onClick={() => setExportOpen(true)} icon={<Download className="h-5 w-5" />}>
                  Export
                </PrimaryButton>
              )}
              {players.length >= 2 && (
                <PrimaryButton variant="secondary" onClick={() => setH2hOpen(true)} icon={<Swords className="h-5 w-5" />}>
                  H2H
                </PrimaryButton>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-6">
      {/* Leaderboard */}
      <section>
        <SectionHeader title="Leaderboard" />
        {!hydrated ? null : ranked.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-9 w-9" />}
            title="No records yet"
            message="Play and record a match to climb the board."
          />
        ) : (
          <div className="space-y-2">
            {ranked.map((p, i) => (
              <SportCard key={p.id} accent={i === 0} className="flex items-center gap-3 p-3">
                <div className="flex w-7 shrink-0 justify-center">
                  {i < 3 ? (
                    i === 0 ? (
                      <Crown className={`h-6 w-6 ${medalColor[0]}`} />
                    ) : (
                      <Medal className={`h-5 w-5 ${medalColor[i]}`} />
                    )
                  ) : (
                    <span className="font-display text-base font-bold text-muted">{i + 1}</span>
                  )}
                </div>
                <PlayerChip player={p} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <PlayerName player={p} className="truncate text-lg" />
                    <StreakBadge streak={p.streak} />
                  </div>
                  <div className="text-xs text-muted">{winRate(p.wins, p.losses)}% win rate</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-bold leading-none text-white">
                    <span className="text-emerald-400">{p.wins}</span>
                    <span className="mx-1 text-muted/50">-</span>
                    <span className="text-serve">{p.losses}</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted">W · L</div>
                </div>
              </SportCard>
            ))}
          </div>
        )}
      </section>

      {/* Recent results */}
      <section className="mt-8 lg:mt-0">
        <SectionHeader title="Recent Results" />
        {!hydrated ? null : history.length === 0 ? (
          <SportCard className="flex items-center gap-3 p-4 text-sm text-muted" halftone>
            <History className="h-5 w-5 text-electric" />
            Completed matches will show up here.
          </SportCard>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 12).map((m) => {
              const winners = m.winner === 'A' ? m.teamA : m.teamB;
              const losers = m.winner === 'A' ? m.teamB : m.teamA;
              const ws = Math.max(m.scoreA, m.scoreB);
              const ls = Math.min(m.scoreA, m.scoreB);
              return (
                <SportCard key={m.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 text-sm">
                      <Trophy className="h-4 w-4 shrink-0 text-pickle" />
                      {winners.map((id, idx) => (
                        <span key={id} className="truncate">
                          {idx > 0 && <span className="text-muted">&amp;</span>}{' '}
                          {playerMap[id] ? <PlayerName player={playerMap[id]} className="text-sm" /> : 'Player'}
                        </span>
                      ))}
                      <span className="text-muted">def.</span>
                      {losers.map((id, idx) => (
                        <span key={id} className="truncate text-muted">
                          {idx > 0 && '& '}
                          {playerMap[id]?.name ?? 'Player'}
                        </span>
                      ))}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex flex-col items-end">
                        <span className="font-display text-base font-bold text-white">
                          {ws}<span className="text-muted/50">–</span>{ls}
                        </span>
                        {m.completedAt > m.startedAt && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDurationShort(m.completedAt - m.startedAt)}
                          </span>
                        )}
                      </div>
                      <button
                        aria-label="Edit this result"
                        onClick={() => setEditRecord(m)}
                        className="btn-press rounded-md border border-glass/60 p-2 text-muted hover:border-pickle/60 hover:text-pickle"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {(m.umpire || m.recordedBy) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-glass/30 pt-1.5 text-[11px] text-muted">
                      {m.umpire && (
                        <span className="flex items-center gap-1">
                          <Gavel className="h-3 w-3 text-electric" /> Umpire:{' '}
                          <b className="text-white/80">{playerMap[m.umpire]?.name ?? 'Player'}</b>
                        </span>
                      )}
                      {m.recordedBy && (
                        <span className="flex items-center gap-1">
                          <ClipboardCheck className="h-3 w-3 text-pickle" /> Recorded by:{' '}
                          <b className="text-white/80">{playerMap[m.recordedBy]?.name ?? 'Player'}</b>
                        </span>
                      )}
                    </div>
                  )}
                </SportCard>
              );
            })}
          </div>
        )}
      </section>
      </div>

      {/* Data management */}
      <section className="mt-10 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setBackupOpen(true)}
          className="btn-press flex items-center gap-2 rounded-md border border-glass/50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted hover:border-electric/60 hover:text-white"
        >
          <Database className="h-3.5 w-3.5" /> Back up / Restore
        </button>
        <button
          onClick={() => setConfirmReset(true)}
          className="btn-press flex items-center gap-2 rounded-md border border-glass/50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted hover:border-serve/50 hover:text-serve"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset session data
        </button>
      </section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset everything?">
        <p className="text-sm text-muted">
          This permanently clears all players, matches, records and the waiting queue from this
          device. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <PrimaryButton variant="secondary" fullWidth onClick={() => setConfirmReset(false)}>
            Cancel
          </PrimaryButton>
          <PrimaryButton
            variant="danger"
            fullWidth
            onClick={() => {
              resetAll();
              setConfirmReset(false);
            }}
          >
            Reset
          </PrimaryButton>
        </div>
      </Modal>

      <HeadToHeadModal
        open={h2hOpen}
        onClose={() => setH2hOpen(false)}
        players={players}
        history={history}
      />

      <EditResultModal record={editRecord} players={playerMap} onClose={() => setEditRecord(null)} />
      <ExportRecordsModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        players={players}
        history={history}
      />
      <BackupRestoreModal open={backupOpen} onClose={() => setBackupOpen(false)} />

      {/* Hidden on screen; rendered for the print / Save-as-PDF path. */}
      <RecordsPrintSheet players={players} history={history} />
    </div>
  );
}
