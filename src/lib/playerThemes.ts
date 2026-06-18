/**
 * Name themes. Players "choose their theme in their name" — each theme is a
 * gradient + accent applied wherever the player's name is rendered (roster,
 * match cards, leaderboard, waiting area).
 *
 * Themes are kept as Tailwind utility strings so they compose cleanly and stay
 * inside the design system's palette.
 */
export interface PlayerTheme {
  id: string;
  label: string;
  /** Tailwind classes producing the name's text gradient. */
  textClass: string;
  /** Solid accent (hex) used for borders/avatars/edges. */
  accent: string;
  /** Tailwind gradient classes for the player's avatar chip. */
  chipClass: string;
}

export const PLAYER_THEMES: PlayerTheme[] = [
  {
    id: 'pickle',
    label: 'Pickle Bolt',
    textClass: 'bg-gradient-to-r from-pickle to-yellow-200 bg-clip-text text-transparent',
    accent: '#FFD626',
    chipClass: 'from-pickle to-yellow-500',
  },
  {
    id: 'serve',
    label: 'Serve Fire',
    textClass: 'bg-gradient-to-r from-serve to-orange-400 bg-clip-text text-transparent',
    accent: '#FF314F',
    chipClass: 'from-serve to-rose-600',
  },
  {
    id: 'electric',
    label: 'Electric Ace',
    textClass: 'bg-gradient-to-r from-electric to-cyan-300 bg-clip-text text-transparent',
    accent: '#32A7FF',
    chipClass: 'from-electric to-blue-500',
  },
  {
    id: 'court',
    label: 'Court King',
    textClass: 'bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent',
    accent: '#34D399',
    chipClass: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'sunset',
    label: 'Sunset Smash',
    textClass: 'bg-gradient-to-r from-orange-300 via-pink-400 to-purple-400 bg-clip-text text-transparent',
    accent: '#F472B6',
    chipClass: 'from-orange-400 via-pink-500 to-purple-500',
  },
  {
    id: 'frost',
    label: 'Frost Dink',
    textClass: 'bg-gradient-to-r from-slate-100 to-sky-300 bg-clip-text text-transparent',
    accent: '#E2E8F0',
    chipClass: 'from-slate-200 to-sky-400',
  },
];

export const DEFAULT_THEME_ID = PLAYER_THEMES[0].id;

export function getPlayerTheme(themeId: string): PlayerTheme {
  return PLAYER_THEMES.find((t) => t.id === themeId) ?? PLAYER_THEMES[0];
}
