'use client';

import { useEffect } from 'react';
import { resumeSync } from '@/lib/sync';

/** Reconnects a previously-active sync session once on app load. */
export function SyncProvider() {
  useEffect(() => {
    void resumeSync();
  }, []);
  return null;
}
