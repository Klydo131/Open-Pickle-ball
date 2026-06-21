'use client';

import { useState } from 'react';
import { Cloud, CloudOff, Copy, Check, LogIn, Plus, Loader2, Wifi } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useSyncStore } from '@/lib/syncStore';
import { isSyncConfigured } from '@/lib/supabase';
import { startHosting, joinSession, stopSync, formatCode, normalizeCode } from '@/lib/sync';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

export function SyncModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { status, code, role, error } = useSyncStore();
  const configured = isSyncConfigured();

  const [joinInput, setJoinInput] = useState('');
  const [busy, setBusy] = useState<'host' | 'join' | null>(null);
  const [copied, setCopied] = useState(false);

  async function host() {
    setBusy('host');
    const r = await startHosting();
    setBusy(null);
    if (r.ok) toast('success', 'Sync session started');
    else toast('error', r.message);
  }

  async function join() {
    setBusy('join');
    const r = await joinSession(joinInput);
    setBusy(null);
    if (r.ok) {
      toast('success', 'Joined — boards are in sync');
      setJoinInput('');
    } else {
      toast('error', r.message);
    }
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(formatCode(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast('info', `Code: ${formatCode(code)}`);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Cloud Sync">
      {!configured ? (
        <div className="flex flex-col items-center py-4 text-center">
          <CloudOff className="mb-3 h-9 w-9 text-muted" />
          <p className="text-sm text-muted">
            Cloud sync isn’t configured on this deployment. Add the Supabase
            environment variables (see <span className="text-electric">SYNC.md</span>) to
            enable it. The app works fully offline without it.
          </p>
        </div>
      ) : status === 'live' && code ? (
        <div>
          <div className="mb-2 flex items-center justify-center gap-2 text-emerald-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-display text-sm font-bold uppercase tracking-wide">
              Live · {role === 'host' ? 'Hosting' : 'Joined'}
            </span>
          </div>

          <p className="mb-3 text-center text-sm text-muted">
            Open this code on any other device to keep boards in sync.
          </p>

          <button
            onClick={copy}
            className="btn-press group flex w-full items-center justify-center gap-3 rounded-lg border border-glass bg-ocean-950/60 px-4 py-4 hover:border-pickle/60"
          >
            <span className="font-display text-3xl font-extrabold tracking-[0.3em] text-pickle">
              {formatCode(code)}
            </span>
            {copied ? (
              <Check className="h-5 w-5 text-emerald-400" />
            ) : (
              <Copy className="h-5 w-5 text-muted group-hover:text-white" />
            )}
          </button>

          <div className="mt-5">
            <PrimaryButton
              variant="danger"
              fullWidth
              icon={<CloudOff className="h-5 w-5" />}
              onClick={async () => {
                await stopSync();
                toast('info', 'Stopped syncing');
              }}
            >
              Stop syncing
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-md border border-glass/50 bg-ocean-950/40 p-3">
            <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-electric" />
            <p className="text-xs text-muted">
              Sync this court night across phones and laptops in real time — no
              account needed. Start a session to get a code, or join one a friend
              shared.
            </p>
          </div>

          <PrimaryButton
            fullWidth
            loading={busy === 'host' || status === 'connecting'}
            disabled={busy !== null}
            icon={<Plus className="h-5 w-5" />}
            onClick={host}
          >
            Start a session
          </PrimaryButton>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-glass/50" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted">or join</span>
            <div className="h-px flex-1 bg-glass/50" />
          </div>

          <div className="flex gap-2">
            <input
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              placeholder="Enter code"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={9}
              className={cn(
                'min-w-0 flex-1 rounded-md border border-glass bg-ocean-950/70 px-4 py-3 font-display text-lg font-bold uppercase tracking-[0.2em] text-white placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/60 focus:border-pickle focus:outline-none',
              )}
            />
            <PrimaryButton
              variant="secondary"
              loading={busy === 'join'}
              disabled={busy !== null || normalizeCode(joinInput).length < 6}
              icon={<LogIn className="h-5 w-5" />}
              onClick={join}
            >
              Join
            </PrimaryButton>
          </div>

          {status === 'error' && error && (
            <p className="text-center text-xs text-serve">{error}</p>
          )}
          {(busy || status === 'connecting') && (
            <p className="flex items-center justify-center gap-2 text-xs text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting…
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
