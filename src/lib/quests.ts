/**
 * Quest tutorial definitions.
 *
 * Quests teach the core loop. Each quest is "completed" by actually doing the
 * action in the app — the store latches completion into `meta.questsDone` (via
 * `completeQuest`) so a quest never un-completes once earned.
 *
 * Keep this list ordered: it doubles as the recommended first-session flow.
 */
export type QuestId =
  | 'add-player'
  | 'theme'
  | 'roster'
  | 'start-match'
  | 'record'
  | 'waiting';

export interface QuestDef {
  id: QuestId;
  title: string;
  hint: string;
  /** lucide-react icon name resolved in the QuestBox. */
  icon: 'UserPlus' | 'Palette' | 'Users' | 'Swords' | 'Trophy' | 'Hourglass';
  /** Where the action lives, for the "Go" deep link. */
  href: string;
  xp: number;
}

export const QUESTS: QuestDef[] = [
  {
    id: 'add-player',
    title: 'Sign your first player',
    hint: 'Open Players and add a name to the roster.',
    icon: 'UserPlus',
    href: '/players',
    xp: 100,
  },
  {
    id: 'theme',
    title: 'Style a name theme',
    hint: 'Pick a gradient theme for any player.',
    icon: 'Palette',
    href: '/players',
    xp: 100,
  },
  {
    id: 'roster',
    title: 'Build a squad of four',
    hint: 'Add at least four players — enough for doubles.',
    icon: 'Users',
    href: '/players',
    xp: 150,
  },
  {
    id: 'start-match',
    title: 'Start a match',
    hint: 'Send players onto an open court.',
    icon: 'Swords',
    href: '/play?create=1',
    xp: 200,
  },
  {
    id: 'record',
    title: 'Record a result',
    hint: 'Log the final score and crown a winner.',
    icon: 'Trophy',
    href: '/play',
    xp: 200,
  },
  {
    id: 'waiting',
    title: 'Use the waiting area',
    hint: 'Send a player to the queue for the next court.',
    icon: 'Hourglass',
    href: '/players',
    xp: 100,
  },
];

export const TOTAL_QUEST_XP = QUESTS.reduce((sum, q) => sum + q.xp, 0);

/** Level tiers based on XP earned, shown in the Quest box. */
export const LEVELS = [
  { name: 'Rookie', min: 0 },
  { name: 'Rallyer', min: 200 },
  { name: 'Contender', min: 450 },
  { name: 'Court Boss', min: 850 },
] as const;

export function levelForXp(xp: number): { name: string; index: number } {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) idx = i;
  }
  return { name: LEVELS[idx].name, index: idx };
}
