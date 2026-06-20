'use client';

import { useEffect, useState } from 'react';
import { formatClock } from '@/lib/utils';

/**
 * Live match clock — ticks every second from `startedAt`. Pure UI (no store
 * writes); the elapsed time is always derived from the timestamp so it stays
 * correct across reloads.
 */
export function LiveTimer({
  startedAt,
  className,
}: {
  startedAt: number;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time className={className} dateTime={new Date(startedAt).toISOString()}>
      {formatClock(now - startedAt)}
    </time>
  );
}
