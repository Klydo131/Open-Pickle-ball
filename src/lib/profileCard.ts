'use client';

/**
 * The downloadable player card — a "whole product" view of one profile.
 *
 * Instead of handing the user a raw `OPB1.…` code, we render their profile into
 * a polished, self-contained HTML document: stats, win/loss, recent matches and
 * — for each match — the umpire and who recorded it. It opens in any browser,
 * prints cleanly to PDF, and (because the share QR + code are embedded) it still
 * works as a peer-to-peer share. Everything is built on-device from the local
 * profile; nothing is uploaded.
 */

import type { SharedProfile } from './share';
import { getPlayerTheme } from './playerThemes';
import { winRate } from './utils';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(ms: number): string {
  if (!ms) return '';
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export interface ProfileCardOptions {
  /** Data URL of the scannable share QR (card code). Embedded so the card can be re-shared. */
  qrDataUrl?: string | null;
  /** The raw `OPB1.…` share code, shown in a copy block for manual import. */
  shareCode?: string;
}

/**
 * Build a complete, standalone HTML document for a single player's profile.
 * Self-contained: inline CSS + inline (data-URL) photo and QR, so the file works
 * offline and can be opened or printed anywhere.
 */
export function profileCardHtml(profile: SharedProfile, opts: ProfileCardOptions = {}): string {
  const theme = getPlayerTheme(profile.themeId);
  const rate = winRate(profile.wins, profile.losses);
  const played = profile.wins + profile.losses;

  const avatar = profile.photo
    ? `<img class="avatar" src="${esc(profile.photo)}" alt="" />`
    : `<div class="avatar avatar--mono" style="background:${theme.accent}1f;color:${esc(theme.accent)}">${esc(
        profile.name.slice(0, 2).toUpperCase(),
      )}</div>`;

  const stat = (label: string, value: string | number, tone?: string) =>
    `<div class="stat">
        <div class="stat-v"${tone ? ` style="color:${tone}"` : ''}>${esc(String(value))}</div>
        <div class="stat-l">${esc(label)}</div>
      </div>`;

  const statsRow = [
    stat('Wins', profile.wins, '#34D399'),
    stat('Losses', profile.losses, '#FF7585'),
    stat('Win %', `${rate}%`),
    stat('Best streak', profile.bestStreak, '#FFD626'),
    stat('Current streak', profile.streak),
  ].join('');

  const rows = profile.recent
    .map((r) => {
      const result = `${r.w ? 'Beat' : 'Lost to'} <b>${esc(r.o)}</b>`;
      const score = `${Math.max(r.f, r.a)}–${Math.min(r.f, r.a)}`;
      return `<tr class="${r.w ? 'win' : 'loss'}">
        <td class="dt">${esc(fmtDate(r.t))}</td>
        <td class="rs"><span class="pill ${r.w ? 'pill--w' : 'pill--l'}">${r.w ? 'W' : 'L'}</span> ${result}</td>
        <td class="sc">${esc(score)}</td>
        <td class="of">${esc(r.u || '—')}</td>
        <td class="of">${esc(r.by || '—')}</td>
      </tr>`;
    })
    .join('');

  const resultsTable = profile.recent.length
    ? `<table>
        <thead>
          <tr><th>Date</th><th>Result</th><th class="sc">Score</th><th>Umpire</th><th>Recorded by</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`
    : `<p class="empty">No matches recorded yet — play a game to fill this in.</p>`;

  const shareBlock =
    opts.qrDataUrl || opts.shareCode
      ? `<section class="share">
          <h2>Share this profile</h2>
          <div class="share-row">
            ${
              opts.qrDataUrl
                ? `<img class="qr" src="${esc(opts.qrDataUrl)}" alt="Profile QR code" width="160" height="160" />`
                : ''
            }
            <div class="share-txt">
              <p>Scan the QR in Open Pickleball (Players → Import), or paste the code below. It carries this profile peer-to-peer — no server, no account.</p>
              ${opts.shareCode ? `<code class="code">${esc(opts.shareCode)}</code>` : ''}
            </div>
          </div>
        </section>`
      : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(profile.name)} — Open Pickleball Player Card</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Barlow Condensed", "Arial Narrow", Arial, sans-serif;
    background: radial-gradient(1200px 600px at 70% -10%, #0B3D79 0%, #061B3A 55%, #03101F 100%);
    color: #EAF1FB;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .wrap { max-width: 760px; margin: 0 auto; padding: 28px 22px 40px; }
  .card {
    border: 1px solid #2E4A78;
    border-radius: 20px;
    overflow: hidden;
    background: rgba(8, 28, 58, 0.72);
    box-shadow: 0 18px 50px -20px rgba(0,0,0,0.8);
  }
  .hero {
    position: relative;
    display: flex; align-items: center; gap: 18px;
    padding: 26px 24px;
    background:
      linear-gradient(120deg, ${theme.accent}26, transparent 60%),
      linear-gradient(0deg, rgba(6,24,47,0.6), rgba(6,24,47,0.2));
    border-bottom: 1px solid #2E4A78;
  }
  .hero::after {
    content: ""; position: absolute; inset: 0;
    background: repeating-linear-gradient(115deg, transparent 0 22px, rgba(255,255,255,0.025) 22px 24px);
    pointer-events: none;
  }
  .avatar {
    width: 84px; height: 84px; border-radius: 999px; object-fit: cover;
    box-shadow: 0 0 0 3px ${theme.accent}, 0 8px 22px -8px ${theme.accent}aa;
    flex: 0 0 auto;
  }
  .avatar--mono {
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; font-weight: 700; letter-spacing: .04em;
  }
  .who { min-width: 0; }
  .kicker { font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: #AFC0D8; margin: 0 0 2px; }
  .name {
    margin: 0; font-size: 40px; line-height: 1; font-weight: 700; letter-spacing: .01em;
    color: ${theme.name}; text-shadow: 0 1px 2px rgba(0,0,0,.6), 0 0 18px ${theme.accent}40;
  }
  .sub { margin: 6px 0 0; font-size: 14px; color: #AFC0D8; }
  .sub b.win { color: #34D399; } .sub b.loss { color: #FF7585; }
  .stats {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px;
    background: #2E4A78; border-bottom: 1px solid #2E4A78;
  }
  .stat { background: #061B3A; padding: 14px 8px; text-align: center; }
  .stat-v { font-size: 26px; font-weight: 700; line-height: 1; }
  .stat-l { margin-top: 5px; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #AFC0D8; }
  .body { padding: 20px 22px 24px; }
  h2 {
    margin: 0 0 10px; font-size: 14px; letter-spacing: .12em; text-transform: uppercase; color: #fff;
    border-bottom: 2px solid ${theme.accent}; padding-bottom: 6px;
  }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 9px 8px; border-bottom: 1px solid #1d3457; vertical-align: middle; }
  th { font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: #8FA6C6; }
  td.sc, th.sc { text-align: center; font-weight: 700; white-space: nowrap; }
  td.dt { color: #9DB2D0; white-space: nowrap; font-size: 12px; }
  td.of { color: #C4D2E8; white-space: nowrap; }
  .pill { display: inline-block; min-width: 18px; text-align: center; font-size: 11px; font-weight: 700; border-radius: 5px; padding: 1px 5px; margin-right: 4px; }
  .pill--w { background: #34D39922; color: #5BE9B4; }
  .pill--l { background: #FF314F22; color: #FF7585; }
  .empty { color: #9DB2D0; font-size: 14px; }
  .share { margin-top: 26px; }
  .share-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  .qr { background: #fff; padding: 8px; border-radius: 12px; flex: 0 0 auto; }
  .share-txt { min-width: 220px; flex: 1; }
  .share-txt p { margin: 0 0 8px; font-size: 13px; color: #AFC0D8; }
  .code {
    display: block; word-break: break-all; font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 11px; color: #CFE0F6; background: #03101F; border: 1px solid #1d3457;
    border-radius: 8px; padding: 8px 10px;
  }
  .foot { margin-top: 22px; text-align: center; font-size: 11px; letter-spacing: .04em; color: #7E93B4; }
  .foot b { color: #FFD626; }
  @media (max-width: 520px) {
    .name { font-size: 32px; }
    .stats { grid-template-columns: repeat(3, 1fr); }
    .hero { flex-direction: column; text-align: center; }
  }
  @media print {
    body { background: #fff; color: #0c1b30; }
    .card { box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="hero">
        ${avatar}
        <div class="who">
          <p class="kicker">🥒 Open Pickleball · Player Card</p>
          <h1 class="name">${esc(profile.name)}</h1>
          <p class="sub">
            <b class="win">${profile.wins}</b> W · <b class="loss">${profile.losses}</b> L ·
            ${rate}% win rate · ${played} game${played === 1 ? '' : 's'} played
          </p>
        </div>
      </div>

      <div class="stats">${statsRow}</div>

      <div class="body">
        <h2>Recent matches</h2>
        ${resultsTable}
        ${shareBlock}
        <p class="foot">
          100% local &amp; peer-to-peer — generated on this device on ${esc(fmtDate(Date.now()))}.
          <br />No account, no server. <b>Play More. Play Open.</b>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
