/**
 * Domain types for Open Pickleball.
 *
 * These types are deliberately backend-agnostic. The local-first store and any
 * future remote backend (see ARCHITECTURE.md) both speak in terms of these
 * shapes, so swapping storage never changes the UI.
 */

/** A registered player. Names are "connected" simply by existing in the roster. */
export interface Player {
  id: string;
  name: string;
  /** Key into PLAYER_THEMES — controls how the player's name is styled. */
  themeId: string;
  wins: number;
  losses: number;
  /** Current consecutive wins (resets to 0 on a loss). */
  streak: number;
  /** Longest win streak ever achieved. */
  bestStreak: number;
  createdAt: number;
}

export type CourtStatus = 'open' | 'in_progress';

/** A physical court. The number of courts is configurable by the user. */
export interface Court {
  id: string;
  name: string;
  status: CourtStatus;
  /** The match currently being played on this court, if any. */
  matchId: string | null;
}

export type MatchType = 'singles' | 'doubles';
export type MatchStatus = 'active' | 'completed';
export type Team = 'A' | 'B';

/** A match assigned to a court. Teams reference player ids. */
export interface Match {
  id: string;
  courtId: string;
  type: MatchType;
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
  status: MatchStatus;
  /** Set when completed. */
  winner: Team | null;
  startedAt: number;
  completedAt: number | null;
}

/** A completed match kept for history / records. */
export interface MatchRecord extends Match {
  status: 'completed';
  winner: Team;
  completedAt: number;
}

/** Onboarding / tutorial state for the gamified Quest box. */
export interface AppMeta {
  /** Ids of quests the user has completed (latches true once done). */
  questsDone: string[];
  /** True once the user dismisses (or finishes) the tutorial. */
  tutorialDismissed: boolean;
}

/** The full persisted application state. */
export interface AppData {
  players: Player[];
  courts: Court[];
  matches: Match[];
  history: MatchRecord[];
  /** Ordered player ids waiting for a free court. First in, first on. */
  waitingQueue: string[];
  meta: AppMeta;
}
