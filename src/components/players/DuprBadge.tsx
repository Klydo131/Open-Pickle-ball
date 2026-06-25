import type { Player } from '@/lib/types';
import {
  duprModeLabel,
  duprReliable,
  formatDuprRating,
  formatDuprReliability,
  normalizeDuprRating,
  playerDuprRating,
  playerDuprReliability,
} from '@/lib/dupr';
import { cn } from '@/lib/utils';

export function DuprBadge({
  player,
  className,
  showMode = false,
}: {
  player: Player;
  className?: string;
  showMode?: boolean;
}) {
  const rating = playerDuprRating(player);
  const reliability = playerDuprReliability(player);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-pickle/40 bg-pickle/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pickle',
        className,
      )}
      title={`Local DUPR-style rating with ${formatDuprReliability(reliability)} reliability`}
    >
      DUPR <b className="text-white">{formatDuprRating(rating)}</b>
      <span className={duprReliable(reliability) ? 'text-emerald-300' : 'text-muted'}>
        {formatDuprReliability(reliability)}
      </span>
      {showMode && <span className="text-muted">{duprModeLabel(player)}</span>}
    </span>
  );
}

export function DuprMiniStats({ player }: { player: Player }) {
  const dupr = normalizeDuprRating(player.dupr);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
      <span>
        Singles <b className="text-white">{formatDuprRating(dupr.singles)}</b>{' '}
        <span className="text-muted/70">{formatDuprReliability(dupr.singlesReliability)}</span>
      </span>
      <span>
        Doubles <b className="text-white">{formatDuprRating(dupr.doubles)}</b>{' '}
        <span className="text-muted/70">{formatDuprReliability(dupr.doublesReliability)}</span>
      </span>
    </div>
  );
}
