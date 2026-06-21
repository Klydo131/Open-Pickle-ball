'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Users, Trophy, HelpCircle } from 'lucide-react';
import { LogoMark } from './ui/LogoMark';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/play', label: 'Play', icon: Swords },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
] as const;

/**
 * Desktop-only left sidebar navigation. Hidden on mobile (which uses the
 * bottom tab bar). Turns the wide desktop canvas into a real web-app shell.
 */
export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-glass/60 bg-ocean-950/95 backdrop-blur-md lg:flex">
      <div className="px-6 py-7">
        <Link href="/" aria-label="Open Pickleball home">
          <LogoMark />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-md px-3 py-3 font-display text-sm font-bold uppercase tracking-wide transition-colors',
                active
                  ? 'bg-pickle/10 text-pickle'
                  : 'text-muted hover:bg-ocean-900/60 hover:text-white',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-pickle" aria-hidden />
              )}
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-2">
        <Link
          href="/help"
          aria-current={pathname.startsWith('/help') ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-3 font-display text-sm font-bold uppercase tracking-wide transition-colors',
            pathname.startsWith('/help')
              ? 'bg-pickle/10 text-pickle'
              : 'text-muted hover:bg-ocean-900/60 hover:text-white',
          )}
        >
          <HelpCircle className="h-5 w-5" />
          Help
        </Link>
      </div>

      <div className="border-t border-glass/50 px-6 py-5">
        <p className="font-display text-xs font-bold uppercase tracking-wide text-muted">
          Local-first · v1
        </p>
        <p className="mt-1 text-[11px] text-muted/70">Play More. Play Open.</p>
      </div>
    </aside>
  );
}
