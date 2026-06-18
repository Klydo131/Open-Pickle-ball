'use client';

import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { LogoMark } from '@/components/ui/LogoMark';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

/**
 * Cinematic hero: "PLAY MORE. PLAY OPEN." with diagonal red speed streaks and
 * court-line geometry behind athletic typography. The two CTAs drive the core
 * loop: find a court / create a match.
 */
export function Hero() {
  return (
    <section className="relative -mx-5 overflow-hidden px-5 pb-6 pt-4">
      {/* layered sporty background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ocean-900/70 to-ocean-950" />
      <div className="speed-streak absolute inset-0 -z-10 opacity-80" aria-hidden />
      <div className="halftone absolute inset-0 -z-10 opacity-40" aria-hidden />

      <div className="flex items-center justify-between">
        <LogoMark />
      </div>

      <h1 className="mt-7 font-display text-6xl font-extrabold uppercase italic leading-[0.92] tracking-tight text-stroke-dark">
        <span className="block text-white">Play</span>
        <span className="block text-white">More.</span>
        <span className="block text-pickle">Play</span>
        <span className="block text-serve">Open.</span>
      </h1>

      <p className="mt-4 max-w-xs text-sm text-muted">
        Real matches. Real players. Real competition — run your court night from one screen.
      </p>

      <div className="mt-6 space-y-3">
        <Link href="/play" className="block">
          <PrimaryButton fullWidth icon={<Search className="h-5 w-5" />}>
            Find a Match
          </PrimaryButton>
        </Link>
        <Link href="/play?create=1" className="block">
          <PrimaryButton fullWidth variant="secondary" icon={<Plus className="h-5 w-5" />}>
            Create a Match
          </PrimaryButton>
        </Link>
      </div>
    </section>
  );
}
