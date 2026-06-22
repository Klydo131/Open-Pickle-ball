'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MatchRecord, Player } from '@/lib/types';
import { rankPlayers } from '@/lib/selectors';
import { winRate } from '@/lib/utils';

/**
 * A clean, light, paper-friendly rendering of the records — hidden on screen,
 * shown only when printing (see the `.print-sheet` rules in globals.css). It's
 * portaled to <body> so the print stylesheet can hide everything else and lay
 * this out edge-to-edge. Used by the "Save as PDF / Print" action.
 */
export function RecordsPrintSheet({
  players,
  history,
}: {
  players: Player[];
  history: MatchRecord[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const board = rankPlayers(players).filter((p) => p.wins + p.losses > 0);
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? 'Player';
  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return createPortal(
    <div className="print-sheet">
      <h1>🥒 Open Pickleball — Records</h1>
      <p className="ps-meta">
        Exported {new Date().toLocaleString()} · {board.length} ranked players · {history.length} matches
      </p>

      <h2>Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th className="num">W</th>
            <th className="num">L</th>
            <th className="num">Win %</th>
            <th className="num">Best streak</th>
          </tr>
        </thead>
        <tbody>
          {board.length === 0 ? (
            <tr>
              <td colSpan={6}>No ranked players yet.</td>
            </tr>
          ) : (
            board.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>{p.name}</td>
                <td className="num">{p.wins}</td>
                <td className="num">{p.losses}</td>
                <td className="num">{winRate(p.wins, p.losses)}%</td>
                <td className="num">{p.bestStreak}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2>Recent results</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Result</th>
            <th className="num">Score</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 ? (
            <tr>
              <td colSpan={3}>No matches recorded yet.</td>
            </tr>
          ) : (
            history.map((m) => {
              const winners = (m.winner === 'A' ? m.teamA : m.teamB).map(nameOf).join(' & ');
              const losers = (m.winner === 'A' ? m.teamB : m.teamA).map(nameOf).join(' & ');
              return (
                <tr key={m.id}>
                  <td>{fmt(m.completedAt)}</td>
                  <td>
                    <b>{winners}</b> def. {losers}
                  </td>
                  <td className="num">
                    {Math.max(m.scoreA, m.scoreB)}–{Math.min(m.scoreA, m.scoreB)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>,
    document.body,
  );
}
