'use client';

import { useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { Toaster } from './ui/Toaster';

/**
 * App frame: registers the service worker (PWA / offline), constrains content
 * to a mobile-first column that still looks right on desktop, and renders the
 * persistent bottom navigation + toast layer.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* offline support is best-effort; never block the app */
      });
    }
  }, []);

  return (
    <div className="court-lines relative min-h-[100dvh]">
      <Toaster />
      <main className="mx-auto w-full max-w-md px-5 pb-safe-nav pt-safe">{children}</main>
      <BottomNav />
    </div>
  );
}
