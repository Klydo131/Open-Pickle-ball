'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Check, QrCode, IdCard, ShieldCheck, ImageDown, Printer, Share2 } from 'lucide-react';
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
 * Share one player's profile to another device — peer to peer, no server.
 *
 * The headline action is a single "Share" button that hands the profile to the
 * phone's own share sheet (messages, mail, socials). The QR encodes a compact,
 * scannable snapshot; the secondary actions cover copy, save and a printable
 * card. Whoever receives it imports it locally — nothing is uploaded.
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

  const name = player.name;
  const message = `${name} on Open Pickleball 🥒 — scan this QR in the app (Players → Import) to add their profile & record.`;

  /** One-tap share via the device's native share sheet, with graceful fallbacks. */
  async function shareProfile() {
    const title = `${name} · Open Pickleball`;
    try {
      // Best: share the QR image — recipients just scan it to import.
      if (qr && qr.startsWith('data:image/') && navigator.canShare && navigator.share) {
        const blob = await (await fetch(qr)).blob();
        const file = new File([blob], `${name}-open-pickleball.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title, text: message, files: [file] });
          return;
        }
      }
      // Next: share text (carries the code so it can be pasted into Import).
      if (navigator.share) {
        await navigator.share({ title, text: `${message}\n\n${cardCode}` });
        return;
      }
      // Last: copy the code so it can be pasted anywhere.
      await navigator.clipboard.writeText(cardCode);
      toast('success', 'Profile copied — paste it into a message');
    } catch (err) {
      // A dismissed share sheet is not an error.
      if ((err as Error)?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(cardCode);
        toast('info', 'Copied the profile instead');
      } catch {
        toast('error', 'Couldn’t share — try Copy code');
      }
    }
  }

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

  function buildCardHtml(): string | null {
    return fullProfile ? profileCardHtml(fullProfile, { qrDataUrl: qr }) : null;
  }

  function downloadCard() {
    const html = buildCardHtml();
    if (!html) return;
    downloadFile(`${name}-pickleball-card.html`, 'text/html;charset=utf-8', html);
    toast('success', 'Player card downloaded');
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
    w.document.write(html);
    w.document.close();
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
            <img src={qr} alt="Profile QR code" width={200} height={200} />
          ) : (
            <div className="flex h-[200px] w-[200px] items-center justify-center text-ocean-950/40">
              <QrCode className="h-10 w-10" />
            </div>
          )}
        </div>
      </div>

      {/* Primary action: native share sheet */}
      <button
        onClick={shareProfile}
        className="btn-press mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-pickle py-3 font-display text-base font-bold uppercase tracking-wide text-ocean-950 hover:shadow-glow"
      >
        <Share2 className="h-5 w-5" /> Share {name}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Send it by message, mail or social — or let a friend scan the code above.
      </p>

      {/* Secondary: copy / save image */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={copyCode}
          className="btn-press flex items-center justify-center gap-2 rounded-md border border-glass/60 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white hover:border-pickle/60"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
        <a
          href={qr ?? undefined}
          download={`${name}-pickleball-qr.png`}
          aria-disabled={!qr}
          className="btn-press flex items-center justify-center gap-2 rounded-md border border-glass/60 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white hover:border-electric/60 aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          <ImageDown className="h-4 w-4" /> Save QR
        </a>
      </div>

      {/* Player card: a clean, printable profile sheet */}
      <div className="mt-3 rounded-lg border border-glass/50 bg-ocean-950/40 p-3">
        <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-white">
          <IdCard className="h-4 w-4 text-pickle" /> Player card
        </p>
        <p className="mt-1 text-xs text-muted">
          A polished profile sheet — photo, stats and recent matches — that opens in any browser and
          prints to PDF.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={downloadCard}
            className="btn-press flex items-center justify-center gap-2 rounded-md border border-electric/50 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-electric hover:bg-electric/10"
          >
            <IdCard className="h-4 w-4" /> Download
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
        Private by design — your profile travels straight to whoever you choose, never through a
        server, and your data stays on your device.
      </p>
    </Modal>
  );
}
