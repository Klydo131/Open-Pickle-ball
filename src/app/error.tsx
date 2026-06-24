'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';

/**
 * Route-level error boundary. A render error here never white-screens the app —
 * the user gets a friendly, on-brand recovery screen, and because all data lives
 * in localStorage it is untouched by a UI crash.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface for local debugging; we never phone home.
    console.error('Open Pickleball hit a render error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-serve/15 text-serve">
        <AlertTriangle className="h-8 w-8" />
      </span>
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
        Something glitched on the court
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        A part of the app hit an unexpected error. Your players, matches and records are safe —
        they live on this device and weren’t touched.
      </p>
      <button
        onClick={reset}
        className="btn-press mt-6 flex items-center gap-2 rounded-md bg-pickle px-5 py-3 font-display text-sm font-bold uppercase tracking-wide text-ocean-950 hover:shadow-glow"
      >
        <RotateCcw className="h-5 w-5" /> Try again
      </button>
      <p className="mt-6 flex items-center gap-2 text-[11px] text-muted">
        <ShieldCheck className="h-4 w-4 text-electric" /> Nothing was sent anywhere. 100% local.
      </p>
    </div>
  );
}
