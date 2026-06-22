'use client';

/**
 * Open Pickleball — application state & business logic (the "backend").
 *
 * This is the LOCAL-FIRST adapter. It owns every rule about players, courts,
 * matches, records and the waiting queue, and persists to localStorage via
 * Zustand's `persist` middleware. The UI never mutates state directly — it only
 * calls the typed actions below.
 *
 * WHY THIS SHAPE (for developers):
 *   - All match/queue rules live in ONE place, mirroring the backend blueprint
 *     in the brief. To move to a real server (any hosted Postgres backend), implement the
 *     same action surface against your API and swap this module — the
 *     components don't change. See ARCHITECTURE.md → "Swapping the backend".
 *   - Mutations validate inputs and return typed results (ok/err) so the UI can
 *     show friendly errors instead of crashing. This is the local analogue of
 *     the server-side transaction guards (e.g. MATCH_FULL / COURT_BUSY).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppData,
  AppMeta,
  Court,
  Match,
  MatchRecord,
  MatchType,
  Player,
  Team,
} from './types';
import { makeId } from './utils';
import {
  playerNameSchema,
  courtNameSchema,
  themeIdSchema,
  photoSchema,
} from './validation';
import { DEFAULT_THEME_ID, getPlayerTheme } from './playerThemes';
import type { SharedProfile } from './share';

const STORAGE_KEY = 'open-pickleball:v1';

/** Result of a mutation that can fail with a known, user-presentable reason. */
export type ActionResult =
  | { ok: true }
  | { ok: false; code: ActionErrorCode; message: string };

export type ActionErrorCode =
  | 'INVALID_INPUT'
  | 'DUPLICATE_NAME'
  | 'NOT_FOUND'
  | 'COURT_BUSY'
  | 'PLAYER_IN_MATCH'
  | 'NEED_PLAYERS'
  | 'PLAYER_OVERLAP';

const ok = (): ActionResult => ({ ok: true });
const err = (code: ActionErrorCode, message: string): ActionResult => ({
  ok: false,
  code,
  message,
});

function defaultCourts(): Court[] {
  return [
    { id: makeId(), name: 'Court 1', status: 'open', matchId: null },
    { id: makeId(), name: 'Court 2', status: 'open', matchId: null },
  ];
}

const defaultMeta = (): AppMeta => ({
  tutorialDismissed: false,
  autoRotate: false,
});

const initialData: AppData = {
  players: [],
  courts: defaultCourts(),
  matches: [],
  history: [],
  waitingQueue: [],
  meta: defaultMeta(),
};

interface StoreActions {
  // -- Players ----------------------------------------------------------------
  addPlayer(name: string, themeId?: string, photo?: string): ActionResult;
  renamePlayer(id: string, name: string): ActionResult;
  setPlayerTheme(id: string, themeId: string): ActionResult;
  /** Set or clear (null) a player's profile photo. */
  setPlayerPhoto(id: string, photo: string | null): ActionResult;
  removePlayer(id: string): ActionResult;
  /** Import a profile shared from another device (QR / code). */
  importPlayer(profile: SharedProfile): ActionResult;

  // -- Courts -----------------------------------------------------------------
  addCourt(name: string): ActionResult;
  removeCourt(id: string): ActionResult;

  // -- Waiting area -----------------------------------------------------------
  joinQueue(playerId: string): ActionResult;
  leaveQueue(playerId: string): ActionResult;

  // -- Match area -------------------------------------------------------------
  startMatch(
    courtId: string,
    type: MatchType,
    teamA: string[],
    teamB: string[],
  ): ActionResult;
  /** Pull the front of the waiting queue onto a court (queue rotation). */
  startNextFromQueue(courtId: string, type?: MatchType): ActionResult;
  recordResult(matchId: string, scoreA: number, scoreB: number): ActionResult;
  cancelMatch(matchId: string): ActionResult;
  /** Fix the score of an already-recorded match (recomputes W/L + streaks). */
  editMatchRecord(recordId: string, scoreA: number, scoreB: number): ActionResult;
  /** Remove a recorded match and roll back its effect on player records. */
  deleteMatchRecord(recordId: string): ActionResult;
  /** Toggle auto-rotation: freed courts auto-fill from the queue. */
  setAutoRotate(on: boolean): void;

  // -- Coach / onboarding -----------------------------------------------------
  dismissTutorial(): void;
  restartTutorial(): void;

  // -- Maintenance ------------------------------------------------------------
  resetAll(): void;
}

export type AppStore = AppData & StoreActions;

/** Set of player ids currently assigned to an active match. */
function playersInActiveMatches(matches: Match[]): Set<string> {
  const ids = new Set<string>();
  for (const m of matches) {
    if (m.status !== 'active') continue;
    for (const p of [...m.teamA, ...m.teamB]) ids.add(p);
  }
  return ids;
}

/**
 * Recompute every player's current + best streak by replaying local history
 * (oldest → newest). Wins/losses are NOT touched here — they're maintained by
 * incremental deltas — so a player's imported carry-over record is preserved.
 * `bestStreak` is only ever raised (Math.max), never lowered, so editing an old
 * result can't erase a badge a player legitimately earned.
 */
function withRecomputedStreaks(players: Player[], history: MatchRecord[]): Player[] {
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

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialData,

      // -- Players --------------------------------------------------------------
      addPlayer(name, themeId = DEFAULT_THEME_ID, photo) {
        const parsedName = playerNameSchema.safeParse(name);
        if (!parsedName.success) {
          return err('INVALID_INPUT', parsedName.error.issues[0].message);
        }
        const parsedTheme = themeIdSchema.safeParse(themeId);
        const finalTheme = parsedTheme.success ? parsedTheme.data : DEFAULT_THEME_ID;

        // A photo is optional, but if present it must pass the data-URL guard.
        let finalPhoto: string | undefined;
        if (photo) {
          const parsedPhoto = photoSchema.safeParse(photo);
          if (!parsedPhoto.success) return err('INVALID_INPUT', parsedPhoto.error.issues[0].message);
          finalPhoto = parsedPhoto.data;
        }

        const clean = parsedName.data;
        const exists = get().players.some(
          (p) => p.name.toLowerCase() === clean.toLowerCase(),
        );
        if (exists) return err('DUPLICATE_NAME', `${clean} is already on the roster`);

        const player: Player = {
          id: makeId(),
          name: clean,
          themeId: finalTheme,
          ...(finalPhoto ? { photo: finalPhoto } : {}),
          wins: 0,
          losses: 0,
          streak: 0,
          bestStreak: 0,
          createdAt: Date.now(),
        };
        set((s) => ({ players: [...s.players, player] }));
        return ok();
      },

      renamePlayer(id, name) {
        const parsed = playerNameSchema.safeParse(name);
        if (!parsed.success) return err('INVALID_INPUT', parsed.error.issues[0].message);
        const clean = parsed.data;
        const dup = get().players.some(
          (p) => p.id !== id && p.name.toLowerCase() === clean.toLowerCase(),
        );
        if (dup) return err('DUPLICATE_NAME', `${clean} is already on the roster`);
        if (!get().players.some((p) => p.id === id)) return err('NOT_FOUND', 'Player not found');
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, name: clean } : p)),
        }));
        return ok();
      },

      setPlayerTheme(id, themeId) {
        const parsed = themeIdSchema.safeParse(themeId);
        if (!parsed.success) return err('INVALID_INPUT', 'Unknown theme');
        if (!get().players.some((p) => p.id === id)) return err('NOT_FOUND', 'Player not found');
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id ? { ...p, themeId: parsed.data } : p,
          ),
        }));
        return ok();
      },

      setPlayerPhoto(id, photo) {
        if (!get().players.some((p) => p.id === id)) return err('NOT_FOUND', 'Player not found');
        let next: string | undefined;
        if (photo) {
          const parsed = photoSchema.safeParse(photo);
          if (!parsed.success) return err('INVALID_INPUT', parsed.error.issues[0].message);
          next = parsed.data;
        }
        set((s) => ({
          players: s.players.map((p) => {
            if (p.id !== id) return p;
            const { photo: _drop, ...rest } = p;
            return next ? { ...rest, photo: next } : rest;
          }),
        }));
        return ok();
      },

      removePlayer(id) {
        if (playersInActiveMatches(get().matches).has(id)) {
          return err('PLAYER_IN_MATCH', 'Finish or cancel their match first');
        }
        set((s) => ({
          players: s.players.filter((p) => p.id !== id),
          waitingQueue: s.waitingQueue.filter((pid) => pid !== id),
        }));
        return ok();
      },

      importPlayer(profile) {
        const parsedName = playerNameSchema.safeParse(profile.name);
        if (!parsedName.success) return err('INVALID_INPUT', 'Shared profile has no valid name');
        const clean = parsedName.data;

        const themeId = getPlayerTheme(profile.themeId).id;
        const photo = profile.photo && photoSchema.safeParse(profile.photo).success
          ? profile.photo
          : undefined;
        const stat = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

        const existing = get().players.find(
          (p) => p.name.toLowerCase() === clean.toLowerCase(),
        );

        if (existing) {
          // Refresh the existing profile from the shared snapshot (the sharer is
          // the source of truth for their own record). Never lower bestStreak.
          set((s) => ({
            players: s.players.map((p) =>
              p.id === existing.id
                ? {
                    ...p,
                    themeId,
                    ...(photo ? { photo } : {}),
                    wins: stat(profile.wins),
                    losses: stat(profile.losses),
                    streak: stat(profile.streak),
                    bestStreak: Math.max(p.bestStreak, stat(profile.bestStreak)),
                  }
                : p,
            ),
          }));
          return ok();
        }

        const player: Player = {
          id: makeId(),
          name: clean,
          themeId,
          ...(photo ? { photo } : {}),
          wins: stat(profile.wins),
          losses: stat(profile.losses),
          streak: stat(profile.streak),
          bestStreak: stat(profile.bestStreak),
          createdAt: Date.now(),
        };
        set((s) => ({ players: [...s.players, player] }));
        return ok();
      },

      // -- Courts ---------------------------------------------------------------
      addCourt(name) {
        const parsed = courtNameSchema.safeParse(name);
        if (!parsed.success) return err('INVALID_INPUT', parsed.error.issues[0].message);
        const court: Court = {
          id: makeId(),
          name: parsed.data,
          status: 'open',
          matchId: null,
        };
        set((s) => ({ courts: [...s.courts, court] }));
        return ok();
      },

      removeCourt(id) {
        const court = get().courts.find((c) => c.id === id);
        if (!court) return err('NOT_FOUND', 'Court not found');
        if (court.status === 'in_progress') {
          return err('COURT_BUSY', 'A match is in progress on this court');
        }
        set((s) => ({ courts: s.courts.filter((c) => c.id !== id) }));
        return ok();
      },

      // -- Waiting area ---------------------------------------------------------
      joinQueue(playerId) {
        const s = get();
        if (!s.players.some((p) => p.id === playerId)) return err('NOT_FOUND', 'Player not found');
        if (s.waitingQueue.includes(playerId)) return ok(); // idempotent
        if (playersInActiveMatches(s.matches).has(playerId)) {
          return err('PLAYER_IN_MATCH', 'Player is already in a match');
        }
        set((st) => ({ waitingQueue: [...st.waitingQueue, playerId] }));
        return ok();
      },

      leaveQueue(playerId) {
        set((s) => ({ waitingQueue: s.waitingQueue.filter((id) => id !== playerId) }));
        return ok();
      },

      // -- Match area -----------------------------------------------------------
      startMatch(courtId, type, teamA, teamB) {
        const s = get();
        const court = s.courts.find((c) => c.id === courtId);
        if (!court) return err('NOT_FOUND', 'Court not found');

        // Local analogue of the server-side row lock: never double-book a court.
        if (court.status === 'in_progress') {
          return err('COURT_BUSY', `${court.name} is already in use`);
        }

        const perTeam = type === 'singles' ? 1 : 2;
        if (teamA.length !== perTeam || teamB.length !== perTeam) {
          return err(
            'NEED_PLAYERS',
            type === 'singles'
              ? 'Pick 1 player per side'
              : 'Pick 2 players per side',
          );
        }

        const all = [...teamA, ...teamB];
        if (new Set(all).size !== all.length) {
          return err('PLAYER_OVERLAP', 'A player can only be on one team');
        }
        if (!all.every((id) => s.players.some((p) => p.id === id))) {
          return err('NOT_FOUND', 'Unknown player selected');
        }
        const busy = playersInActiveMatches(s.matches);
        if (all.some((id) => busy.has(id))) {
          return err('PLAYER_IN_MATCH', 'A selected player is already in a match');
        }

        const match: Match = {
          id: makeId(),
          courtId,
          type,
          teamA,
          teamB,
          scoreA: 0,
          scoreB: 0,
          status: 'active',
          winner: null,
          startedAt: Date.now(),
          completedAt: null,
        };

        set((st) => ({
          matches: [...st.matches, match],
          courts: st.courts.map((c) =>
            c.id === courtId ? { ...c, status: 'in_progress', matchId: match.id } : c,
          ),
          // Players who just went on court leave the waiting queue.
          waitingQueue: st.waitingQueue.filter((id) => !all.includes(id)),
        }));
        return ok();
      },

      startNextFromQueue(courtId, type) {
        const s = get();
        const court = s.courts.find((c) => c.id === courtId);
        if (!court) return err('NOT_FOUND', 'Court not found');
        if (court.status === 'in_progress') {
          return err('COURT_BUSY', `${court.name} is already in use`);
        }
        const q = s.waitingQueue;
        // Default to doubles when 4+ are waiting, otherwise singles.
        const chosen: MatchType = type ?? (q.length >= 4 ? 'doubles' : 'singles');
        const need = chosen === 'singles' ? 2 : 4;
        if (q.length < need) {
          return err('NEED_PLAYERS', `Need ${need} players in the waiting area`);
        }
        const picks = q.slice(0, need);
        const teamA = chosen === 'singles' ? [picks[0]] : [picks[0], picks[1]];
        const teamB = chosen === 'singles' ? [picks[1]] : [picks[2], picks[3]];
        // startMatch removes these players from the queue and marks the court busy.
        return get().startMatch(courtId, chosen, teamA, teamB);
      },

      recordResult(matchId, scoreA, scoreB) {
        const s = get();
        const match = s.matches.find((m) => m.id === matchId);
        if (!match || match.status !== 'active') return err('NOT_FOUND', 'Match not found');
        if (
          !Number.isInteger(scoreA) ||
          !Number.isInteger(scoreB) ||
          scoreA < 0 ||
          scoreB < 0 ||
          scoreA > 99 ||
          scoreB > 99
        ) {
          return err('INVALID_INPUT', 'Enter a valid final score');
        }
        if (scoreA === scoreB) {
          return err('INVALID_INPUT', 'Pickleball has no ties — pick a winner');
        }

        const winner: Team = scoreA > scoreB ? 'A' : 'B';
        const winners = winner === 'A' ? match.teamA : match.teamB;
        const losers = winner === 'A' ? match.teamB : match.teamA;

        const completed: MatchRecord = {
          ...match,
          scoreA,
          scoreB,
          status: 'completed',
          winner,
          completedAt: Date.now(),
        };

        set((st) => ({
          // Update win/loss records and win streaks.
          players: st.players.map((p) => {
            if (winners.includes(p.id)) {
              const streak = p.streak + 1;
              return {
                ...p,
                wins: p.wins + 1,
                streak,
                bestStreak: Math.max(p.bestStreak, streak),
              };
            }
            if (losers.includes(p.id)) return { ...p, losses: p.losses + 1, streak: 0 };
            return p;
          }),
          // Remove from active, add to history.
          matches: st.matches.filter((m) => m.id !== matchId),
          history: [completed, ...st.history].slice(0, 200),
          // Free the court.
          courts: st.courts.map((c) =>
            c.matchId === matchId ? { ...c, status: 'open', matchId: null } : c,
          ),
        }));
        // Auto-rotate: pull the next players from the queue onto the freed court.
        if (get().meta.autoRotate) get().startNextFromQueue(match.courtId);
        return ok();
      },

      editMatchRecord(recordId, scoreA, scoreB) {
        const s = get();
        const record = s.history.find((m) => m.id === recordId);
        if (!record) return err('NOT_FOUND', 'Recorded match not found');
        if (
          !Number.isInteger(scoreA) ||
          !Number.isInteger(scoreB) ||
          scoreA < 0 ||
          scoreB < 0 ||
          scoreA > 99 ||
          scoreB > 99
        ) {
          return err('INVALID_INPUT', 'Enter a valid final score');
        }
        if (scoreA === scoreB) {
          return err('INVALID_INPUT', 'Pickleball has no ties — pick a winner');
        }

        const newWinner: Team = scoreA > scoreB ? 'A' : 'B';
        const winnerFlipped = newWinner !== record.winner;

        // Adjust each affected player's W/L only when the winning side changed.
        // (A pure score correction leaves records untouched.)
        const updated: MatchRecord = {
          ...record,
          scoreA,
          scoreB,
          winner: newWinner,
        };
        const newHistory = s.history.map((m) => (m.id === recordId ? updated : m));

        let players = s.players;
        if (winnerFlipped) {
          const gainedW = newWinner === 'A' ? record.teamA : record.teamB; // now winners
          const gainedL = newWinner === 'A' ? record.teamB : record.teamA; // now losers
          const gW = new Set(gainedW);
          const gL = new Set(gainedL);
          players = players.map((p) => {
            if (gW.has(p.id)) {
              return { ...p, wins: p.wins + 1, losses: Math.max(0, p.losses - 1) };
            }
            if (gL.has(p.id)) {
              return { ...p, losses: p.losses + 1, wins: Math.max(0, p.wins - 1) };
            }
            return p;
          });
        }

        set({ history: newHistory, players: withRecomputedStreaks(players, newHistory) });
        return ok();
      },

      deleteMatchRecord(recordId) {
        const s = get();
        const record = s.history.find((m) => m.id === recordId);
        if (!record) return err('NOT_FOUND', 'Recorded match not found');

        const winners = new Set(record.winner === 'A' ? record.teamA : record.teamB);
        const losers = new Set(record.winner === 'A' ? record.teamB : record.teamA);
        const newHistory = s.history.filter((m) => m.id !== recordId);
        const players = s.players.map((p) => {
          if (winners.has(p.id)) return { ...p, wins: Math.max(0, p.wins - 1) };
          if (losers.has(p.id)) return { ...p, losses: Math.max(0, p.losses - 1) };
          return p;
        });

        set({ history: newHistory, players: withRecomputedStreaks(players, newHistory) });
        return ok();
      },

      cancelMatch(matchId) {
        const s = get();
        const match = s.matches.find((m) => m.id === matchId);
        if (!match) return err('NOT_FOUND', 'Match not found');
        set((st) => ({
          matches: st.matches.filter((m) => m.id !== matchId),
          courts: st.courts.map((c) =>
            c.matchId === matchId ? { ...c, status: 'open', matchId: null } : c,
          ),
        }));
        if (get().meta.autoRotate) get().startNextFromQueue(match.courtId);
        return ok();
      },

      setAutoRotate(on) {
        set((s) => ({ meta: { ...s.meta, autoRotate: on } }));
      },

      // -- Coach / onboarding ---------------------------------------------------
      dismissTutorial() {
        set((s) => ({ meta: { ...s.meta, tutorialDismissed: true } }));
      },

      restartTutorial() {
        set((s) => ({ meta: { ...s.meta, tutorialDismissed: false } }));
      },

      // -- Maintenance ----------------------------------------------------------
      resetAll() {
        set({
          players: [],
          courts: defaultCourts(),
          matches: [],
          history: [],
          waitingQueue: [],
          meta: defaultMeta(),
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 4,
      // Migrate older persisted state to the current shape. The legacy quest/XP
      // tutorial was replaced by the dynamic coach, so we drop `questsDone` and
      // keep returning users (who already have data) out of the coach.
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<AppData> & Record<string, unknown>;
        const players = (s.players ?? []).map((p) => ({
          ...p,
          streak: p.streak ?? 0,
          bestStreak: p.bestStreak ?? 0,
        })) as Player[];
        const history = (s.history ?? []) as MatchRecord[];

        // Drop any legacy `questsDone`; keep only the fields the coach needs.
        const existing = (s.meta ?? {}) as Partial<AppMeta> & { questsDone?: unknown };
        const isReturning = players.length > 0 || history.length > 0;
        const meta: AppMeta = {
          autoRotate: existing.autoRotate ?? false,
          // Anyone upgrading from a pre-coach version with data has already
          // learned the app — don't pop the coach back open on them.
          tutorialDismissed:
            version < 4 ? existing.tutorialDismissed ?? isReturning : existing.tutorialDismissed ?? false,
        };

        return { ...s, players, history, meta } as AppData;
      },
    },
  ),
);
