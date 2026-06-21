'use client';

import { useState } from 'react';
import { Cloud } from 'lucide-react';
import { useSyncStore } from '@/lib/syncStore';
import { SyncModal } from './SyncModal';
import { cn } from '@/lib/utils';

const dot: Record<string, string> = {
  live: 'bg-emerald-400',
  connecting: 'bg-pickle',
  error: 'bg-serve',
  off: 'bg-muted/50',
};

/**
 * Cloud-sync entry point. `sidebar` variant matches the desktop nav rows;
 * `icon` variant is a compact round button for the mobile headers.
 */
export function SyncButton({ variant = 'icon' }: { variant?: 'sidebar' | 'icon' }) {
  const [open, setOpen] = useState(false);
  const status = useSyncStore((s) => s.status);

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-3 font-display text-sm font-bold uppercase tracking-wide text-muted transition-colors hover:bg-ocean-900/60 hover:text-white"
        >
          <span className="relative">
            <Cloud className="h-5 w-5" />
            <span className={cn('absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-ocean-950', dot[status])} />
          </span>
          Sync
          {status === 'live' && <span className="ml-auto text-[10px] text-emerald-400">LIVE</span>}
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Cloud sync"
          className="btn-press relative rounded-full border border-glass/60 p-2 text-muted hover:border-pickle/60 hover:text-pickle"
        >
          <Cloud className="h-5 w-5" />
          <span className={cn('absolute right-1 top-1 h-2 w-2 rounded-full ring-2 ring-ocean-950', dot[status])} />
        </button>
      )}
      <SyncModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
