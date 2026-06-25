/**
 * Pure record maths — kept out of the store so it can be unit-tested in
 * isolation. These functions never touch the DOM or the store; they take
 * `players` + `history` and return the next versions.
 *
 * Convention: `history` is newest-first (as persisted), and a record's `winner`
 * is the source of truth for who beat whom.
 */

import type { MatchRecord, Player, Team } from './types';
import { recomputeDuprRatings } from './dupr';

/**
 * Recompute every player's current + best streak by replaying local history
 * (oldest → newest). Wins/losses are NOT touched here — they're maintained by
 * incremental deltas — so a player's imported carry-over record is preserved.
 * `bestStreak` is only ever raised (Math.max), never lowered, so editing an old
 * result can't erase a badge a player legitimately earned.
 */
export function recomputeStreaks(players: Player[], history: MatchRecord[]): Player[] {
  const cur = new Map<string, number>();
  const best = new Map<string, number>();
  // history is newest-first; replay in chronological order.
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    const winners = m.winner === 'A' ? m.teamA : m.teamB;
    const losers = m.winner === 'A' ? m.teamB : m.teamA;
    for (const id of winners) {
      const s = (cur.get(id) ?? 0) + 1;
      cur.set(id, s);
      best.set(id, Math.max(best.get(id) ?? 0, s));
    }
    for (const id of losers) cur.set(id, 0);
  }
  return players.map((p) => ({
    ...p,
    streak: cur.get(p.id) ?? 0,
    bestStreak: Math.max(p.bestStreak, best.get(p.id) ?? 0),
  }));
}

export interface RecordsPatch {
  players: Player[];
  history: MatchRecord[];
}

/**
 * Apply a score correction to a recorded match. Scores are assumed already
 * validated (integers 0–99, not a tie). Returns the next players + history, or
 * null when the record doesn't exist.
 *
 * - A pure score change (winner unchanged) leaves W/L untouched.
 * - Flipping the winner moves one W↔L across the affected players (clamped ≥ 0).
 * - Streaks are always recomputed from the resulting history.
 */
export function applyRecordEdit(
  players: Player[],
  history: MatchRecord[],
  recordId: string,
  scoreA: number,
  scoreB: number,
): RecordsPatch | null {
  const record = history.find((m) => m.id === recordId);
  if (!record) return null;

  const newWinner: Team = scoreA > scoreB ? 'A' : 'B';
  const winnerFlipped = newWinner !== record.winner;

  const updated: MatchRecord = { ...record, scoreA, scoreB, winner: newWinner };
  const newHistory = history.map((m) => (m.id === recordId ? updated : m));

  let nextPlayers = players;
  if (winnerFlipped) {
    const gainedW = new Set(newWinner === 'A' ? record.teamA : record.teamB); // now winners
    const gainedL = new Set(newWinner === 'A' ? record.teamB : record.teamA); // now losers
    nextPlayers = players.map((p) => {
      if (gainedW.has(p.id)) return { ...p, wins: p.wins + 1, losses: Math.max(0, p.losses - 1) };
      if (gainedL.has(p.id)) return { ...p, losses: p.losses + 1, wins: Math.max(0, p.wins - 1) };
      return p;
    });
  }

  return {
    history: newHistory,
    players: recomputeDuprRatings(recomputeStreaks(nextPlayers, newHistory), newHistory),
  };
}

/**
 * Remove a recorded match and roll back its W/L effect, then recompute streaks.
 * Returns null when the record doesn't exist.
 */
export function applyRecordDelete(
  players: Player[],
  history: MatchRecord[],
  recordId: string,
): RecordsPatch | null {
  const record = history.find((m) => m.id === recordId);
  if (!record) return null;

  const winners = new Set(record.winner === 'A' ? record.teamA : record.teamB);
  const losers = new Set(record.winner === 'A' ? record.teamB : record.teamA);
  const newHistory = history.filter((m) => m.id !== recordId);
  const nextPlayers = players.map((p) => {
    if (winners.has(p.id)) return { ...p, wins: Math.max(0, p.wins - 1) };
    if (losers.has(p.id)) return { ...p, losses: Math.max(0, p.losses - 1) };
    return p;
  });

  return {
    history: newHistory,
    players: recomputeDuprRatings(recomputeStreaks(nextPlayers, newHistory), newHistory),
  };
}
