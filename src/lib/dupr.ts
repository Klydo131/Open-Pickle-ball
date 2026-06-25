/**
 * Local DUPR-style rating model.
 *
 * DUPR's exact production formula is proprietary. This module intentionally
 * implements a transparent local approximation based on public DUPR behavior:
 * ratings live on a 2.000-8.000 scale, singles and doubles are separate,
 * doubles team ratings use the team average, movement is based on score vs.
 * expectation, newer results matter more, and reliability rises with recent,
 * varied match volume.
 */

import type { DuprRating, MatchRecord, MatchType, Player } from './types';

export const DUPR_MIN = 2;
export const DUPR_MAX = 8;
export const DUPR_DEFAULT = 3.5;
export const DUPR_RELIABLE_THRESHOLD = 60;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EXPECTATION_SPREAD = 0.85;
const SELF_POSTED_RESULT_WEIGHT = 0.85;
const BASE_K: Record<MatchType, number> = {
  singles: 0.62,
  doubles: 0.46,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function roundRating(n: number): number {
  return Number(clamp(n, DUPR_MIN, DUPR_MAX).toFixed(3));
}

function roundReliability(n: number): number {
  return Math.round(clamp(n, 1, 100));
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function defaultDuprRating(updatedAt?: number): DuprRating {
  return {
    singles: DUPR_DEFAULT,
    doubles: DUPR_DEFAULT,
    singlesReliability: 1,
    doublesReliability: 1,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export function normalizeDuprRating(value: unknown): DuprRating {
  const raw = (value ?? {}) as Partial<DuprRating>;
  return {
    singles: roundRating(num(raw.singles, DUPR_DEFAULT)),
    doubles: roundRating(num(raw.doubles, DUPR_DEFAULT)),
    singlesReliability: roundReliability(num(raw.singlesReliability, 1)),
    doublesReliability: roundReliability(num(raw.doublesReliability, 1)),
    ...(num(raw.updatedAt, 0) > 0 ? { updatedAt: Math.floor(num(raw.updatedAt, 0)) } : {}),
  };
}

export function formatDuprRating(rating: number): string {
  return roundRating(rating).toFixed(3);
}

export function formatDuprReliability(reliability: number): string {
  return `${roundReliability(reliability)}%`;
}

export function duprReliable(reliability: number): boolean {
  return roundReliability(reliability) >= DUPR_RELIABLE_THRESHOLD;
}

export function modeRating(rating: DuprRating, mode: MatchType): number {
  return mode === 'singles' ? rating.singles : rating.doubles;
}

export function modeReliability(rating: DuprRating, mode: MatchType): number {
  return mode === 'singles' ? rating.singlesReliability : rating.doublesReliability;
}

export function duprOverall(rating: DuprRating): number {
  const clean = normalizeDuprRating(rating);
  const singlesWeight = Math.max(0, clean.singlesReliability - 1);
  const doublesWeight = Math.max(0, clean.doublesReliability - 1);
  const total = singlesWeight + doublesWeight;
  if (total <= 0) return DUPR_DEFAULT;
  return roundRating(
    (clean.singles * singlesWeight + clean.doubles * doublesWeight) / total,
  );
}

export function duprOverallReliability(rating: DuprRating): number {
  const clean = normalizeDuprRating(rating);
  const singlesWeight = Math.max(0, clean.singlesReliability - 1);
  const doublesWeight = Math.max(0, clean.doublesReliability - 1);
  const total = singlesWeight + doublesWeight;
  if (total <= 0) return Math.max(clean.singlesReliability, clean.doublesReliability);
  return roundReliability(
    (clean.singlesReliability * singlesWeight + clean.doublesReliability * doublesWeight) / total,
  );
}

export function playerDuprRating(player: Player): number {
  return duprOverall(normalizeDuprRating(player.dupr));
}

export function playerDuprReliability(player: Player): number {
  return duprOverallReliability(normalizeDuprRating(player.dupr));
}

export function duprModeLabel(player: Player): 'Singles' | 'Doubles' | 'Overall' {
  const dupr = normalizeDuprRating(player.dupr);
  const s = Math.max(0, dupr.singlesReliability - 1);
  const d = Math.max(0, dupr.doublesReliability - 1);
  if (s > 0 && d > 0) return 'Overall';
  return s > d ? 'Singles' : 'Doubles';
}

function setMode(
  rating: DuprRating,
  mode: MatchType,
  nextRating: number,
  nextReliability: number,
  updatedAt: number,
): DuprRating {
  const clean = normalizeDuprRating(rating);
  return mode === 'singles'
    ? {
        ...clean,
        singles: roundRating(nextRating),
        singlesReliability: roundReliability(nextReliability),
        updatedAt,
      }
    : {
        ...clean,
        doubles: roundRating(nextRating),
        doublesReliability: roundReliability(nextReliability),
        updatedAt,
      };
}

function teamAverage(ids: string[], players: Map<string, Player>, mode: MatchType): number {
  const values = ids
    .map((id) => players.get(id))
    .filter((p): p is Player => Boolean(p))
    .map((p) => modeRating(normalizeDuprRating(p.dupr), mode));
  if (values.length === 0) return DUPR_DEFAULT;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function expectedPointShare(teamRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - teamRating) / EXPECTATION_SPREAD));
}

function recencyWeight(completedAt: number, now: number): number {
  if (!completedAt) return 1;
  const ageDays = Math.max(0, (now - completedAt) / MS_PER_DAY);
  return clamp(0.45 + 0.55 * Math.exp(-ageDays / 365), 0.45, 1);
}

function decayReliability(reliability: number, updatedAt: number | undefined, now: number): number {
  if (!updatedAt) return reliability;
  const ageDays = Math.max(0, (now - updatedAt) / MS_PER_DAY);
  if (ageDays <= 7) return reliability;
  const tau = reliability >= 90 ? 350 : 135;
  return roundReliability(1 + (reliability - 1) * Math.exp(-ageDays / tau));
}

function confidenceMultiplier(reliability: number): number {
  return clamp(1.42 - reliability / 125, 0.62, 1.38);
}

function addToSet(map: Map<string, Set<string>>, id: string, values: string[]): number {
  let set = map.get(id);
  if (!set) {
    set = new Set();
    map.set(id, set);
  }
  let fresh = 0;
  for (const value of values) {
    if (value === id || set.has(value)) continue;
    set.add(value);
    fresh += 1;
  }
  return fresh;
}

function reliabilityGain({
  mode,
  recency,
  ratingGap,
  freshOpponents,
  freshPartners,
}: {
  mode: MatchType;
  recency: number;
  ratingGap: number;
  freshOpponents: number;
  freshPartners: number;
}): number {
  const base = mode === 'singles' ? 6.2 : 4.8;
  const closeMatchBonus = ratingGap <= 0.5 ? 1.2 : ratingGap <= 1 ? 0.5 : 0;
  const varietyBonus = Math.min(2.4, freshOpponents * 0.6) + Math.min(1.2, freshPartners * 0.6);
  return (base + closeMatchBonus + varietyBonus) * recency;
}

function applyRecord(
  players: Map<string, Player>,
  record: MatchRecord,
  now: number,
  opponents: Map<string, Set<string>>,
  partners: Map<string, Set<string>>,
): void {
  const participants = [...record.teamA, ...record.teamB].filter((id) => players.has(id));
  if (participants.length === 0) return;

  const points = record.scoreA + record.scoreB;
  if (points <= 0) return;

  const mode: MatchType = record.type;
  const teamA = record.teamA.filter((id) => players.has(id));
  const teamB = record.teamB.filter((id) => players.has(id));
  const teamARating = teamAverage(teamA, players, mode);
  const teamBRating = teamAverage(teamB, players, mode);
  const expectedA = expectedPointShare(teamARating, teamBRating);
  const actualA = record.scoreA / points;
  const performanceA = actualA - expectedA;
  const recency = recencyWeight(record.completedAt, now);
  const ratingGap = Math.abs(teamARating - teamBRating);

  const updateSide = (ids: string[], otherIds: string[], sign: 1 | -1) => {
    for (const id of ids) {
      const player = players.get(id);
      if (!player) continue;

      const rating = normalizeDuprRating(player.dupr);
      const current = modeRating(rating, mode);
      const reliability = modeReliability(rating, mode);
      const freshOpponents = addToSet(opponents, id, otherIds);
      const freshPartners = mode === 'doubles' ? addToSet(partners, id, ids) : 0;
      const rawDelta =
        sign *
        performanceA *
        BASE_K[mode] *
        SELF_POSTED_RESULT_WEIGHT *
        recency *
        confidenceMultiplier(reliability);
      const delta = clamp(rawDelta, -0.18, 0.18);
      const nextReliability =
        reliability +
        reliabilityGain({
          mode,
          recency,
          ratingGap,
          freshOpponents,
          freshPartners,
        });

      players.set(id, {
        ...player,
        dupr: setMode(rating, mode, current + delta, nextReliability, record.completedAt),
      });
    }
  };

  updateSide(teamA, teamB, 1);
  updateSide(teamB, teamA, -1);
}

/**
 * Replays local match history to produce stable, editable ratings. History is
 * persisted newest-first, so replay from oldest to newest.
 */
export function recomputeDuprRatings(
  players: Player[],
  history: MatchRecord[],
  now = Date.now(),
): Player[] {
  const working = new Map<string, Player>();
  for (const player of players) {
    const seed = normalizeDuprRating(player.duprSeed ?? player.dupr);
    working.set(player.id, {
      ...player,
      duprSeed: seed,
      dupr: normalizeDuprRating(seed),
    });
  }

  const opponents = new Map<string, Set<string>>();
  const partners = new Map<string, Set<string>>();
  for (let i = history.length - 1; i >= 0; i--) {
    applyRecord(working, history[i], now, opponents, partners);
  }

  return players.map((player) => {
    const next = working.get(player.id) ?? player;
    const dupr = normalizeDuprRating(next.dupr);
    return {
      ...next,
      dupr: {
        ...dupr,
        singlesReliability: decayReliability(dupr.singlesReliability, dupr.updatedAt, now),
        doublesReliability: decayReliability(dupr.doublesReliability, dupr.updatedAt, now),
      },
    };
  });
}
