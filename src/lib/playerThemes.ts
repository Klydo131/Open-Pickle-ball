/**
 * Name themes. Players "choose their theme in their name" — the theme colours
 * the player's name (and avatar) everywhere it appears.
 *
 * Readability first: names render as a SOLID, high-contrast colour tuned for the
 * dark cards (with a subtle glow for a sporty feel), not a clip-path gradient —
 * gradient text breaks inside the glassy `backdrop-blur` cards and reads poorly
 * on bright themes. The richer gradient lives on the avatar chip, where a filled
 * shape renders it reliably.
 */
export interface PlayerTheme {
  id: string;
  label: string;
  /** Vivid brand colour — avatar gradient + ring + name glow. */
  accent: string;
  /** Legible name colour, tuned for contrast on the dark card. */
  name: string;
}

export const PLAYER_THEMES: PlayerTheme[] = [
  { id: 'pickle', label: 'Pickle Bolt', accent: '#FFD626', name: '#FFDD4D' },
  { id: 'serve', label: 'Serve Fire', accent: '#FF314F', name: '#FF7585' },
  { id: 'electric', label: 'Electric Ace', accent: '#32A7FF', name: '#6FC0FF' },
  { id: 'court', label: 'Court King', accent: '#34D399', name: '#5BE9B4' },
  { id: 'sunset', label: 'Sunset Smash', accent: '#F472B6', name: '#FBA3D2' },
  { id: 'frost', label: 'Frost Dink', accent: '#CBD5E1', name: '#EEF3FA' },
];

export const DEFAULT_THEME_ID = PLAYER_THEMES[0].id;

export function getPlayerTheme(themeId: string): PlayerTheme {
  return PLAYER_THEMES.find((t) => t.id === themeId) ?? PLAYER_THEMES[0];
}

/** Inline style for a themed player name: legible solid colour + sporty glow. */
export function playerNameStyle(theme: PlayerTheme): React.CSSProperties {
  return {
    color: theme.name,
    textShadow: `0 1px 2px rgba(0,0,0,0.6), 0 0 16px ${theme.accent}33`,
  };
}
