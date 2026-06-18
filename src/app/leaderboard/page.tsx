'use client';

import { useMemo, useState } from 'react';
import { Trophy, Medal, History, RotateCcw, Crown } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SportCard } from '@/components/ui/SportCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { PlayerChip, PlayerName } from '@/components/players/PlayerName';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/hooks/useHydrated';
import { rankPlayers, byId } from '@/lib/selectors';
import { winRate } from '@/lib/utils';

const medalColor = ['text-pickle', 'text-slate-300', 'text-amber-600'];

export default function LeaderboardPage() {
  const hydrated = useHydrated();
  const players = useStore((s) => s.players);
  const history = useStore((s) => s.history);
  const resetAll = useStore((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);

  const ranked = useMemo(() => rankPlayers(players).filter((p) => p.wins + p.losses > 0), [players]);
  const playerMap = useMemo(() => byId(players), [players]);

  return (
    <div className="pt-4">
      <PageHeader title="Ranks" subtitle="Wins, losses & match history" />

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
                  <PlayerName player={p} className="block truncate text-lg" />
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
      <section className="mt-8">
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
                    <span className="shrink-0 font-display text-base font-bold text-white">
                      {ws}<span className="text-muted/50">–</span>{ls}
                    </span>
                  </div>
                </SportCard>
              );
            })}
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section className="mt-10">
        <button
          onClick={() => setConfirmReset(true)}
          className="btn-press mx-auto flex items-center gap-2 rounded-md border border-glass/50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted hover:border-serve/50 hover:text-serve"
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
    </div>
  );
}
