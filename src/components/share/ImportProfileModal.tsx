'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardPaste,
  Camera,
  Upload,
  UserPlus,
  RefreshCw,
  Trophy,
  CameraOff,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useStore } from '@/lib/store';
import { decodeProfile, type SharedProfile } from '@/lib/share';
import { getPlayerTheme, playerNameStyle } from '@/lib/playerThemes';
import { winRate } from '@/lib/utils';
import { toast } from '@/lib/toast';

// Minimal shape of the native BarcodeDetector we rely on (not yet in TS DOM lib).
type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};
type BarcodeDetectorCtor = {
  new (opts?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};

/**
 * Import a profile shared from another device — by scanning its QR, pasting the
 * code, or uploading the downloaded file. Everything is decoded locally; there
 * is no network call. The decoded profile is previewed before it's added.
 */
export function ImportProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const importPlayer = useStore((s) => s.importPlayer);
  const existingNames = useStore((s) => s.players.map((p) => p.name.toLowerCase()));
  const fileRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);

  const profile: SharedProfile | null = useMemo(
    () => (code.trim() ? decodeProfile(code) : null),
    [code],
  );
  const invalid = code.trim().length > 0 && !profile;
  const isUpdate = profile ? existingNames.includes(profile.name.toLowerCase()) : false;

  // Reset when the modal opens/closes.
  useEffect(() => {
    if (!open) {
      setCode('');
      setScanning(false);
    }
  }, [open]);

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setCode(text);
      else toast('error', 'Clipboard is empty');
    } catch {
      toast('error', 'Paste the code into the box manually');
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    file.text().then((t) => setCode(t.trim()));
  }

  function doImport() {
    if (!profile) return;
    const r = importPlayer(profile);
    if (r.ok) {
      toast('success', isUpdate ? `Updated ${profile.name}` : `Imported ${profile.name}`);
      onClose();
    } else {
      toast('error', r.message);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Import Profile">
      {scanning ? (
        <QrScanner
          onResult={(value) => {
            setCode(value);
            setScanning(false);
          }}
          onCancel={() => setScanning(false)}
        />
      ) : (
        <>
          <p className="text-sm text-muted">
            Add someone’s profile from their device — scan their QR, paste their code, or open
            the file they sent. It all happens on this device.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <SourceButton icon={<Camera className="h-5 w-5" />} label="Scan QR" onClick={() => setScanning(true)} />
            <SourceButton icon={<ClipboardPaste className="h-5 w-5" />} label="Paste" onClick={pasteFromClipboard} />
            <SourceButton icon={<Upload className="h-5 w-5" />} label="File" onClick={() => fileRef.current?.click()} />
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={3}
            placeholder="…or paste a share code starting with OPB1."
            className="mt-3 w-full resize-none rounded-md border border-glass bg-ocean-950/70 px-3 py-2 font-mono text-xs text-white placeholder:text-muted/50 focus:border-pickle focus:outline-none"
          />

          {invalid && (
            <p className="mt-2 text-xs font-bold text-serve">
              That doesn’t look like an Open Pickleball share code.
            </p>
          )}

          {profile && <ProfilePreview profile={profile} isUpdate={isUpdate} />}

          <div className="mt-4">
            <PrimaryButton
              fullWidth
              disabled={!profile}
              onClick={doImport}
              icon={isUpdate ? <RefreshCw className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            >
              {isUpdate ? 'Update profile' : 'Import profile'}
            </PrimaryButton>
          </div>

          <input ref={fileRef} type="file" accept=".txt,text/plain" onChange={onFile} className="hidden" />
        </>
      )}
    </Modal>
  );
}

function SourceButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-press flex flex-col items-center gap-1.5 rounded-md border border-glass/60 bg-ocean-950/40 py-3 text-electric hover:border-electric/60"
    >
      {icon}
      <span className="font-display text-xs font-bold uppercase tracking-wide text-white">{label}</span>
    </button>
  );
}

function ProfilePreview({ profile, isUpdate }: { profile: SharedProfile; isUpdate: boolean }) {
  const theme = getPlayerTheme(profile.themeId);
  const rate = winRate(profile.wins, profile.losses);
  return (
    <div className="mt-4 rounded-lg border border-glass/60 bg-ocean-950/40 p-3">
      <div className="flex items-center gap-3">
        {profile.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
          <img
            src={profile.photo}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2px ${theme.accent}` }}
          />
        ) : (
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full font-display font-bold"
            style={{ background: `${theme.accent}22`, color: theme.accent }}
          >
            {profile.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <span className="block truncate font-display text-lg font-bold tracking-wide" style={playerNameStyle(theme)}>
            {profile.name}
          </span>
          <div className="text-xs text-muted">
            <b className="text-emerald-400">{profile.wins}</b> W ·{' '}
            <b className="text-serve">{profile.losses}</b> L · {rate}% win · best streak {profile.bestStreak}
          </div>
        </div>
      </div>

      {profile.recent.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-glass/40 pt-2">
          {profile.recent.slice(0, 4).map((r, i) => (
            <li key={i} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted">
                <Trophy className={`h-3 w-3 ${r.w ? 'text-pickle' : 'text-muted/40'}`} />
                {r.w ? 'Beat' : 'Lost to'} {r.o}
              </span>
              <span className="font-display font-bold text-white">
                {Math.max(r.f, r.a)}–{Math.min(r.f, r.a)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[11px] text-muted/80">
        {isUpdate
          ? 'A player with this name already exists — importing refreshes their profile.'
          : 'This will add them to your roster on this device.'}
      </p>
    </div>
  );
}

/** Live QR scanner using the browser's native BarcodeDetector (no dependency). */
function QrScanner({
  onResult,
  onCancel,
}: {
  onResult: (value: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    async function start() {
      const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
      if (!Ctor) {
        setError('This browser can’t scan QR codes — paste the code instead.');
        return;
      }
      try {
        const formats = (await Ctor.getSupportedFormats?.()) ?? ['qr_code'];
        if (!formats.includes('qr_code')) {
          setError('QR scanning isn’t available here — paste the code instead.');
          return;
        }
        const detector = new Ctor({ formats: ['qr_code'] });
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const hit = codes.find((c) => c.rawValue.startsWith('OPB1.'));
            if (hit) {
              onResult(hit.rawValue);
              return;
            }
          } catch {
            /* transient detect errors are fine; keep scanning */
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setError('Couldn’t open the camera — check permissions, or paste the code.');
      }
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-glass bg-ocean-950">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {/* framing reticle */}
        <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-pickle/80" aria-hidden />
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ocean-950/90 p-6 text-center">
            <CameraOff className="h-8 w-8 text-muted" />
            <p className="text-sm text-muted">{error}</p>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted">Point the camera at the profile QR.</p>
      <button
        onClick={onCancel}
        className="btn-press mt-3 w-full rounded-md border border-glass/60 py-2 text-xs font-bold uppercase tracking-wide text-muted hover:text-white"
      >
        Cancel
      </button>
    </div>
  );
}
