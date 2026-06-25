import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/lib/store';
import { defaultDuprRating } from '@/lib/dupr';
import type { SharedProfile } from '@/lib/share';

const S = () => useStore.getState();

beforeEach(() => S().resetAll());

describe('players — add / validate / rename', () => {
  it('adds, rejects duplicates and blanks', () => {
    expect(S().addPlayer('Alice').ok).toBe(true);
    expect(S().addPlayer('alice').ok).toBe(false); // case-insensitive dup
    expect(S().addPlayer('   ').ok).toBe(false);
    expect(S().players).toHaveLength(1);
  });

  it('renames with validation and de-duplication', () => {
    S().addPlayer('Alice');
    S().addPlayer('Bob');
    const alice = S().players.find((p) => p.name === 'Alice')!;
    expect(S().renamePlayer(alice.id, 'Alicia').ok).toBe(true);
    expect(S().players.some((p) => p.name === 'Alicia')).toBe(true);
    expect(S().renamePlayer(alice.id, 'Bob').ok).toBe(false); // would duplicate
    expect(S().renamePlayer(alice.id, '').ok).toBe(false); // blank
  });
});

describe('match flow — start / record / streaks', () => {
  it('starts a match, blocks double-booking, records a winner and frees the court', () => {
    S().addPlayer('A');
    S().addPlayer('B');
    const [a, b] = S().players;
    const court = S().courts[0];

    expect(S().startMatch(court.id, 'singles', [a.id], [b.id]).ok).toBe(true);
    expect(S().courts[0].status).toBe('in_progress');
    expect(S().startMatch(court.id, 'singles', [a.id], [b.id]).ok).toBe(false); // busy

    const match = S().matches[0];
    expect(S().recordResult(match.id, 11, 7).ok).toBe(true);
    expect(S().players.find((p) => p.id === a.id)!.wins).toBe(1);
    expect(S().players.find((p) => p.id === a.id)!.streak).toBe(1);
    expect(S().players.find((p) => p.id === b.id)!.losses).toBe(1);
    expect(S().courts[0].status).toBe('open');
    expect(S().history).toHaveLength(1);
  });

  it('rejects ties and out-of-range scores', () => {
    S().addPlayer('A');
    S().addPlayer('B');
    const [a, b] = S().players;
    S().startMatch(S().courts[0].id, 'singles', [a.id], [b.id]);
    const m = S().matches[0];
    expect(S().recordResult(m.id, 5, 5).ok).toBe(false);
    expect(S().recordResult(m.id, 5, 200).ok).toBe(false);
    expect(S().matches).toHaveLength(1); // still active
  });
});

describe('officials — capture & edit', () => {
  it('stores valid officials and drops unknown ids', () => {
    S().addPlayer('A');
    S().addPlayer('B');
    S().addPlayer('Ref');
    const [a, b, ref] = S().players;
    S().startMatch(S().courts[0].id, 'singles', [a.id], [b.id]);
    const m = S().matches[0];
    expect(S().recordResult(m.id, 11, 9, { umpire: ref.id, recordedBy: a.id }).ok).toBe(true);

    const rec = S().history[0];
    expect(rec.umpire).toBe(ref.id);
    expect(rec.recordedBy).toBe(a.id);

    expect(S().setRecordOfficials(rec.id, { umpire: 'ghost', recordedBy: b.id }).ok).toBe(true);
    expect(S().history[0].umpire).toBeUndefined(); // unknown id dropped
    expect(S().history[0].recordedBy).toBe(b.id);
  });
});

describe('editing & deleting records rolls W/L back', () => {
  it('flips the winner and then deletes, restoring records', () => {
    S().addPlayer('A');
    S().addPlayer('B');
    const [a, b] = S().players;
    S().startMatch(S().courts[0].id, 'singles', [a.id], [b.id]);
    S().recordResult(S().matches[0].id, 11, 3); // A beats B
    const recId = S().history[0].id;

    expect(S().editMatchRecord(recId, 3, 11).ok).toBe(true); // now B wins
    expect(S().players.find((p) => p.id === a.id)!.wins).toBe(0);
    expect(S().players.find((p) => p.id === b.id)!.wins).toBe(1);

    expect(S().deleteMatchRecord(recId).ok).toBe(true);
    expect(S().players.find((p) => p.id === b.id)!.wins).toBe(0);
    expect(S().history).toHaveLength(0);
  });
});

describe('queue & guarded deletes', () => {
  it('queues players and blocks removing those in a live match', () => {
    S().addPlayer('A');
    S().addPlayer('B');
    const [a, b] = S().players;
    const court = S().courts[0];
    expect(S().joinQueue(a.id).ok).toBe(true);
    expect(S().waitingQueue).toContain(a.id);
    expect(S().leaveQueue(a.id).ok).toBe(true);

    S().startMatch(court.id, 'singles', [a.id], [b.id]);
    expect(S().removePlayer(a.id).ok).toBe(false); // in a match
    expect(S().removeCourt(court.id).ok).toBe(false); // busy court
  });
});

describe('importPlayer', () => {
  it('adds a shared profile with its carried stats', () => {
    const profile: SharedProfile = {
      v: 1, name: 'Imported', themeId: 'serve',
      wins: 3, losses: 1, streak: 2, bestStreak: 4, dupr: defaultDuprRating(), recent: [], at: 1,
    };
    expect(S().importPlayer(profile).ok).toBe(true);
    const p = S().players.find((x) => x.name === 'Imported')!;
    expect(p.wins).toBe(3);
    expect(p.bestStreak).toBe(4);
  });
});
