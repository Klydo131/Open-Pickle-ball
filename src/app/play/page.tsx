'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Swords, Hourglass, FastForward } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SportCard } from '@/components/ui/SportCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { CourtCard } from '@/components/play/CourtCard';
import { WaitingArea } from '@/components/play/WaitingArea';
import { StartMatchModal } from '@/components/play/StartMatchModal';
import { RecordResultModal } from '@/components/play/RecordResultModal';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/hooks/useHydrated';
import { byId } from '@/lib/selectors';
import type { Court, Match } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

type Tab = 'match' | 'waiting';

export default function PlayPage() {
  const hydrated = useHydrated();
  const players = useStore((s) => s.players);
  const courts = useStore((s) => s.courts);
  const matches = useStore((s) => s.matches);
  const waitingQueue = useStore((s) => s.waitingQueue);
  const addCourt = useStore((s) => s.addCourt);
  const autoRotate = useStore((s) => s.meta.autoRotate);
  const setAutoRotate = useStore((s) => s.setAutoRotate);

  const [tab, setTab] = useState<Tab>('match');
  const [startCourt, setStartCourt] = useState<Court | null>(null);
  const [recordMatch, setRecordMatch] = useState<Match | null>(null);

  const playerMap = useMemo(() => byId(players), [players]);
  const matchByCourt = useMemo(() => {
    const map: Record<string, Match> = {};
    for (const m of matches) map[m.courtId] = m;
    return map;
  }, [matches]);

  // Respond to deep links from the home screen (?create=1 / #waiting).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash === '#waiting') setTab('waiting');
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === '1') {
      const open = courts.find((c) => c.status === 'open');
      if (open) setStartCourt(open);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function nextCourtName(): string {
    let max = 0;
    for (const c of courts) {
      const m = /Court\s+(\d+)/i.exec(c.name);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return `Court ${Math.max(max + 1, courts.length + 1)}`;
  }

  const activeCount = matches.length;
  const openCount = courts.filter((c) => c.status === 'open').length;

  return (
    <div className="pt-4">
      <PageHeader
        title="Play"
        subtitle={hydrated ? `${activeCount} live · ${openCount} open · ${waitingQueue.length} waiting` : 'Match area & waiting area'}
        action={
          <button
            onClick={() => addCourt(nextCourtName())}
            className="btn-press flex items-center gap-1.5 rounded-md border border-glass bg-ocean-900/60 px-3 py-2 font-display text-sm font-bold uppercase tracking-wide text-white hover:border-electric/70"
          >
            <Plus className="h-4 w-4" /> Court
          </button>
        }
      />

      {/* segmented control */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-md border border-glass/60 bg-ocean-950/60 p-1 lg:max-w-md">
        <SegBtn active={tab === 'match'} onClick={() => setTab('match')} icon={<Swords className="h-4 w-4" />}>
          Match Area
        </SegBtn>
        <SegBtn active={tab === 'waiting'} onClick={() => setTab('waiting')} icon={<Hourglass className="h-4 w-4" />}>
          Waiting {hydrated && waitingQueue.length > 0 ? `(${waitingQueue.length})` : ''}
        </SegBtn>
      </div>

      {!hydrated ? null : tab === 'match' ? (
        courts.length === 0 ? (
          <EmptyState
            icon={<Swords className="h-9 w-9" />}
            title="No courts yet"
            message="Add a court to start hosting matches."
          />
        ) : (
          <div className="space-y-3">
            {/* Auto-rotate toggle */}
            <button
              onClick={() => {
                setAutoRotate(!autoRotate);
                toast('info', autoRotate ? 'Auto-rotate off' : 'Auto-rotate on — freed courts fill from the queue');
              }}
              aria-pressed={autoRotate}
              className="flex w-full items-center justify-between rounded-md border border-glass/60 bg-ocean-950/40 px-4 py-2.5 lg:max-w-md"
            >
              <span className="flex items-center gap-2 text-left">
                <FastForward className={cn('h-4 w-4', autoRotate ? 'text-electric' : 'text-muted')} />
                <span>
                  <span className="block font-display text-sm font-bold uppercase tracking-wide text-white">
                    Auto-rotate queue
                  </span>
                  <span className="block text-[11px] text-muted">Freed courts fill from the waiting area</span>
                </span>
              </span>
              <span
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  autoRotate ? 'bg-electric' : 'bg-ocean-800',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                    autoRotate ? 'translate-x-[22px]' : 'translate-x-0.5',
                  )}
                />
              </span>
            </button>

            <div className="grid gap-3 lg:grid-cols-2">
              {courts.map((court) => (
                <CourtCard
                  key={court.id}
                  court={court}
                  match={matchByCourt[court.id]}
                  players={playerMap}
                  onStart={setStartCourt}
                  onRecord={setRecordMatch}
                />
              ))}
            </div>
            <SportCard className="p-3">
              <button
                onClick={() => addCourt(nextCourtName())}
                className="btn-press flex w-full items-center justify-center gap-2 py-2 font-display text-sm font-bold uppercase tracking-wide text-muted hover:text-pickle"
              >
                <Plus className="h-4 w-4" /> Add another court
              </button>
            </SportCard>
          </div>
        )
      ) : (
        <div id="waiting">
          <WaitingArea queue={waitingQueue} players={playerMap} />
        </div>
      )}

      <StartMatchModal court={startCourt} onClose={() => setStartCourt(null)} />
      <RecordResultModal match={recordMatch} players={playerMap} onClose={() => setRecordMatch(null)} />
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'btn-press flex items-center justify-center gap-2 rounded py-2.5 font-display text-sm font-bold uppercase tracking-wide transition-colors',
        active ? 'bg-pickle text-ocean-950' : 'text-muted hover:text-white',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
