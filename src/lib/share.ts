'use client';

/**
 * Local-first profile sharing — the "bridge", not a database.
 *
 * A player's profile (name, theme, photo, record and recent results) is encoded
 * into a single self-contained string. That string IS the payload: hand it to
 * another device as a QR code or a copy-paste key and they can import the
 * profile. Nothing is uploaded, nothing is stored on a server, and no account is
 * involved — the app is purely a gateway that moves a profile from one device's
 * localStorage to another's.
 *
 * Wire format:  OPB1.<base64url(JSON)>
 *   - `OPB1` is the magic + version so we can evolve the schema safely.
 *   - The JSON is a `SharedProfile`. Photos are large, so QR-sized "cards" omit
 *     them while copy-paste / file shares can include them.
 *
 * Developers: keep this peer-to-peer. If you ever add an *online* relay (e.g. a
 * short link or email hand-off), make it strictly opt-in and keep this offline
 * code path as the default — see ARCHITECTURE.md → "Local-first sharing".
 */

import type { MatchRecord, Player } from './types';
import { isValidPhoto } from './validation';

export const SHARE_PREFIX = 'OPB1.';

/** One past result, flattened so it makes sense on a device that wasn't there. */
export interface SharedResultLine {
  /** Opponent name(s), already joined for display. */
  o: string;
  /** 1 if the shared player won this match, else 0. */
  w: 0 | 1;
  /** Score for / against the shared player. */
  f: number;
  a: number;
  /** completedAt (ms epoch). */
  t: number;
  /** Umpire name (resolved at share time), if one was recorded. */
  u?: string;
  /** Name of whoever recorded the result, if captured. */
  by?: string;
}

/** Portable snapshot of a single player's profile + record. */
export interface SharedProfile {
  v: 1;
  name: string;
  themeId: string;
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
  /** Present only on full (non-QR) shares. */
  photo?: string;
  /** Most-recent results, informational. */
  recent: SharedResultLine[];
  /** When this snapshot was created (ms epoch). */
  at: number;
}

const MAX_RECENT = 10;

/** Build a shareable snapshot of one player from the local store. */
export function buildSharedProfile(
  player: Player,
  history: MatchRecord[],
  players: Record<string, Player>,
  opts: { includePhoto: boolean },
): SharedProfile {
  const recent: SharedResultLine[] = [];
  for (const m of history) {
    const inA = m.teamA.includes(player.id);
    const inB = m.teamB.includes(player.id);
    if (!inA && !inB) continue;
    const won = (inA && m.winner === 'A') || (inB && m.winner === 'B');
    const oppIds = inA ? m.teamB : m.teamA;
    const oppNames = oppIds.map((id) => players[id]?.name ?? 'Player').join(' & ');
    const umpName = m.umpire ? players[m.umpire]?.name : undefined;
    const byName = m.recordedBy ? players[m.recordedBy]?.name : undefined;
    recent.push({
      o: oppNames,
      w: won ? 1 : 0,
      f: inA ? m.scoreA : m.scoreB,
      a: inA ? m.scoreB : m.scoreA,
      t: m.completedAt,
      ...(umpName ? { u: umpName } : {}),
      ...(byName ? { by: byName } : {}),
    });
    if (recent.length >= MAX_RECENT) break;
  }

  return {
    v: 1,
    name: player.name,
    themeId: player.themeId,
    wins: player.wins,
    losses: player.losses,
    streak: player.streak,
    bestStreak: player.bestStreak,
    ...(opts.includePhoto && player.photo ? { photo: player.photo } : {}),
    recent,
    at: Date.now(),
  };
}

/** Encode a profile to the shareable `OPB1.…` string. */
export function encodeProfile(profile: SharedProfile): string {
  return SHARE_PREFIX + utf8ToBase64Url(JSON.stringify(profile));
}

/**
 * Decode a shared string back into a profile. Returns null when the string
 * isn't a valid Open Pickleball share code, so callers can show a friendly
 * error instead of throwing. Untrusted fields are clamped / dropped.
 */
export function decodeProfile(raw: string): SharedProfile | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith(SHARE_PREFIX)) return null;
  try {
    const json = base64UrlToUtf8(trimmed.slice(SHARE_PREFIX.length));
    const data = JSON.parse(json) as Record<string, unknown>;
    if (data.v !== 1) return null;

    const name = typeof data.name === 'string' ? data.name.slice(0, 24).trim() : '';
    if (!name) return null;

    const num = (x: unknown) =>
      typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.floor(x)) : 0;

    const recent: SharedResultLine[] = Array.isArray(data.recent)
      ? (data.recent as unknown[])
          .slice(0, MAX_RECENT)
          .map((r) => r as Record<string, unknown>)
          .map((r) => ({
            o: typeof r.o === 'string' ? r.o.slice(0, 60) : 'Player',
            w: r.w === 1 ? 1 : 0,
            f: num(r.f),
            a: num(r.a),
            t: num(r.t),
            ...(typeof r.u === 'string' && r.u.trim() ? { u: r.u.slice(0, 40) } : {}),
            ...(typeof r.by === 'string' && r.by.trim() ? { by: r.by.slice(0, 40) } : {}),
          }))
      : [];

    return {
      v: 1,
      name,
      themeId: typeof data.themeId === 'string' ? data.themeId : 'pickle',
      wins: num(data.wins),
      losses: num(data.losses),
      streak: num(data.streak),
      bestStreak: num(data.bestStreak),
      ...(isValidPhoto(data.photo) ? { photo: data.photo } : {}),
      recent,
      at: num(data.at),
    };
  } catch {
    return null;
  }
}

// -- base64url <-> UTF-8 helpers (browser-safe, handles emoji/accents) --------

function utf8ToBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUtf8(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
