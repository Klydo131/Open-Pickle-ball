import Link from 'next/link';
import { Swords, Hourglass, Users, Trophy } from 'lucide-react';
import { SportCard } from '@/components/ui/SportCard';

const modes = [
  {
    href: '/play',
    title: 'Match Area',
    sub: 'Courts in play',
    icon: Swords,
    color: 'text-pickle',
    underline: 'bg-pickle',
  },
  {
    href: '/play#waiting',
    title: 'Waiting Area',
    sub: 'Next up queue',
    icon: Hourglass,
    color: 'text-electric',
    underline: 'bg-electric',
  },
  {
    href: '/players',
    title: 'Players',
    sub: 'Roster & themes',
    icon: Users,
    color: 'text-white',
    underline: 'bg-serve',
  },
  {
    href: '/leaderboard',
    title: 'Ranks',
    sub: 'Wins & records',
    icon: Trophy,
    color: 'text-pickle',
    underline: 'bg-pickle',
  },
] as const;

/** Fast routes to filtered modes — the home discovery grid. */
export function ModeGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {modes.map(({ href, title, sub, icon: Icon, color, underline }) => (
        <Link key={title} href={href}>
          <SportCard className="btn-press h-full p-4" halftone>
            <Icon className={`mb-3 h-7 w-7 ${color}`} />
            <div className="font-display text-base font-bold uppercase tracking-wide text-white">
              {title}
            </div>
            <div className="text-xs text-muted">{sub}</div>
            <div className={`mt-3 h-1 w-8 rounded-full ${underline}`} />
          </SportCard>
        </Link>
      ))}
    </div>
  );
}
