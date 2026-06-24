import { describe, it, expect } from 'vitest';
import { buildBackup, parseBackup, BACKUP_APP } from '@/lib/backup';
import type { AppData } from '@/lib/types';

const sample: AppData = {
  players: [
    { id: 'a', name: 'Alice', themeId: 'electric', photo: 'data:image/jpeg;base64,AAAA', wins: 3, losses: 1, streak: 2, bestStreak: 3, createdAt: 10 },
    { id: 'b', name: 'Bob', themeId: 'serve', wins: 1, losses: 3, streak: 0, bestStreak: 1, createdAt: 11 },
  ],
  courts: [{ id: 'c1', name: 'Court 1', status: 'open', matchId: null }],
  matches: [],
  history: [
    { id: 'm1', courtId: 'c1', type: 'singles', teamA: ['a'], teamB: ['b'], scoreA: 11, scoreB: 7, status: 'completed', winner: 'A', umpire: 'b', recordedBy: 'a', startedAt: 1, completedAt: 2 },
  ],
  waitingQueue: ['b'],
  meta: { tutorialDismissed: true, autoRotate: false },
};

describe('backup build/parse', () => {
  it('round-trips a full snapshot, preserving photos and officials', () => {
    const json = buildBackup(sample);
    expect(JSON.parse(json).app).toBe(BACKUP_APP);

    const back = parseBackup(json)!;
    expect(back).not.toBeNull();
    expect(back.players).toHaveLength(2);
    expect(back.players[0].photo).toBe('data:image/jpeg;base64,AAAA');
    expect(back.history[0].umpire).toBe('b');
    expect(back.history[0].recordedBy).toBe('a');
    expect(back.waitingQueue).toEqual(['b']);
    expect(back.meta.tutorialDismissed).toBe(true);
  });

  it('rejects non-backup input', () => {
    expect(parseBackup('not json')).toBeNull();
    expect(parseBackup('{}')).toBeNull(); // no players array
    expect(parseBackup('[]')).toBeNull();
  });

  it('sanitises hostile fields and drops malformed entries', () => {
    const evil = JSON.stringify({
      app: BACKUP_APP,
      version: 1,
      data: {
        players: [
          { id: 'a', name: '  Trim Me  ', themeId: 'bogus-theme', wins: -5, losses: 2.9, bestStreak: -1, photo: 'http://evil.example/x.png' },
          { id: '', name: 'no id' }, // dropped
          { name: 'no id either' }, // dropped
          'garbage', // dropped
        ],
        history: [{ id: 'm', courtId: 'c', teamA: [], teamB: ['b'], scoreA: 999, scoreB: 1, winner: 'A' }], // bad team → dropped
        waitingQueue: ['a', 'ghost'], // ghost has no player → dropped
        meta: { tutorialDismissed: 'yes', autoRotate: 1 },
      },
    });
    const back = parseBackup(evil)!;
    expect(back.players).toHaveLength(1);
    const p = back.players[0];
    expect(p.name).toBe('Trim Me'); // sanitised
    expect(p.themeId).toBeTruthy(); // fell back to a real theme
    expect(p.wins).toBe(0); // negative clamped
    expect(p.losses).toBe(2); // floored
    expect(p.bestStreak).toBe(0);
    expect(p.photo).toBeUndefined(); // remote URL rejected
    expect(back.history).toHaveLength(0); // malformed record dropped
    expect(back.waitingQueue).toEqual(['a']); // ghost dropped
    expect(back.meta.tutorialDismissed).toBe(false); // non-bool coerced
    expect(back.meta.autoRotate).toBe(false);
  });
});
