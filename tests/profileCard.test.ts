import { describe, it, expect } from 'vitest';
import { profileCardHtml } from '@/lib/profileCard';
import { buildSharedProfile } from '@/lib/share';
import type { MatchRecord, Player } from '@/lib/types';

function player(id: string, name: string, over: Partial<Player> = {}): Player {
  return { id, name, themeId: 'pickle', wins: 1, losses: 1, streak: 0, bestStreak: 1, createdAt: 1, ...over };
}

const players: Record<string, Player> = {
  a: player('a', 'Alice', { wins: 2, losses: 1 }),
  b: player('b', 'Bob'),
  c: player('c', 'Cara'),
};
const history: MatchRecord[] = [
  {
    id: 'm1', courtId: 'c', type: 'singles', teamA: ['a'], teamB: ['b'],
    scoreA: 11, scoreB: 7, status: 'completed', winner: 'A',
    umpire: 'c', recordedBy: 'b', startedAt: 1, completedAt: 2,
  },
];

const card = (name: string) =>
  profileCardHtml(buildSharedProfile(player(name, name), [], { [name]: player(name, name) }, { includePhoto: false }));

describe('profileCardHtml — content', () => {
  const html = profileCardHtml(buildSharedProfile(players.a, history, players, { includePhoto: false }), {
    qrDataUrl: 'data:image/png;base64,AAA',
  });

  it('is a complete, self-contained HTML document', () => {
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Alice');
  });

  it('shows the stat tiles and the umpire/scorer columns', () => {
    expect(html).toContain('>Wins<');
    expect(html).toContain('>Losses<');
    expect(html).toContain('Win %');
    expect(html).toContain('>Umpire<');
    expect(html).toContain('>Recorded by<');
    expect(html).toContain('Cara'); // umpire name
    expect(html).toContain('Bob'); // recorder name
  });

  it('shows the scannable QR but never a raw code dump', () => {
    expect(html).toContain('data:image/png;base64,AAA'); // QR present
    expect(html).not.toContain('<code'); // no intimidating code block
    expect(html).not.toMatch(/OPB1\./); // the raw share code isn't printed on the card
  });
});

describe('profileCardHtml — safety', () => {
  it('contains no <script> and HTML-escapes the name', () => {
    const html = card('<img src=x onerror=alert(1)>');
    expect(/<script/i.test(html)).toBe(false);
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });
});

describe('profileCardHtml — uniqueness', () => {
  it('is deterministic for a given name', () => {
    expect(card('Alice')).toBe(card('Alice'));
  });

  it('differs between players (accent, crest, jersey number)', () => {
    const a = card('Alice');
    const b = card('Bob');
    expect(a).not.toBe(b);
    const numOf = (h: string) => h.match(/#(\d{2})</)?.[1];
    expect(numOf(a)).not.toBe(numOf(b));
    expect(a).toContain('class="crest"');
    expect(/hsl\(\d+/.test(a)).toBe(true);
  });
});
