import type { Player, Court, MatchRecord } from './types';

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

export interface HeadToHead {
  /** Completed matches where A and B were on opposing teams. */
  total: number;
  winsA: number;
  winsB: number;
  /** Most recent meeting (history is newest-first), if any. */
  last: MatchRecord | null;
}

/**
 * Head-to-head record between two players, counting only completed matches
 * where they were OPPONENTS (on opposite teams).
 */
export function headToHead(
  history: MatchRecord[],
  aId: string,
  bId: string,
): HeadToHead {
  let winsA = 0;
  let winsB = 0;
  let total = 0;
  let last: MatchRecord | null = null;

  for (const m of history) {
    const aInA = m.teamA.includes(aId);
    const aInB = m.teamB.includes(aId);
    const bInA = m.teamA.includes(bId);
    const bInB = m.teamB.includes(bId);
    // Opponents = one on team A, the other on team B.
    const opponents = (aInA && bInB) || (aInB && bInA);
    if (!opponents) continue;

    total += 1;
    if (last === null) last = m; // history is newest-first
    const aWon = (aInA && m.winner === 'A') || (aInB && m.winner === 'B');
    if (aWon) winsA += 1;
    else winsB += 1;
  }

  return { total, winsA, winsB, last };
}
