'use client';

/**
 * Full local backup — export/import the entire app state as a JSON file.
 *
 * Because Open Pickleball is account-free and local-only, clearing the browser
 * or switching devices would otherwise lose everything. A backup is a complete,
 * self-contained snapshot the user can save and restore — still 100% on-device,
 * nothing uploaded. An imported file is untrusted input, so `parseBackup` revisits
 * every field with the same clamping/sanitising used at the app's other trust
 * boundaries before it can reach the store.
 */

import type { AppData, AppMeta, Court, CourtStatus, Match, MatchRecord, MatchType, Player, Team } from './types';
import { playerNameSchema, courtNameSchema, themeIdSchema, photoSchema } from './validation';
import { getPlayerTheme } from './playerThemes';
import { downloadFile } from './export';

export const BACKUP_APP = 'open-pickleball';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: number;
  data: AppData;
}

/** Serialise the whole app state into a downloadable backup document. */
export function buildBackup(data: AppData): string {
  const file: BackupFile = { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: Date.now(), data };
  return JSON.stringify(file, null, 2);
}

/** Trigger a client-side download of the backup. */
export function downloadBackup(data: AppData): void {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadFile(`open-pickleball-backup-${stamp}.json`, 'application/json;charset=utf-8', buildBackup(data));
}

// -- defensive coercion helpers ----------------------------------------------

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const nat = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.floor(x)) : 0);
const str = (x: unknown): string => (typeof x === 'string' ? x : '');
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const team = (x: unknown): string[] => arr(x).map(str).filter(Boolean).slice(0, 2);

function coercePlayer(x: unknown): Player | null {
  if (!isObj(x)) return null;
  const name = playerNameSchema.safeParse(x.name);
  const id = str(x.id);
  if (!id || !name.success) return null;
  const themeId = themeIdSchema.safeParse(x.themeId);
  const photo = photoSchema.safeParse(x.photo);
  return {
    id,
    name: name.data,
    themeId: themeId.success ? themeId.data : getPlayerTheme(str(x.themeId)).id,
    ...(photo.success ? { photo: photo.data } : {}),
    wins: nat(x.wins),
    losses: nat(x.losses),
    streak: nat(x.streak),
    bestStreak: nat(x.bestStreak),
    createdAt: nat(x.createdAt) || Date.now(),
  };
}

function coerceCourt(x: unknown): Court | null {
  if (!isObj(x)) return null;
  const id = str(x.id);
  const name = courtNameSchema.safeParse(x.name);
  if (!id || !name.success) return null;
  const status: CourtStatus = x.status === 'in_progress' ? 'in_progress' : 'open';
  const matchId = typeof x.matchId === 'string' ? x.matchId : null;
  return { id, name: name.data, status, matchId };
}

function coerceScore(x: unknown): number {
  const n = nat(x);
  return Math.min(99, n);
}

function coerceMatch(x: unknown): Match | null {
  if (!isObj(x)) return null;
  const id = str(x.id);
  const courtId = str(x.courtId);
  if (!id || !courtId) return null;
  const type: MatchType = x.type === 'singles' ? 'singles' : 'doubles';
  const teamA = team(x.teamA);
  const teamB = team(x.teamB);
  if (teamA.length === 0 || teamB.length === 0) return null;
  const winner: Team | null = x.winner === 'A' ? 'A' : x.winner === 'B' ? 'B' : null;
  return {
    id, courtId, type, teamA, teamB,
    scoreA: coerceScore(x.scoreA),
    scoreB: coerceScore(x.scoreB),
    status: x.status === 'completed' ? 'completed' : 'active',
    winner,
    startedAt: nat(x.startedAt) || Date.now(),
    completedAt: typeof x.completedAt === 'number' ? x.completedAt : null,
  };
}

function coerceRecord(x: unknown): MatchRecord | null {
  const m = coerceMatch(x);
  if (!m) return null;
  const winner: Team = m.winner ?? (m.scoreA >= m.scoreB ? 'A' : 'B');
  const rec: MatchRecord = {
    ...m,
    status: 'completed',
    winner,
    completedAt: m.completedAt ?? m.startedAt,
  };
  if (typeof (x as Record<string, unknown>).umpire === 'string') rec.umpire = (x as Record<string, unknown>).umpire as string;
  if (typeof (x as Record<string, unknown>).recordedBy === 'string') rec.recordedBy = (x as Record<string, unknown>).recordedBy as string;
  return rec;
}

function coerceMeta(x: unknown): AppMeta {
  const o = isObj(x) ? x : {};
  return { tutorialDismissed: o.tutorialDismissed === true, autoRotate: o.autoRotate === true };
}

/**
 * Parse and fully sanitise a backup file. Returns clean `AppData`, or null if the
 * file isn't a recognisable Open Pickleball backup. Malformed individual entries
 * are dropped rather than failing the whole restore.
 */
export function parseBackup(raw: string): AppData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObj(parsed)) return null;
  // Accept the wrapped file or, leniently, a bare AppData object.
  const data = isObj(parsed.data) && parsed.app === BACKUP_APP ? parsed.data : parsed;
  if (!isObj(data) || !Array.isArray(data.players)) return null;

  // Keep every collection within sane bounds so an oversized file can't bog the
  // app down on load.
  const players = arr(data.players).slice(0, 500).map(coercePlayer).filter((p): p is Player => p !== null);
  const playerIds = new Set(players.map((p) => p.id));
  const courts = arr(data.courts).slice(0, 64).map(coerceCourt).filter((c): c is Court => c !== null);
  const matches = arr(data.matches).slice(0, 64).map(coerceMatch).filter((m): m is Match => m !== null);
  const history = arr(data.history).slice(0, 200).map(coerceRecord).filter((m): m is MatchRecord => m !== null);
  const waitingQueue = arr(data.waitingQueue).slice(0, 256).map(str).filter((id) => playerIds.has(id));

  return {
    players,
    courts,
    matches,
    history,
    waitingQueue,
    meta: coerceMeta(data.meta),
  };
}
