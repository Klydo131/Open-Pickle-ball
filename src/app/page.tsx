'use client';

import Link from 'next/link';
import { Swords, Users, BarChart3, Hourglass, Trophy } from 'lucide-react';
import { Hero } from '@/components/home/Hero';
import { ModeGrid } from '@/components/home/ModeGrid';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatsStrip } from '@/components/ui/StatsStrip';
import { SportCard } from '@/components/ui/SportCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MatchCard } from '@/components/match/MatchCard';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/hooks/useHydrated';
import { byId } from '@/lib/selectors';

export default function HomePage() {
  const hydrated = useHydrated();
  const players = useStore((s) => s.players);
  const courts = useStore((s) => s.courts);
  const matches = useStore((s) => s.matches);
  const history = useStore((s) => s.history);
  const waitingQueue = useStore((s) => s.waitingQueue);

  const playerMap = byId(players);
  const courtMap = byId(courts);
  const featured = matches[0];

  return (
    <div>
      <Hero />

      {/* Live now */}
      <section className="mt-8">
        <SectionHeader title="Live Now" action={{ label: 'View all', href: '/play' }} />
        {hydrated && featured ? (
          <MatchCard match={featured} court={courtMap[featured.courtId]} players={playerMap} />
        ) : (
          <SportCard className="flex items-center justify-between p-4" halftone>
            <div>
              <p className="font-display text-lg font-bold uppercase tracking-wide text-white">
                No match on court
              </p>
              <p className="text-sm text-muted">Fire one up and start the session.</p>
            </div>
            <Link href="/play?create=1">
              <PrimaryButton icon={<Swords className="h-5 w-5" />}>Start</PrimaryButton>
            </Link>
          </SportCard>
        )}
      </section>

      {/* Discovery grid */}
      <section className="mt-8">
        <SectionHeader title="Find a Match" />
        <ModeGrid />
      </section>

      {/* Stats */}
      <section className="mt-8">
        <SectionHeader title="Your Session" action={{ label: 'Ranks', href: '/leaderboard' }} />
        <StatsStrip
          stats={[
            { icon: <Users className="h-5 w-5 text-pickle" />, value: hydrated ? players.length : '—', label: 'Players' },
            { icon: <BarChart3 className="h-5 w-5 text-electric" />, value: hydrated ? history.length : '—', label: 'Matches' },
            { icon: <Trophy className="h-5 w-5 text-serve" />, value: hydrated ? matches.length : '—', label: 'On Court' },
            { icon: <Hourglass className="h-5 w-5 text-pickle" />, value: hydrated ? waitingQueue.length : '—', label: 'Waiting' },
          ]}
        />
      </section>
    </div>
  );
}
