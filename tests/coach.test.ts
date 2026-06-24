import { describe, it, expect } from 'vitest';
import { COACH_STEPS, COACH_DONE_STEP, coachProgress, coachTargets } from '@/lib/coach';

describe('coachProgress', () => {
  it('advances through the core loop as state changes', () => {
    expect(coachProgress({ players: 0, activeMatches: 0, recorded: 0 }).current.id).toBe('first-player');
    expect(coachProgress({ players: 1, activeMatches: 0, recorded: 0 }).current.id).toBe('squad');
    expect(coachProgress({ players: 2, activeMatches: 0, recorded: 0 }).current.id).toBe('start-match');
    expect(coachProgress({ players: 2, activeMatches: 1, recorded: 0 }).current.id).toBe('record');
  });

  it('marks everything done once a result is recorded', () => {
    const p = coachProgress({ players: 2, activeMatches: 0, recorded: 1 });
    expect(p.allDone).toBe(true);
    expect(p.current.id).toBe(COACH_DONE_STEP.id);
    expect(p.doneCount).toBe(p.total);
  });
});

describe('coachTargets (the arrow anchors)', () => {
  it('every core step exposes an on-page anchor and a nav fallback', () => {
    for (const step of COACH_STEPS) {
      expect(step.anchor).toBeTruthy();
      expect(step.nudge).toBeTruthy();
      const targets = coachTargets(step);
      expect(targets[0].anchor).toBe(step.anchor);
      expect(targets.some((t) => t.anchor === step.navAnchor)).toBe(true);
    }
  });

  it('the "all done" step yields no arrow', () => {
    expect(coachTargets(COACH_DONE_STEP)).toHaveLength(0);
  });
});
