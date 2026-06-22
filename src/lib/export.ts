'use client';

/**
 * Records export — local, offline, dependency-free.
 *
 * Everything is generated in the browser from the local store and handed to the
 * user as a download (Word .doc / CSV) or sent to the print dialog (Save as
 * PDF). No data leaves the device. The print path is handled by a dedicated
 * print sheet + `@media print` styles; this module covers file downloads and
 * the shared HTML used for Word.
 */

import type { MatchRecord, Player } from './types';
import { rankPlayers } from './selectors';
import { winRate } from './utils';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Players who have actually played, ranked for the board. */
function ranked(players: Player[]): Player[] {
  return rankPlayers(players).filter((p) => p.wins + p.losses > 0);
}

/** Trigger a client-side file download (revokes the object URL afterwards). */
export function downloadFile(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Leaderboard + recent results as CSV (opens in any spreadsheet). */
export function downloadRecordsCsv(players: Player[], history: MatchRecord[]): void {
  const board = ranked(players);
  const csvCell = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines: string[] = [];
  lines.push('Leaderboard');
  lines.push(['Rank', 'Player', 'Wins', 'Losses', 'Win %', 'Best streak'].map(csvCell).join(','));
  board.forEach((p, i) => {
    lines.push(
      [i + 1, p.name, p.wins, p.losses, winRate(p.wins, p.losses), p.bestStreak]
        .map(csvCell)
        .join(','),
    );
  });
  lines.push('');
  lines.push('Recent results');
  lines.push(['Date', 'Winners', 'Losers', 'Score'].map(csvCell).join(','));
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? 'Player';
  for (const m of history) {
    const winners = (m.winner === 'A' ? m.teamA : m.teamB).map(nameOf).join(' & ');
    const losers = (m.winner === 'A' ? m.teamB : m.teamA).map(nameOf).join(' & ');
    const score = `${Math.max(m.scoreA, m.scoreB)}-${Math.min(m.scoreA, m.scoreB)}`;
    lines.push([fmtDate(m.completedAt), winners, losers, score].map(csvCell).join(','));
  }

  downloadFile(`open-pickleball-records-${stamp()}.csv`, 'text/csv;charset=utf-8', lines.join('\n'));
}

/** Self-contained HTML used both for the Word download and as a print fallback. */
export function recordsHtml(players: Player[], history: MatchRecord[]): string {
  const board = ranked(players);
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? 'Player';

  const boardRows = board
    .map(
      (p, i) => `<tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(p.name)}</td>
        <td class="num">${p.wins}</td>
        <td class="num">${p.losses}</td>
        <td class="num">${winRate(p.wins, p.losses)}%</td>
        <td class="num">${p.bestStreak}</td>
      </tr>`,
    )
    .join('');

  const resultRows = history
    .map((m) => {
      const winners = (m.winner === 'A' ? m.teamA : m.teamB).map(nameOf).join(' &amp; ');
      const losers = (m.winner === 'A' ? m.teamB : m.teamA).map(nameOf).join(' &amp; ');
      const score = `${Math.max(m.scoreA, m.scoreB)}–${Math.min(m.scoreA, m.scoreB)}`;
      return `<tr>
        <td>${escapeHtml(fmtDate(m.completedAt))}</td>
        <td><b>${escapeHtml(winners)}</b> def. ${escapeHtml(losers)}</td>
        <td class="num">${score}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Open Pickleball — Records</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #0c1b30; margin: 32px; }
  h1 { margin: 0 0 2px; font-size: 24px; }
  h2 { margin: 28px 0 8px; font-size: 16px; border-bottom: 2px solid #FFD626; padding-bottom: 4px; }
  .meta { color: #5b6b80; font-size: 12px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #d7dee8; }
  th { background: #f1f5fb; text-transform: uppercase; font-size: 11px; letter-spacing: .04em; color: #41526b; }
  td.num, th.num { text-align: right; }
</style></head>
<body>
  <h1>🥒 Open Pickleball — Records</h1>
  <div class="meta">Exported ${escapeHtml(fmtDate(Date.now()))} · ${board.length} ranked players · ${history.length} matches</div>
  <h2>Leaderboard</h2>
  <table>
    <thead><tr><th>#</th><th>Player</th><th class="num">W</th><th class="num">L</th><th class="num">Win %</th><th class="num">Best streak</th></tr></thead>
    <tbody>${boardRows || '<tr><td colspan="6">No ranked players yet.</td></tr>'}</tbody>
  </table>
  <h2>Recent results</h2>
  <table>
    <thead><tr><th>Date</th><th>Result</th><th class="num">Score</th></tr></thead>
    <tbody>${resultRows || '<tr><td colspan="3">No matches recorded yet.</td></tr>'}</tbody>
  </table>
</body></html>`;
}

/** Download records as a Word-openable .doc (HTML with a Word MIME type). */
export function downloadRecordsDoc(players: Player[], history: MatchRecord[]): void {
  downloadFile(
    `open-pickleball-records-${stamp()}.doc`,
    'application/msword',
    recordsHtml(players, history),
  );
}
