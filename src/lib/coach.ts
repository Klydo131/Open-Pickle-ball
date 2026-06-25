/**
 * The guided coach — a dynamic, no-XP onboarding.
 *
 * Instead of a gamified quest log, the coach reads the *actual* app state and
 * always points at the single most useful next action, so people learn the app
 * by using it. As soon as a step is satisfied it advances; once the core loop is
 * learned it steps back and just points to Help for the deeper features.
 *
 * Keep steps ordered — the list doubles as the recommended first-session flow.
 */

export type CoachIcon = 'UserPlus' | 'Users' | 'Swords' | 'Trophy' | 'Sparkles';

/** A snapshot of the bits of state the coach reasons about. */
export interface CoachState {
  players: number;
  activeMatches: number;
  recorded: number;
}

export interface CoachStep {
  id: string;
  /** Short imperative headline. */
  title: string;
  /** One concise, actionable line — what to do, right now. */
  body: string;
  /** Button label for the deep link. */
  cta: string;
  href: string;
  icon: CoachIcon;
  /**
   * `data-coach` value of the on-page element this step wants the user to tap.
   * The coach renders an animated arrow pointing at it when it's on screen.
   */
  anchor?: string;
  /** Tiny label shown on the arrow pointing at `anchor` (e.g. "Add here"). */
  nudge?: string;
  /** `data-coach` of the nav item to reach this step's page (arrow fallback). */
  navAnchor?: string;
  /** Tiny label for the nav-fallback arrow (e.g. "Open Players"). */
  navNudge?: string;
  /** True once the state proves the user has done this. */
  done: (s: CoachState) => boolean;
}

/** One resolved arrow target: a `data-coach` anchor + the label to show on it. */
export interface CoachTarget {
  anchor: string;
  label: string;
}

/**
 * Ordered arrow targets for a step: the on-page action first, then the nav item
 * that gets you to that page. The arrow component points at the first one that's
 * actually visible, so it guides you onto the right screen and then to the exact
 * control once you're there.
 */
export function coachTargets(step: CoachStep): CoachTarget[] {
  const targets: CoachTarget[] = [];
  if (step.anchor) targets.push({ anchor: step.anchor, label: step.nudge ?? 'Tap here' });
  if (step.navAnchor) targets.push({ anchor: step.navAnchor, label: step.navNudge ?? 'Go here' });
  return targets;
}

/** The core loop, taught in order. */
export const COACH_STEPS: CoachStep[] = [
  {
    id: 'first-player',
    title: 'Sign in your first player',
    body: 'Open Players and add a name — that’s their profile on this device. Add a photo if you like.',
    cta: 'Add a player',
    href: '/players',
    icon: 'UserPlus',
    anchor: 'add-player',
    nudge: 'Add here',
    navAnchor: 'nav-players',
    navNudge: 'Open Players',
    done: (s) => s.players >= 1,
  },
  {
    id: 'squad',
    title: 'Add a couple more',
    body: 'You need at least two players for a match (four for doubles). Build out your crew.',
    cta: 'Add players',
    href: '/players',
    icon: 'Users',
    anchor: 'add-player',
    nudge: 'Add here',
    navAnchor: 'nav-players',
    navNudge: 'Open Players',
    done: (s) => s.players >= 2,
  },
  {
    id: 'start-match',
    title: 'Start a match',
    body: 'Go to Play, tap Start on an open court, pick singles or doubles, and choose the players.',
    cta: 'Start a match',
    href: '/play?create=1',
    icon: 'Swords',
    anchor: 'start-match',
    nudge: 'Start here',
    navAnchor: 'nav-play',
    navNudge: 'Open Play',
    done: (s) => s.activeMatches >= 1 || s.recorded >= 1,
  },
  {
    id: 'record',
    title: 'Record the score',
    body: 'When the game ends, tap Record on the court and enter the final score to crown a winner.',
    cta: 'Go to courts',
    href: '/play',
    icon: 'Trophy',
    anchor: 'record-result',
    nudge: 'Record here',
    navAnchor: 'nav-play',
    navNudge: 'Open Play',
    done: (s) => s.recorded >= 1,
  },
];

/** The "you’ve got the basics" tip shown once the core loop is complete. */
export const COACH_DONE_STEP: CoachStep = {
  id: 'explore',
  title: 'You’ve got the basics!',
  body: 'Now explore the fun stuff: name themes, profile photos, share a profile by QR, and export your records.',
  cta: 'See all features',
  href: '/help',
  icon: 'Sparkles',
  done: () => true,
};

export interface CoachProgress {
  /** The step to surface now, or the celebratory done step. */
  current: CoachStep;
  /** Number of core steps completed. */
  doneCount: number;
  /** Total core steps. */
  total: number;
  /** True when every core step is done. */
  allDone: boolean;
}

/** Compute which step the coach should show for the given state. */
export function coachProgress(state: CoachState): CoachProgress {
  const doneCount = COACH_STEPS.filter((s) => s.done(state)).length;
  const next = COACH_STEPS.find((s) => !s.done(state));
  return {
    current: next ?? COACH_DONE_STEP,
    doneCount,
    total: COACH_STEPS.length,
    allDone: !next,
  };
}
