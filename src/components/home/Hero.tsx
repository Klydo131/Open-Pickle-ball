'use client';

import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { LogoMark } from '@/components/ui/LogoMark';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

/**
 * Hero. Mobile: a tall cinematic poster. Desktop (lg+): a wide two-column
 * landing banner — headline + CTAs on the left, a branded visual panel on the
 * right — so the web build reads like a website, not a stretched phone screen.
 */
export function Hero() {
  return (
    <section className="relative -mx-5 overflow-hidden px-5 pb-6 pt-4 lg:mx-0 lg:rounded-2xl lg:border lg:border-glass/60 lg:px-12 lg:py-14">
      {/* layered sporty background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ocean-900/70 to-ocean-950 lg:bg-gradient-to-r" />
      <div className="speed-streak absolute inset-0 -z-10 opacity-80" aria-hidden />
      <div className="halftone absolute inset-0 -z-10 opacity-40" aria-hidden />

      {/* mobile-only logo (desktop has the sidebar logo) */}
      <div className="flex items-center justify-between lg:hidden">
        <LogoMark />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
        {/* left: copy + CTAs */}
        <div>
          <h1 className="mt-7 font-display text-6xl font-extrabold uppercase italic leading-[0.92] tracking-tight text-stroke-dark lg:mt-0 lg:text-7xl xl:text-8xl">
            <span className="block text-white">Play</span>
            <span className="block text-white">More.</span>
            <span className="block text-pickle">Play</span>
            <span className="block text-serve">Open.</span>
          </h1>

          <p className="mt-4 max-w-md text-sm text-muted lg:text-base">
            Real matches. Real players. Real competition — run your court night from one screen.
          </p>

          <div className="mt-6 space-y-3 lg:flex lg:space-x-4 lg:space-y-0">
            <Link href="/play" className="block lg:inline-block">
              <PrimaryButton
                className="w-full lg:w-auto lg:px-8 lg:py-4 lg:text-lg"
                icon={<Search className="h-5 w-5" />}
              >
                Find a Match
              </PrimaryButton>
            </Link>
            <Link href="/play?create=1" className="block lg:inline-block">
              <PrimaryButton
                variant="secondary"
                className="w-full lg:w-auto lg:px-8 lg:py-4 lg:text-lg"
                icon={<Plus className="h-5 w-5" />}
              >
                Create a Match
              </PrimaryButton>
            </Link>
          </div>
        </div>

        {/* right: branded visual panel (desktop only) */}
        <div className="relative hidden aspect-square items-center justify-center lg:flex">
          <div className="absolute inset-6 rounded-full bg-pickle/10 blur-2xl" aria-hidden />
          <div className="speed-streak absolute inset-0 opacity-90" aria-hidden />
          <HeroBall />
        </div>
      </div>
    </section>
  );
}

/** Large stylised pickleball used as the desktop hero artwork. */
function HeroBall() {
  return (
    <svg viewBox="0 0 320 320" className="relative w-72 max-w-full xl:w-80" aria-hidden>
      <defs>
        <radialGradient id="ball" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#FFE873" />
          <stop offset="60%" stopColor="#FFD626" />
          <stop offset="100%" stopColor="#E0A800" />
        </radialGradient>
      </defs>
      {/* speed streaks */}
      <g stroke="#FF314F" strokeWidth="10" strokeLinecap="round" opacity="0.85">
        <path d="M10 120 L110 108" />
        <path d="M0 160 L96 152" />
        <path d="M14 202 L110 192" />
      </g>
      <circle cx="200" cy="160" r="110" fill="url(#ball)" />
      <circle cx="200" cy="160" r="110" fill="none" stroke="#061B3A" strokeOpacity="0.15" strokeWidth="6" />
      {/* holes */}
      <g fill="#061B3A" fillOpacity="0.5">
        <circle cx="170" cy="108" r="11" />
        <circle cx="232" cy="122" r="11" />
        <circle cx="150" cy="168" r="11" />
        <circle cx="214" cy="186" r="11" />
        <circle cx="196" cy="146" r="11" />
        <circle cx="258" cy="170" r="9" />
      </g>
    </svg>
  );
}
