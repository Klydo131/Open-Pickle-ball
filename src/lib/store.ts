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
 *     in the brief. To move to a real server (Supabase/Postgres), implement the
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
  Court,
  Match,
  MatchRecord,
  MatchType,
  Player,
  Team,
} from './types';
import { makeId } from './utils';
import { playerNameSchema, courtNameSchema, themeIdSchema } from './validation';
import { DEFAULT_THEME_ID } from './playerThemes';

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

const initialData: AppData = {
  players: [],
  courts: defaultCourts(),
  matches: [],
  history: [],
  waitingQueue: [],
};

interface StoreActions {
  // -- Players ----------------------------------------------------------------
  addPlayer(name: string, themeId?: string): ActionResult;
  renamePlayer(id: string, name: string): ActionResult;
  setPlayerTheme(id: string, themeId: string): ActionResult;
  removePlayer(id: string): ActionResult;

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
  recordResult(matchId: string, scoreA: number, scoreB: number): ActionResult;
  cancelMatch(matchId: string): ActionResult;

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

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialData,

      // -- Players --------------------------------------------------------------
      addPlayer(name, themeId = DEFAULT_THEME_ID) {
        const parsedName = playerNameSchema.safeParse(name);
        if (!parsedName.success) {
          return err('INVALID_INPUT', parsedName.error.issues[0].message);
        }
        const parsedTheme = themeIdSchema.safeParse(themeId);
        const finalTheme = parsedTheme.success ? parsedTheme.data : DEFAULT_THEME_ID;

        const clean = parsedName.data;
        const exists = get().players.some(
          (p) => p.name.toLowerCase() === clean.toLowerCase(),
        );
        if (exists) return err('DUPLICATE_NAME', `${clean} is already on the roster`);

        const player: Player = {
          id: makeId(),
          name: clean,
          themeId: finalTheme,
          wins: 0,
          losses: 0,
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
          // Update win/loss records.
          players: st.players.map((p) => {
            if (winners.includes(p.id)) return { ...p, wins: p.wins + 1 };
            if (losers.includes(p.id)) return { ...p, losses: p.losses + 1 };
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
        return ok();
      },

      // -- Maintenance ----------------------------------------------------------
      resetAll() {
        set({
          players: [],
          courts: defaultCourts(),
          matches: [],
          history: [],
          waitingQueue: [],
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
    },
  ),
);
