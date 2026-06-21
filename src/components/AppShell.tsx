'use client';

import { useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { Toaster } from './ui/Toaster';
import { QuestBox } from './quest/QuestBox';
import { SyncProvider } from './sync/SyncProvider';

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
    <div className="court-lines relative min-h-[100dvh] overflow-hidden lg:pl-60">
      {/* Ambient drifting glows — subtle depth behind everything. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-electric/10 blur-3xl animate-drift-slow motion-reduce:animate-none" />
        <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-serve/10 blur-3xl animate-drift-slower motion-reduce:animate-none" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pickle/5 blur-3xl animate-drift-slow motion-reduce:animate-none" />
      </div>

      <Toaster />
      <SyncProvider />
      <SideNav />
      <main className="mx-auto w-full max-w-md px-5 pb-safe-nav pt-safe lg:max-w-6xl lg:px-10 lg:pb-16 lg:pt-6">
        {children}
      </main>
      <BottomNav />
      <QuestBox />
    </div>
  );
}
