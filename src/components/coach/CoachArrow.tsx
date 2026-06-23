'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { CoachTarget } from '@/lib/coach';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** First on-screen, visible element matching one of the target anchors. */
function findTarget(targets: CoachTarget[]): { el: HTMLElement; label: string } | null {
  for (const t of targets) {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-coach="${t.anchor}"]`),
    );
    const visible = els.find((el) => {
      const r = el.getBoundingClientRect();
      // offsetParent is null for display:none — skips the hidden nav variant.
      return r.width > 0 && r.height > 0 && el.offsetParent !== null;
    });
    if (visible) return { el: visible, label: t.label };
  }
  return null;
}

/**
 * A live "tap here" coach mark: a pulsing pickle-yellow ring around the next
 * action plus a bouncing arrow + label pointing at it. Purely an overlay — it's
 * `pointer-events-none`, so taps still reach the real button underneath.
 *
 * It re-measures on scroll / resize and on a short interval, so it keeps tracking
 * the target as the user navigates, opens modals, or the layout shifts.
 */
export function CoachArrow({ targets }: { targets: CoachTarget[] }) {
  const [mounted, setMounted] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const [label, setLabel] = useState('Tap here');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || targets.length === 0) {
      setBox(null);
      return;
    }
    let frame = 0;
    const measure = () => {
      const hit = findTarget(targets);
      if (!hit) {
        setBox(null);
        return;
      }
      const r = hit.el.getBoundingClientRect();
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
      setLabel(hit.label);
    };
    // Measure on the next frame (after navigation / modal paint), then poll.
    frame = requestAnimationFrame(measure);
    const interval = window.setInterval(measure, 400);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(interval);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [targets, mounted]);

  if (!mounted || !box) return null;

  const pad = 6;
  const ring: React.CSSProperties = {
    top: box.top - pad,
    left: box.left - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };

  // Not enough room above the target → place the arrow below it, pointing up.
  const placeBelow = box.top < 104;
  const centerX = Math.min(Math.max(box.left + box.width / 2, 78), window.innerWidth - 78);

  const arrowStyle: React.CSSProperties = placeBelow
    ? { top: box.top + box.height + 10, left: centerX, transform: 'translateX(-50%)' }
    : { top: box.top - 10, left: centerX, transform: 'translate(-50%, -100%)' };

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      {/* pulsing spotlight ring around the next action */}
      <span
        className="absolute rounded-xl ring-2 ring-pickle motion-safe:animate-coach-ring"
        style={ring}
      />
      {/* bouncing arrow + label (outer span positions; inner span animates so the
          bob never clobbers the centering transform) */}
      <span className="absolute" style={arrowStyle}>
        <span className="flex flex-col items-center gap-1 motion-safe:animate-coach-bob">
          {placeBelow ? (
            <>
              <ArrowUp className="h-6 w-6 text-pickle drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
              <span className="rounded-full bg-pickle px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-ocean-950 shadow-card">
                {label}
              </span>
            </>
          ) : (
            <>
              <span className="rounded-full bg-pickle px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-ocean-950 shadow-card">
                {label}
              </span>
              <ArrowDown className="h-6 w-6 text-pickle drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
            </>
          )}
        </span>
      </span>
    </div>,
    document.body,
  );
}
