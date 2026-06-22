import type { Player } from '@/lib/types';
import { getPlayerTheme, playerNameStyle } from '@/lib/playerThemes';
import { initials, cn, shade } from '@/lib/utils';

/** Renders a player's name in their chosen theme — solid, legible colour + glow. */
export function PlayerName({ player, className }: { player: Player; className?: string }) {
  const theme = getPlayerTheme(player.themeId);
  return (
    <span
      className={cn('font-display font-bold tracking-wide', className)}
      style={playerNameStyle(theme)}
    >
      {player.name}
    </span>
  );
}

/**
 * Circular avatar chip carrying the player's theme colours. Shows their profile
 * photo when set (kept inside the themed ring + glow so it still feels on-brand),
 * otherwise falls back to gradient initials.
 */
export function PlayerChip({
  player,
  size = 40,
}: {
  player: Player;
  size?: number;
}) {
  const theme = getPlayerTheme(player.themeId);
  if (player.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local data URL, no remote fetch / optimization needed
      <img
        src={player.photo}
        alt=""
        aria-hidden
        className="inline-block shrink-0 rounded-full object-cover"
        style={{
          width: size,
          height: size,
          boxShadow: `0 0 0 2px ${theme.accent}, 0 0 14px ${theme.accent}55`,
        }}
      />
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        // Inline gradient (no Tailwind purge / backdrop-blur fragility) so the
        // chip always fills; dark initials stay readable on every bright theme.
        background: `linear-gradient(135deg, ${shade(theme.accent, 22)}, ${shade(theme.accent, -18)})`,
        color: '#06182F',
        boxShadow: `0 0 0 2px ${theme.accent}, 0 0 14px ${theme.accent}55`,
      }}
      aria-hidden
    >
      {initials(player.name)}
    </span>
  );
}
