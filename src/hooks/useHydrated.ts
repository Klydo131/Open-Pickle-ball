'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true only after the component has mounted on the client.
 *
 * The store reads from localStorage, which doesn't exist during server
 * rendering. Gating persisted UI on this flag prevents React hydration
 * mismatches (server renders the empty/placeholder state, client fills in).
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
