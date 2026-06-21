import type { Player } from '@/lib/types';
import { getPlayerTheme, playerNameStyle } from '@/lib/playerThemes';
import { initials, cn } from '@/lib/utils';

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

/** Circular avatar chip carrying the player's theme colours + initials. */
export function PlayerChip({
  player,
  size = 40,
}: {
  player: Player;
  size?: number;
}) {
  const theme = getPlayerTheme(player.themeId);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-display font-bold text-ocean-950',
        theme.chipClass,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        // Crisp themed ring + soft outer glow so the chip feels integrated.
        boxShadow: `0 0 0 2px ${theme.accent}, 0 0 14px ${theme.accent}55`,
      }}
      aria-hidden
    >
      {initials(player.name)}
    </span>
  );
}
