'use client';

import Link from 'next/link';
import {
  Users,
  Swords,
  Hourglass,
  Palette,
  Trophy,
  Flame,
  ShieldCheck,
  WifiOff,
  RotateCcw,
  Rocket,
  ChevronRight,
  FastForward,
  Clock,
  Cloud,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SportCard } from '@/components/ui/SportCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast';

const features = [
  {
    icon: Users,
    color: 'text-pickle',
    title: 'Players',
    body: 'Add everyone playing tonight to a local roster. Names live on this device — no account, no sign-up. Each player tracks wins, losses and win streaks.',
    href: '/players',
  },
  {
    icon: Palette,
    color: 'text-electric',
    title: 'Name themes',
    body: 'Tap the palette on any player to give their name a gradient theme — Pickle Bolt, Serve Fire, Electric Ace and more. It shows everywhere their name appears.',
    href: '/players',
  },
  {
    icon: Swords,
    color: 'text-serve',
    title: 'Match area',
    body: 'Each court is Open or Live. Tap Start on an open court, choose singles or doubles, pick the players per side, and play. A court can never be double-booked.',
    href: '/play',
  },
  {
    icon: Hourglass,
    color: 'text-electric',
    title: 'Waiting area',
    body: 'When courts are full, send players to the waiting area. It is a first-in, first-out queue, and those players are suggested first when you start the next match.',
    href: '/play#waiting',
  },
  {
    icon: Trophy,
    color: 'text-pickle',
    title: 'Records & ranks',
    body: 'Recording a result updates every player’s W/L and win-rate, frees the court, and adds to the leaderboard and recent-results history.',
    href: '/leaderboard',
  },
  {
    icon: Flame,
    color: 'text-serve',
    title: 'Win streaks',
    body: 'Back-to-back wins build a streak — a flame badge appears at 2+ and turns red when a player is on fire (3+). A loss resets it.',
    href: '/leaderboard',
  },
  {
    icon: FastForward,
    color: 'text-electric',
    title: 'Auto-rotate',
    body: 'Toggle auto-rotate on the Play tab and freed courts fill themselves from the front of the waiting queue. Or tap “Next Up” on any open court to rotate them on manually.',
    href: '/play',
  },
  {
    icon: Clock,
    color: 'text-pickle',
    title: 'Match timers',
    body: 'Every live match shows a running clock, and completed games record how long they took — visible in recent results and head-to-head.',
    href: '/play',
  },
  {
    icon: Swords,
    color: 'text-serve',
    title: 'Head-to-head',
    body: 'On Ranks, tap H2H to compare any two players’ record against each other as opponents, including their last meeting.',
    href: '/leaderboard',
  },
  {
    icon: Cloud,
    color: 'text-electric',
    title: 'Cross-device sync',
    body: 'Optional. Tap the cloud icon to start a session, get a code, and share it — every phone and laptop on that code stays live in sync. No account needed. Off by default; the app works fully offline.',
    href: '/',
  },
];

const steps = [
  'Add at least four players on the Players tab.',
  'Give a couple of them name themes (tap the palette).',
  'Go to Play → Start on an open court.',
  'Pick singles or doubles, then assign players to Team A and Team B.',
  'When the game ends, tap Record Result and enter the final score.',
  'Extra players? Send them to the Waiting area to hold their spot.',
];

const faqs = [
  {
    q: 'Where is my data stored?',
    a: 'Entirely in this browser (localStorage). Nothing is uploaded. Clearing your browser data — or using another device — starts fresh.',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes. It is an installable PWA; once loaded, the app shell is cached and everything runs without a connection.',
  },
  {
    q: 'Why can’t I remove a player or court?',
    a: 'Players and courts that are in a live match are locked. Finish or cancel the match first.',
  },
  {
    q: 'Can scores be a tie?',
    a: 'No — pickleball games have a winner, so equal scores are rejected when recording a result.',
  },
  {
    q: 'What does auto-rotate do?',
    a: 'When enabled (Play tab), finishing or cancelling a match instantly starts the next one on that court using the players waiting at the front of the queue — doubles if four are waiting, otherwise singles.',
  },
  {
    q: 'Is my data private with sync?',
    a: 'Sync is optional and off by default. When on, only player names and scores are shared, protected by the session code (treat it like a share link). No account, no email, no tracking. Stop syncing anytime to disconnect this device.',
  },
];

export default function HelpPage() {
  const restartTutorial = useStore((s) => s.restartTutorial);

  return (
    <div className="pt-4">
      <PageHeader title="Help" subtitle="How Open Pickleball works" />

      {/* Quick intro */}
      <SportCard className="mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" halftone>
        <div className="flex items-start gap-3">
          <Rocket className="mt-0.5 h-6 w-6 shrink-0 text-pickle" />
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
              New here? Run the quest tutorial
            </h2>
            <p className="mt-1 text-sm text-muted">
              A guided checklist walks you through the whole flow and earns XP as you go.
            </p>
          </div>
        </div>
        <PrimaryButton
          className="shrink-0"
          icon={<Rocket className="h-5 w-5" />}
          onClick={() => {
            restartTutorial();
            toast('info', 'Quest tutorial reopened');
          }}
        >
          Start tutorial
        </PrimaryButton>
      </SportCard>

      {/* Features */}
      <section className="mb-8">
        <SectionHeader title="Features" />
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <Link key={f.title} href={f.href}>
              <SportCard className="group h-full p-4 transition-transform hover:-translate-y-0.5">
                <f.icon className={`mb-2 h-6 w-6 ${f.color}`} />
                <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{f.body}</p>
                <span className="mt-2 inline-flex items-center text-xs font-bold uppercase tracking-wide text-electric">
                  Open <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </SportCard>
            </Link>
          ))}
        </div>
      </section>

      {/* How to run a court night */}
      <section className="mb-8">
        <SectionHeader title="Run a court night" />
        <SportCard className="p-5">
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pickle font-display text-sm font-bold text-ocean-950">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm text-white">{step}</span>
              </li>
            ))}
          </ol>
        </SportCard>
      </section>

      {/* Trust badges */}
      <section className="mb-8">
        <SectionHeader title="Private by design" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: 'No account', d: 'No login, no email, no tracking.' },
            { icon: WifiOff, t: 'Works offline', d: 'Installable PWA, cached shell.' },
            { icon: RotateCcw, t: 'You’re in control', d: 'Reset all data anytime from Ranks.' },
          ].map((b) => (
            <SportCard key={b.t} className="flex items-center gap-3 p-4">
              <b.icon className="h-6 w-6 shrink-0 text-electric" />
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
                  {b.t}
                </p>
                <p className="text-xs text-muted">{b.d}</p>
              </div>
            </SportCard>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-4">
        <SectionHeader title="FAQ" />
        <div className="space-y-2">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="sport-card group p-4 [&_summary]:cursor-pointer"
            >
              <summary className="flex items-center justify-between font-display text-sm font-bold uppercase tracking-wide text-white marker:content-none">
                {f.q}
                <ChevronRight className="h-4 w-4 text-muted transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
