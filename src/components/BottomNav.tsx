'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Users, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/play', label: 'Play', icon: Swords },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
] as const;

/** Always-visible custom tab bar. Active tab uses the pickle-yellow fill. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-glass/60 bg-ocean-950/95 backdrop-blur-md">
      <div
        className="mx-auto flex max-w-md items-stretch justify-around px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className="group relative flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-pickle" aria-hidden />
              )}
              <Icon
                className={cn(
                  'h-6 w-6 transition-colors',
                  active ? 'text-pickle' : 'text-muted group-hover:text-white',
                )}
              />
              <span
                className={cn(
                  'font-display text-[11px] font-bold uppercase tracking-wide transition-colors',
                  active ? 'text-pickle' : 'text-muted group-hover:text-white',
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
