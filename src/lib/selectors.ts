import type { Player, Court } from './types';

/** Index an array of records with ids into a lookup map. */
export function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  const map: Record<string, T> = {};
  for (const item of items) map[item.id] = item;
  return map;
}

/** Players ranked for the leaderboard: wins desc, then win-rate, then fewer losses. */
export function rankPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const ra = a.wins + a.losses === 0 ? 0 : a.wins / (a.wins + a.losses);
    const rb = b.wins + b.losses === 0 ? 0 : b.wins / (b.wins + b.losses);
    if (rb !== ra) return rb - ra;
    return a.losses - b.losses;
  });
}

/** Courts that are free to host a new match. */
export function openCourts(courts: Court[]): Court[] {
  return courts.filter((c) => c.status === 'open');
}
