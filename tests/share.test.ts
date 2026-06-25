import { describe, it, expect } from 'vitest';
import { buildSharedProfile, encodeProfile, decodeProfile, SHARE_PREFIX } from '@/lib/share';
import { defaultDuprRating } from '@/lib/dupr';
import type { MatchRecord, Player } from '@/lib/types';

function player(id: string, name: string, over: Partial<Player> = {}): Player {
  return {
    id, name, themeId: 'pickle', wins: 0, losses: 0, streak: 0, bestStreak: 0,
    dupr: defaultDuprRating(), duprSeed: defaultDuprRating(), createdAt: 1, ...over,
  };
}

const alice = player('a', 'Alice', { wins: 2, losses: 1, streak: 1, bestStreak: 2 });
const bob = player('b', 'Bob', { wins: 1, losses: 2 });
const cara = player('c', 'Cara');
const players: Record<string, Player> = { a: alice, b: bob, c: cara };

const history: MatchRecord[] = [
  {
    id: 'm1', courtId: 'c', type: 'singles', teamA: ['a'], teamB: ['b'],
    scoreA: 11, scoreB: 7, status: 'completed', winner: 'A',
    umpire: 'c', recordedBy: 'b', startedAt: 1, completedAt: 2,
  },
];

describe('share codec', () => {
  it('round-trips a profile, carrying umpire & scorer names', () => {
    const profile = buildSharedProfile(alice, history, players, { includePhoto: false });
    expect(profile.recent[0].u).toBe('Cara');
    expect(profile.recent[0].by).toBe('Bob');

    const code = encodeProfile(profile);
    expect(code.startsWith(SHARE_PREFIX)).toBe(true);

    const back = decodeProfile(code)!;
    expect(back.name).toBe('Alice');
    expect(back.wins).toBe(2);
    expect(back.recent[0].u).toBe('Cara');
    expect(back.recent[0].by).toBe('Bob');
  });

  it('omits the photo on a card (QR) share and includes it on a full share', () => {
    const withPhoto = player('a', 'Alice', { photo: 'data:image/jpeg;base64,AAAA' });
    const card = buildSharedProfile(withPhoto, [], { a: withPhoto }, { includePhoto: false });
    const full = buildSharedProfile(withPhoto, [], { a: withPhoto }, { includePhoto: true });
    expect(card.photo).toBeUndefined();
    expect(full.photo).toBe('data:image/jpeg;base64,AAAA');
  });

  it('rejects anything that is not an OPB1 code', () => {
    expect(decodeProfile('hello world')).toBeNull();
    expect(decodeProfile('')).toBeNull();
    expect(decodeProfile('OPB1.not-base64!!')).toBeNull();
  });

  it('clamps and sanitises hostile fields', () => {
    const base = buildSharedProfile(alice, history, players, { includePhoto: false });
    const evil = encodeProfile({
      ...base,
      wins: -5 as unknown as number,
      recent: [{ o: 'X'.repeat(999), w: 5 as 0 | 1, f: -3, a: 1e9, t: -1, u: 42 as unknown as string, by: {} as unknown as string }],
    });
    const cleaned = decodeProfile(evil)!;
    expect(cleaned.wins).toBe(0); // negative clamped
    expect([0, 1]).toContain(cleaned.recent[0].w);
    expect(cleaned.recent[0].f).toBeGreaterThanOrEqual(0);
    expect(cleaned.recent[0].o.length).toBeLessThanOrEqual(60);
    expect(cleaned.recent[0].u).toBeUndefined(); // non-string dropped
    expect(cleaned.recent[0].by).toBeUndefined();
  });
});
