import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  action?: { label: string; href: string };
  className?: string;
}

/** Uppercase section header with the red slash marker on the left. */
export function SectionHeader({ title, action, className }: Props) {
  return (
    <div className={cn('mb-3 flex items-center justify-between', className)}>
      <h2 className="slash-header font-display text-base font-bold uppercase italic tracking-wide text-white">
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="font-display text-sm font-bold uppercase tracking-wide text-serve hover:text-white"
        >
          {action.label} ›
        </Link>
      )}
    </div>
  );
}
