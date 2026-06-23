'use client';

import { Play, Trophy, X, Trash2, FastForward } from 'lucide-react';
import type { Court, Match, Player } from '@/lib/types';
import { SportCard } from '@/components/ui/SportCard';
import { MatchCard } from '@/components/match/MatchCard';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast';

interface Props {
  court: Court;
  match?: Match;
  players: Record<string, Player>;
  onStart: (court: Court) => void;
  onRecord: (match: Match) => void;
}

/** A single court: either an open slot (start a match) or a live match. */
export function CourtCard({ court, match, players, onStart, onRecord }: Props) {
  const cancelMatch = useStore((s) => s.cancelMatch);
  const removeCourt = useStore((s) => s.removeCourt);
  const startNextFromQueue = useStore((s) => s.startNextFromQueue);
  const queueCount = useStore((s) => s.waitingQueue.length);

  if (court.status === 'in_progress' && match) {
    return (
      <MatchCard
        match={match}
        court={court}
        players={players}
        actions={
          <div className="flex gap-2">
            <button
              data-coach="record-result"
              onClick={() => onRecord(match)}
              className="btn-press flex flex-1 items-center justify-center gap-2 rounded-md bg-pickle py-2.5 font-display text-sm font-bold uppercase tracking-wide text-ocean-950 hover:shadow-glow"
            >
              <Trophy className="h-4 w-4" /> Record Result
            </button>
            <button
              onClick={() => {
                cancelMatch(match.id);
                toast('info', `${court.name} cleared`);
              }}
              aria-label="Cancel match"
              className="btn-press rounded-md border border-glass/60 px-3 text-muted hover:border-serve/60 hover:text-serve"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        }
      />
    );
  }

  return (
    <SportCard className="flex items-center justify-between p-4" halftone>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold uppercase tracking-wide text-white">
            {court.name}
          </span>
          <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
            Open
          </span>
        </div>
        <p className="text-xs text-muted">
          {queueCount >= 2 ? `${queueCount} waiting — rotate them on` : 'Ready for the next match'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label={`Remove ${court.name}`}
          onClick={() => {
            const r = removeCourt(court.id);
            if (!r.ok) toast('error', r.message);
          }}
          className="btn-press rounded-md border border-glass/60 p-2 text-muted hover:border-serve/60 hover:text-serve"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {queueCount >= 2 && (
          <button
            onClick={() => {
              const r = startNextFromQueue(court.id);
              if (r.ok) toast('success', `Next up on ${court.name}`);
              else toast('error', r.message);
            }}
            className="btn-press flex items-center gap-2 rounded-md border border-electric/60 px-3 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-electric hover:bg-electric/10"
          >
            <FastForward className="h-4 w-4" /> Next Up
          </button>
        )}
        <button
          data-coach="start-match"
          onClick={() => onStart(court)}
          className="btn-press flex items-center gap-2 rounded-md bg-pickle px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-ocean-950 hover:shadow-glow"
        >
          <Play className="h-4 w-4" /> Start
        </button>
      </div>
    </SportCard>
  );
}
