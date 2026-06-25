import { describe, it, expect } from 'vitest';
import {
  DUPR_DEFAULT,
  DUPR_MAX,
  DUPR_MIN,
  defaultDuprRating,
  duprOverall,
  normalizeDuprRating,
  playerDuprRating,
  recomputeDuprRatings,
} from '@/lib/dupr';
import type { MatchRecord, Player } from '@/lib/types';

function player(id: string, over: Partial<Player> = {}): Player {
  return {
    id, name: id, themeId: 'pickle', wins: 0, losses: 0, streak: 0, bestStreak: 0,
    dupr: defaultDuprRating(), duprSeed: defaultDuprRating(), createdAt: 1, ...over,
  };
}

function singles(id: string, a: string, b: string, scoreA: number, scoreB: number): MatchRecord {
  return {
    id, courtId: 'c', type: 'singles', teamA: [a], teamB: [b],
    scoreA, scoreB, status: 'completed', winner: scoreA > scoreB ? 'A' : 'B',
    startedAt: 1, completedAt: 2,
  };
}

describe('normalizeDuprRating', () => {
  it('fills sane defaults and clamps to the rating scale', () => {
    const d = normalizeDuprRating(undefined);
    expect(d.singles).toBe(DUPR_DEFAULT);
    expect(d.doubles).toBe(DUPR_DEFAULT);
    expect(d.singlesReliability).toBe(1);

    const clamped = normalizeDuprRating({ singles: 99, doubles: -5, singlesReliability: 999, doublesReliability: 0 });
    expect(clamped.singles).toBe(DUPR_MAX);
    expect(clamped.doubles).toBe(DUPR_MIN);
    expect(clamped.singlesReliability).toBe(100);
    expect(clamped.doublesReliability).toBe(1);
  });
});

describe('recomputeDuprRatings', () => {
  it('moves the winner up and the loser down, and raises reliability', () => {
    const players = [player('a'), player('b')];
    const history = [singles('m1', 'a', 'b', 11, 3)]; // a beat b
    const [a, b] = recomputeDuprRatings(players, history, 2);

    expect(playerDuprRating(a)).toBeGreaterThan(DUPR_DEFAULT);
    expect(playerDuprRating(b)).toBeLessThan(DUPR_DEFAULT);
    // both played one match, so reliability rises above the seed of 1
    expect(a.dupr.singlesReliability).toBeGreaterThan(1);
    expect(b.dupr.singlesReliability).toBeGreaterThan(1);
  });

  it('is deterministic — replaying the same history gives the same ratings', () => {
    const players = [player('a'), player('b')];
    const history = [singles('m2', 'b', 'a', 11, 9), singles('m1', 'a', 'b', 11, 6)];
    const first = recomputeDuprRatings(players, history, 1000);
    const second = recomputeDuprRatings(players, history, 1000);
    expect(first.map((p) => p.dupr)).toEqual(second.map((p) => p.dupr));
  });

  it('keeps ratings within the 2.000–8.000 scale even after many lopsided wins', () => {
    const players = [player('a'), player('b')];
    const history = Array.from({ length: 40 }, (_, i) => singles(`m${i}`, 'a', 'b', 11, 0));
    const [a, b] = recomputeDuprRatings(players, history, 1);
    expect(duprOverall(a.dupr)).toBeLessThanOrEqual(DUPR_MAX);
    expect(duprOverall(b.dupr)).toBeGreaterThanOrEqual(DUPR_MIN);
  });
});
