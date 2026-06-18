'use client';

import { create } from 'zustand';
import { makeId } from './utils';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  push: (tone: ToastTone, message: string) => void;
  dismiss: (id: string) => void;
}

/** Lightweight, dependency-free toast queue used for realtime-style feedback. */
export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (tone, message) => {
    const id = makeId();
    set((s) => ({ toasts: [...s.toasts, { id, tone, message }] }));
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 2600);
    }
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience: surface an ActionResult as a toast. */
export function toast(tone: ToastTone, message: string): void {
  useToasts.getState().push(tone, message);
}
