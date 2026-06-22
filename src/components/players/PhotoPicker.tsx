'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { fileToAvatarDataUrl } from '@/lib/image';
import { getPlayerTheme } from '@/lib/playerThemes';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface Props {
  /** Current photo data URL, if any. */
  value?: string;
  /** Called with the compressed data URL, or null when cleared. */
  onChange: (photo: string | null) => void;
  /** Theme id for the ring/glow so the picker matches the player's colours. */
  themeId: string;
  size?: number;
}

/**
 * Selfie / photo picker for a player profile. Uses the device camera or library,
 * compresses on-device, and never uploads anything. Keeps the themed ring so it
 * sits naturally in the sporty roster cards.
 */
export function PhotoPicker({ value, onChange, themeId, size = 72 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const theme = getPlayerTheme(themeId);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Could not read that image');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={value ? 'Change photo' : 'Add a photo'}
        className="btn-press relative shrink-0 overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          boxShadow: `0 0 0 2px ${theme.accent}, 0 0 16px ${theme.accent}55`,
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${theme.accent}33, ${theme.accent}11)` }}
          >
            <Camera className="h-6 w-6" style={{ color: theme.accent }} />
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-ocean-950/70">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </span>
        )}
      </button>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'btn-press rounded-md border border-glass/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:border-electric/60',
          )}
        >
          {value ? 'Change photo' : 'Add photo / selfie'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="btn-press flex items-center gap-1 px-1 text-[11px] font-bold uppercase tracking-wide text-muted hover:text-serve"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        )}
        <p className="text-[10px] text-muted/70">Stays on this device</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={onFile}
        className="hidden"
      />
    </div>
  );
}
