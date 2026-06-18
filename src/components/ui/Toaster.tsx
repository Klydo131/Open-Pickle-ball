'use client';

import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { useToasts, type ToastTone } from '@/lib/toast';
import { cn } from '@/lib/utils';

const toneStyles: Record<ToastTone, { ring: string; icon: React.ReactNode }> = {
  success: { ring: 'border-emerald-400/60', icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" /> },
  error: { ring: 'border-serve/70', icon: <XCircle className="h-5 w-5 text-serve" /> },
  info: { ring: 'border-electric/60', icon: <Info className="h-5 w-5 text-electric" /> },
};

/** Fixed toast stack. Matches the brief's "lightweight toast" interaction. */
export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 pt-safe">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md border bg-ocean-900/95 px-4 py-3 text-left shadow-card backdrop-blur animate-fade-up',
            toneStyles[t.tone].ring,
          )}
        >
          {toneStyles[t.tone].icon}
          <span className="text-sm font-medium text-white">{t.message}</span>
        </button>
      ))}
    </div>
  );
}
