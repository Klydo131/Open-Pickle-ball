'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Check, QrCode, IdCard, ShieldCheck, ImageDown, Printer } from 'lucide-react';
import type { Player } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { PlayerChip, PlayerName } from '@/components/players/PlayerName';
import { useStore } from '@/lib/store';
import { buildSharedProfile, encodeProfile, type SharedProfile } from '@/lib/share';
import { qrPngDataUrl } from '@/lib/qr';
import { downloadFile } from '@/lib/export';
import { profileCardHtml } from '@/lib/profileCard';
import { winRate } from '@/lib/utils';
import { toast } from '@/lib/toast';

/**
 * Share a single player's profile to another device — peer to peer, no server.
 *
 * The QR encodes a compact card (name, theme, record — no photo, to stay
 * scannable). The copy/download paths carry the full profile including the
 * photo. Whoever receives it imports it on their device; nothing is uploaded.
 */
export function ShareProfileModal({
  player,
  onClose,
}: {
  player: Player | null;
  onClose: () => void;
}) {
  const players = useStore((s) => s.players);
  const history = useStore((s) => s.history);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const playerMap = useMemo(() => {
    const map: Record<string, Player> = {};
    for (const p of players) map[p.id] = p;
    return map;
  }, [players]);

  // Compact (QR-friendly) and full (with photo) snapshots for the current player.
  const { cardCode, fullCode, fullProfile } = useMemo(() => {
    if (!player) return { cardCode: '', fullCode: '', fullProfile: null as SharedProfile | null };
    const card = buildSharedProfile(player, history, playerMap, { includePhoto: false });
    const full = buildSharedProfile(player, history, playerMap, { includePhoto: true });
    return { cardCode: encodeProfile(card), fullCode: encodeProfile(full), fullProfile: full };
  }, [player, history, playerMap]);

  useEffect(() => {
    let alive = true;
    setQr(null);
    if (cardCode) qrPngDataUrl(cardCode, 240).then((url) => alive && setQr(url));
    return () => {
      alive = false;
    };
  }, [cardCode]);

  useEffect(() => setCopied(false), [player]);

  if (!player) return null;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(fullCode);
      setCopied(true);
      toast('success', 'Share code copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('error', 'Copy failed — long-press the code to copy');
    }
  }

  /** Build the standalone player-card document (stats, results, officials, QR). */
  function buildCardHtml(): string | null {
    if (!fullProfile) return null;
    return profileCardHtml(fullProfile, { qrDataUrl: qr, shareCode: fullCode });
  }

  function downloadCard() {
    const html = buildCardHtml();
    if (!html) return;
    downloadFile(`${player!.name}-pickleball-card.html`, 'text/html;charset=utf-8', html);
    toast('success', 'Profile card downloaded');
  }

  /** Open the card in a new tab and trigger the print dialog (Save as PDF). */
  function printCard() {
    const html = buildCardHtml();
    if (!html) return;
    const w = window.open('', '_blank');
    if (!w) {
      toast('error', 'Allow pop-ups to print, or download the card instead');
      return;
    }
    // `html` is our own card document: every interpolated value is HTML-escaped
    // in profileCardHtml() and it contains no <script>, so writing it to the
    // print window can't inject anything (see SECURITY.md → player card).
    w.document.write(html);
    w.document.close();
    // Let the embedded images (photo + QR) settle before printing.
    w.onload = () => setTimeout(() => w.print(), 250);
  }

  const rate = winRate(player.wins, player.losses);

  return (
    <Modal open={!!player} onClose={onClose} title="Share Profile">
      <div className="flex items-center gap-3 rounded-lg border border-glass/50 bg-ocean-950/40 p-3">
        <PlayerChip player={player} size={44} />
        <div className="min-w-0 flex-1">
          <PlayerName player={player} className="truncate text-lg" />
          <div className="text-xs text-muted">
            <b className="text-emerald-400">{player.wins}</b> W ·{' '}
            <b className="text-serve">{player.losses}</b> L · {rate}% win
          </div>
        </div>
      </div>

      {/* QR */}
      <div className="mt-4 flex flex-col items-center">
        <div className="rounded-xl border border-glass/60 bg-white p-3 shadow-card">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- generated data URL
            <img src={qr} alt="Profile QR code" width={216} height={216} />
          ) : (
            <div className="flex h-[216px] w-[216px] items-center justify-center text-ocean-950/40">
              <QrCode className="h-10 w-10" />
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          Scan on another phone to add {player.name}’s profile &amp; record.
        </p>
      </div>

      {/* actions */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={copyCode}
          className="btn-press flex items-center justify-center gap-2 rounded-md bg-pickle py-2.5 font-display text-sm font-bold uppercase tracking-wide text-ocean-950 hover:shadow-glow"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
        <a
          href={qr ?? undefined}
          download={`${player.name}-pickleball-qr.png`}
          aria-disabled={!qr}
          className="btn-press flex items-center justify-center gap-2 rounded-md border border-glass/60 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white hover:border-electric/60 aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          <ImageDown className="h-4 w-4" /> Save QR
        </a>
      </div>

      {/* Downloadable player card: a real document (stats, results, officials),
          not a raw code — yet the QR + code are embedded so it still imports. */}
      <div className="mt-3 rounded-lg border border-glass/50 bg-ocean-950/40 p-3">
        <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-white">
          <IdCard className="h-4 w-4 text-pickle" /> Player card
        </p>
        <p className="mt-1 text-xs text-muted">
          A standalone profile sheet — photo, stats, recent matches, plus who umpired and who
          recorded each game. Opens in any browser; the share QR &amp; code travel inside it.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={downloadCard}
            className="btn-press flex items-center justify-center gap-2 rounded-md border border-electric/50 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-electric hover:bg-electric/10"
          >
            <IdCard className="h-4 w-4" /> Download card
          </button>
          <button
            onClick={printCard}
            className="btn-press flex items-center justify-center gap-2 rounded-md border border-glass/60 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white hover:border-pickle/60"
          >
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-[11px] text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
        Peer-to-peer &amp; private. The QR, code and card all carry everything — nothing is
        uploaded to any server, and your data never leaves your control.
      </p>
    </Modal>
  );
}
