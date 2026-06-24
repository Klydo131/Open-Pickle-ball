'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UserPlus,
  Users,
  Swords,
  Trophy,
  Sparkles,
  X,
  ChevronUp,
  Compass,
  HelpCircle,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/hooks/useHydrated';
import { coachProgress, coachTargets, type CoachIcon } from '@/lib/coach';
import { CoachArrow } from './CoachArrow';
import { cn } from '@/lib/utils';

const ICONS: Record<CoachIcon, typeof UserPlus> = {
  UserPlus,
  Users,
  Swords,
  Trophy,
  Sparkles,
};

/**
 * The guided coach: a dynamic, non-gamified onboarding companion.
 *
 * It reads live app state and always surfaces the single most useful next
 * action, so people learn by doing. No XP, no levels — just a friendly nudge
 * that advances as you go and points to Help for the deeper features. Keeps the
 * sporty look: glassy card, speed-streak header, pickle-yellow CTA.
 */
export function CoachGuide() {
  const hydrated = useHydrated();
  const players = useStore((s) => s.players.length);
  const activeMatches = useStore((s) => s.matches.length);
  const recorded = useStore((s) => s.history.length);
  const dismissed = useStore((s) => s.meta.tutorialDismissed);
  const dismissTutorial = useStore((s) => s.dismissTutorial);
  const pathname = usePathname();

  const [open, setOpen] = useState(true);

  if (!hydrated || dismissed) return null;

  const { current, doneCount, total, allDone } = coachProgress({
    players,
    activeMatches,
    recorded,
  });
  const Icon = ICONS[current.icon];
  const onStepPage = pathname === current.href.split('?')[0];

  // While a core step is pending, point an arrow at its on-screen action.
  const targets = allDone ? [] : coachTargets(current);

  const wrap = 'fixed inset-x-0 bottom-[5.25rem] z-40 px-4 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:px-0';

  // -- Collapsed: compact coach pill ------------------------------------------
  if (!open) {
    return (
      <>
        <CoachArrow targets={targets} />
        <div className={cn(wrap, 'flex justify-end')}>
          <button
            onClick={() => setOpen(true)}
            aria-label={`Open coach — step ${Math.min(doneCount + 1, total)} of ${total}`}
            className="btn-press group flex items-center gap-2 rounded-full border border-glass bg-ocean-900/95 px-4 py-2.5 shadow-card backdrop-blur-md"
          >
            <Compass className="h-5 w-5 text-pickle" />
            <span className="font-display text-sm font-bold uppercase tracking-wide text-white">
              {allDone ? 'Coach' : `Next: ${current.title}`}
            </span>
            <ChevronUp className="h-4 w-4 text-muted group-hover:text-white" />
          </button>
        </div>
      </>
    );
  }

  // -- Expanded: the guidance card --------------------------------------------
  return (
    <>
    <CoachArrow targets={targets} />
    <div className={cn(wrap, 'flex justify-center lg:block')}>
      <div
        role="region"
        aria-label="Guided coach"
        className="w-full max-w-md animate-fade-up overflow-hidden rounded-xl border border-glass bg-ocean-900/95 shadow-card backdrop-blur-md lg:w-80"
      >
        {/* header: progress dots + collapse / dismiss */}
        <div className="relative overflow-hidden border-b border-glass/60 px-4 py-3">
          <div className="speed-streak absolute inset-0 opacity-50" aria-hidden />
          <div className="relative flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-pickle" />
              <span className="font-display text-sm font-bold uppercase italic tracking-wide text-white">
                Coach
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1" aria-hidden>
                {Array.from({ length: total }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 w-4 rounded-full transition-colors',
                      i < doneCount ? 'bg-pickle' : 'bg-ocean-800',
                    )}
                  />
                ))}
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Collapse coach"
                className="btn-press rounded-full p-1 text-muted hover:bg-ocean-800 hover:text-white"
              >
                <ChevronUp className="h-4 w-4 rotate-180" />
              </button>
              <button
                onClick={dismissTutorial}
                aria-label="Dismiss coach"
                className="btn-press rounded-full p-1 text-muted hover:bg-ocean-800 hover:text-serve"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* body: the current step */}
        <div className="flex gap-3 p-4">
          <span
            className={cn(
              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              allDone ? 'bg-pickle/15 text-pickle' : 'bg-electric/15 text-electric',
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-white">
              {current.title}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{current.body}</p>
          </div>
        </div>

        {/* footer: contextual CTA + Help */}
        <div className="flex items-center gap-2 border-t border-glass/60 p-3">
          {allDone ? (
            <>
              <Link
                href={current.href}
                onClick={() => setOpen(false)}
                className="btn-press flex flex-1 items-center justify-center gap-2 rounded-md bg-pickle py-2.5 font-display text-sm font-bold uppercase tracking-wide text-ocean-950 hover:shadow-glow"
              >
                <Sparkles className="h-4 w-4" /> {current.cta}
              </Link>
              <button
                onClick={dismissTutorial}
                className="btn-press rounded-md px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-muted hover:text-white"
              >
                Hide
              </button>
            </>
          ) : (
            <>
              <Link
                href={current.href}
                onClick={() => setOpen(false)}
                className="btn-press flex flex-1 items-center justify-center gap-2 rounded-md bg-pickle py-2.5 font-display text-sm font-bold uppercase tracking-wide text-ocean-950 hover:shadow-glow"
              >
                {onStepPage ? "I'm here — show me" : current.cta}
              </Link>
              <Link
                href="/help"
                aria-label="Open Help"
                onClick={() => setOpen(false)}
                className="btn-press flex items-center gap-1.5 rounded-md border border-glass/60 px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-muted hover:border-electric/60 hover:text-white"
              >
                <HelpCircle className="h-4 w-4" /> Help
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
