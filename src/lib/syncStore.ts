'use client';

import { create } from 'zustand';

export type SyncStatus = 'off' | 'connecting' | 'live' | 'error';

/**
 * Ephemeral UI state for cloud sync (NOT persisted in the synced document).
 * The actual connection lifecycle lives in lib/sync.ts; this just drives the
 * Sync button + modal.
 */
interface SyncState {
  status: SyncStatus;
  code: string | null;
  role: 'host' | 'guest' | null;
  error?: string;
}

export const useSyncStore = create<SyncState>(() => ({
  status: 'off',
  code: null,
  role: null,
  error: undefined,
}));
