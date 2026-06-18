import { SportCard } from './SportCard';

interface Props {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}

/** Friendly sports-copy empty state with one strong action. */
export function EmptyState({ icon, title, message, action }: Props) {
  return (
    <SportCard className="flex flex-col items-center px-6 py-10 text-center" halftone>
      <div className="mb-3 text-electric">{icon}</div>
      <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </SportCard>
  );
}
