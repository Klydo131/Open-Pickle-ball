import { describe, it, expect } from 'vitest';
import { recomputeStreaks, applyRecordEdit, applyRecordDelete } from '@/lib/records';
import type { MatchRecord, Player, Team } from '@/lib/types';

function player(id: string, over: Partial<Player> = {}): Player {
  return { id, name: id, themeId: 'pickle', wins: 0, losses: 0, streak: 0, bestStreak: 0, createdAt: 1, ...over };
}

// Newest-first history (as persisted). Helper builds a singles record.
function rec(id: string, a: string, b: string, scoreA: number, scoreB: number): MatchRecord {
  const winner: Team = scoreA > scoreB ? 'A' : 'B';
  return {
    id, courtId: 'c', type: 'singles', teamA: [a], teamB: [b],
    scoreA, scoreB, status: 'completed', winner, startedAt: 1, completedAt: 2,
  };
}

describe('recomputeStreaks', () => {
  it('replays history oldest→newest and sets current + best streak', () => {
    const players = [player('a'), player('b')];
    // newest-first: a beat b twice, then b beat a
    const history = [rec('m3', 'b', 'a', 11, 5), rec('m2', 'a', 'b', 11, 4), rec('m1', 'a', 'b', 11, 7)];
    const [a, b] = recomputeStreaks(players, history);
    expect(a.streak).toBe(0); // a's most recent game was a loss
    expect(a.bestStreak).toBe(2); // a won the first two
    expect(b.streak).toBe(1);
    expect(b.bestStreak).toBe(1);
  });

  it('never lowers an existing bestStreak', () => {
    const players = [player('a', { bestStreak: 9 })];
    const [a] = recomputeStreaks(players, []);
    expect(a.bestStreak).toBe(9);
  });
});

describe('applyRecordEdit', () => {
  it('returns null for an unknown record', () => {
    expect(applyRecordEdit([player('a')], [], 'nope', 11, 3)).toBeNull();
  });

  it('a pure score change (winner unchanged) leaves W/L untouched', () => {
    const players = [player('a', { wins: 1 }), player('b', { losses: 1 })];
    const history = [rec('m1', 'a', 'b', 11, 7)];
    const patch = applyRecordEdit(players, history, 'm1', 11, 9)!;
    expect(patch.players.find((p) => p.id === 'a')!.wins).toBe(1);
    expect(patch.players.find((p) => p.id === 'b')!.losses).toBe(1);
    expect(patch.history[0].scoreB).toBe(9);
  });

  it('flipping the winner moves one W↔L across the players', () => {
    const players = [player('a', { wins: 1 }), player('b', { losses: 1 })];
    const history = [rec('m1', 'a', 'b', 11, 7)]; // a won
    const patch = applyRecordEdit(players, history, 'm1', 7, 11)!; // now b wins
    expect(patch.players.find((p) => p.id === 'a')!.wins).toBe(0);
    expect(patch.players.find((p) => p.id === 'a')!.losses).toBe(1);
    expect(patch.players.find((p) => p.id === 'b')!.wins).toBe(1);
    expect(patch.players.find((p) => p.id === 'b')!.losses).toBe(0);
    expect(patch.history[0].winner).toBe('B');
  });

  it('never drives W/L negative', () => {
    const players = [player('a'), player('b')]; // both at 0
    const history = [rec('m1', 'a', 'b', 11, 7)];
    const patch = applyRecordEdit(players, history, 'm1', 7, 11)!;
    expect(patch.players.every((p) => p.wins >= 0 && p.losses >= 0)).toBe(true);
  });
});

describe('applyRecordDelete', () => {
  it('rolls back the W/L of the removed record', () => {
    const players = [player('a', { wins: 1 }), player('b', { losses: 1 })];
    const history = [rec('m1', 'a', 'b', 11, 7)];
    const patch = applyRecordDelete(players, history, 'm1')!;
    expect(patch.history).toHaveLength(0);
    expect(patch.players.find((p) => p.id === 'a')!.wins).toBe(0);
    expect(patch.players.find((p) => p.id === 'b')!.losses).toBe(0);
  });

  it('returns null for an unknown record', () => {
    expect(applyRecordDelete([], [], 'nope')).toBeNull();
  });
});
