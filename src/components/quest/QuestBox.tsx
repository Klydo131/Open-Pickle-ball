'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Palette,
  Users,
  Swords,
  Trophy,
  Hourglass,
  Check,
  X,
  ChevronDown,
  Sparkles,
  Rocket,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/hooks/useHydrated';
import { QUESTS, TOTAL_QUEST_XP, levelForXp, type QuestDef } from '@/lib/quests';
import { burstConfetti } from '@/lib/confetti';
import { cn } from '@/lib/utils';

const ICONS = { UserPlus, Palette, Users, Swords, Trophy, Hourglass } as const;

/**
 * Gamified onboarding. A floating widget that teaches the core loop: it tracks
 * real progress (the store latches each quest as it's done), shows XP + level,
 * and celebrates completion with confetti. Collapses to a progress-ring FAB and
 * can be dismissed (re-openable from Help → Restart tutorial).
 */
export function QuestBox() {
  const hydrated = useHydrated();
  const questsDone = useStore((s) => s.meta.questsDone);
  const tutorialDismissed = useStore((s) => s.meta.tutorialDismissed);
  const dismissTutorial = useStore((s) => s.dismissTutorial);

  // Expanded by default on desktop (room to spare); collapsed to a pulsing FAB
  // on mobile so it never covers the screen on first load.
  const [open, setOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024,
  );
  const celebrated = useRef(false);

  const doneSet = new Set(questsDone);
  const doneCount = QUESTS.filter((q) => doneSet.has(q.id)).length;
  const total = QUESTS.length;
  const xp = QUESTS.reduce((sum, q) => (doneSet.has(q.id) ? sum + q.xp : sum), 0);
  const pct = Math.round((doneCount / total) * 100);
  const level = levelForXp(xp);
  const allDone = doneCount === total;
  const nextQuest = QUESTS.find((q) => !doneSet.has(q.id));

  useEffect(() => {
    if (hydrated && allDone && !celebrated.current) {
      celebrated.current = true;
      burstConfetti(150);
    }
  }, [hydrated, allDone]);

  if (!hydrated || tutorialDismissed) return null;

  const wrap = 'fixed right-4 bottom-24 z-40 lg:bottom-6 lg:right-6';

  // -- Collapsed: progress-ring FAB -------------------------------------------
  if (!open) {
    const r = 20;
    const c = 2 * Math.PI * r;
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={`Open quest log — ${doneCount} of ${total} done`}
        className={cn(
          wrap,
          'group flex h-16 w-16 items-center justify-center rounded-full border border-glass bg-ocean-900 shadow-card btn-press',
          !allDone && 'animate-pulse-glow',
        )}
      >
        <svg className="absolute h-16 w-16 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r={r} fill="none" stroke="#2E4A78" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r={r}
            fill="none"
            stroke="#FFD626"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct / 100)}
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        {allDone ? (
          <Trophy className="h-6 w-6 text-pickle" />
        ) : (
          <span className="font-display text-sm font-bold text-white">
            {doneCount}/{total}
          </span>
        )}
      </button>
    );
  }

  // -- Expanded: quest panel ---------------------------------------------------
  return (
    <div
      className={cn(
        wrap,
        'w-[calc(100vw-2rem)] max-w-sm animate-fade-up overflow-hidden rounded-xl border border-glass bg-ocean-900/95 shadow-card backdrop-blur-md',
      )}
      role="dialog"
      aria-label="Quest log"
    >
      {/* header */}
      <div className="relative overflow-hidden border-b border-glass/60 p-4">
        <div className="speed-streak absolute inset-0 opacity-60" aria-hidden />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-pickle" />
              <h2 className="font-display text-base font-bold uppercase italic tracking-wide text-white">
                Quest Log
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {allDone ? 'Tutorial complete — nice!' : 'Learn the app, earn XP'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setOpen(false)}
              aria-label="Collapse"
              className="btn-press rounded-full p-1.5 text-muted hover:bg-ocean-800 hover:text-white"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              onClick={dismissTutorial}
              aria-label="Dismiss tutorial"
              className="btn-press rounded-full p-1.5 text-muted hover:bg-ocean-800 hover:text-serve"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* level + progress */}
        <div className="relative mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide">
            <span className="flex items-center gap-1 text-pickle">
              <Sparkles className="h-3 w-3" /> {level.name}
            </span>
            <span className="text-muted">
              {xp}/{TOTAL_QUEST_XP} XP
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ocean-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pickle to-serve transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* quest list */}
      <ul className="max-h-[44vh] divide-y divide-glass/40 overflow-y-auto">
        {QUESTS.map((q) => (
          <QuestRow
            key={q.id}
            quest={q}
            done={doneSet.has(q.id)}
            isNext={!allDone && nextQuest?.id === q.id}
            onGo={() => setOpen(false)}
          />
        ))}
      </ul>

      {/* footer */}
      <div className="border-t border-glass/60 p-3">
        {allDone ? (
          <button
            onClick={dismissTutorial}
            className="btn-press flex w-full items-center justify-center gap-2 rounded-md bg-pickle py-2.5 font-display text-sm font-bold uppercase tracking-wide text-ocean-950 hover:shadow-glow"
          >
            <Trophy className="h-4 w-4" /> Claim &amp; close
          </button>
        ) : (
          <button
            onClick={dismissTutorial}
            className="btn-press w-full rounded-md py-1.5 text-center text-xs font-bold uppercase tracking-wide text-muted hover:text-white"
          >
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  );
}

function QuestRow({
  quest,
  done,
  isNext,
  onGo,
}: {
  quest: QuestDef;
  done: boolean;
  isNext: boolean;
  onGo: () => void;
}) {
  const Icon = ICONS[quest.icon];
  return (
    <li
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        isNext && 'bg-pickle/5',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          done ? 'bg-emerald-400/15 text-emerald-400' : 'bg-ocean-800 text-muted',
        )}
      >
        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate font-display text-sm font-bold tracking-wide',
            done ? 'text-muted line-through' : 'text-white',
          )}
        >
          {quest.title}
        </p>
        {!done && <p className="truncate text-[11px] text-muted">{quest.hint}</p>}
      </div>
      {done ? (
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          +{quest.xp}
        </span>
      ) : isNext ? (
        <Link
          href={quest.href}
          onClick={onGo}
          className="btn-press shrink-0 rounded-md bg-pickle px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide text-ocean-950 hover:shadow-glow"
        >
          Go
        </Link>
      ) : (
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted/50">
          +{quest.xp}
        </span>
      )}
    </li>
  );
}
