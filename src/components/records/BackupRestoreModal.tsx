'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Upload, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { AppData } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useStore } from '@/lib/store';
import { downloadBackup, parseBackup } from '@/lib/backup';
import { toast } from '@/lib/toast';

/**
 * Full local backup & restore. Because the app is account-free, this is the
 * user's way to keep their data safe and move it between devices — a complete
 * on-device snapshot, nothing uploaded. Restoring replaces everything, so it's
 * gated behind a confirm and a preview of what the file contains.
 */
export function BackupRestoreModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const restoreData = useStore((s) => s.restoreData);
  const fileRef = useRef<HTMLInputElement>(null);
  const restoreBtnRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(false);
  const [pending, setPending] = useState<AppData | null>(null);

  // Clear a half-finished restore when the sheet is closed.
  useEffect(() => {
    if (!open) setPending(null);
  }, [open]);

  // On the view swap, keep keyboard focus inside the dialog — Cancel is the safe
  // default for the destructive confirm so a stray Enter can't replace the data.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    (pending ? cancelRef.current : restoreBtnRef.current)?.focus();
  }, [pending]);

  function snapshot(): AppData {
    const s = useStore.getState();
    return {
      players: s.players,
      courts: s.courts,
      matches: s.matches,
      history: s.history,
      waitingQueue: s.waitingQueue,
      meta: s.meta,
    };
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    file.text().then((text) => {
      const data = parseBackup(text);
      if (!data) {
        toast('error', 'That isn’t a valid Open Pickleball backup file');
        return;
      }
      setPending(data);
    });
  }

  function confirmRestore() {
    if (!pending) return;
    const r = restoreData(pending);
    if (r.ok) {
      toast('success', 'Backup restored');
      setPending(null);
      onClose();
    } else {
      toast('error', r.message);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Backup & Restore">
      {pending ? (
        <div>
          <div className="flex items-start gap-2 rounded-lg border border-pickle/40 bg-pickle/5 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-pickle" />
            <div className="text-sm text-muted">
              This will <b className="text-white">replace everything</b> on this device with the
              backup:{' '}
              <b className="text-white">{pending.players.length}</b> players,{' '}
              <b className="text-white">{pending.history.length}</b> recorded matches. This can’t be
              undone.
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <PrimaryButton ref={cancelRef} variant="secondary" fullWidth onClick={() => setPending(null)}>
              Cancel
            </PrimaryButton>
            <PrimaryButton variant="danger" fullWidth onClick={confirmRestore} icon={<Upload className="h-4 w-4" />}>
              Replace &amp; restore
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted">
            Save a complete copy of your data — players, photos, records and settings — as a single
            file, or restore one. Everything stays on your device.
          </p>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => {
                downloadBackup(snapshot());
                toast('success', 'Backup downloaded');
              }}
              className="btn-press flex w-full items-center gap-3 rounded-lg border border-glass/60 bg-ocean-950/40 p-3 text-left hover:border-electric/60"
            >
              <Download className="h-5 w-5 shrink-0 text-electric" />
              <span>
                <span className="block font-display text-sm font-bold uppercase tracking-wide text-white">
                  Download backup
                </span>
                <span className="block text-xs text-muted">A single .json file you can keep or move to another device.</span>
              </span>
            </button>

            <button
              ref={restoreBtnRef}
              onClick={() => fileRef.current?.click()}
              className="btn-press flex w-full items-center gap-3 rounded-lg border border-glass/60 bg-ocean-950/40 p-3 text-left hover:border-pickle/60"
            >
              <Upload className="h-5 w-5 shrink-0 text-pickle" />
              <span>
                <span className="block font-display text-sm font-bold uppercase tracking-wide text-white">
                  Restore from file
                </span>
                <span className="block text-xs text-muted">Load a backup — replaces the data on this device.</span>
              </span>
            </button>
          </div>

          <p className="mt-4 flex items-start gap-2 text-[11px] text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
            Backups are created and read entirely on this device — nothing is uploaded.
          </p>

          <input ref={fileRef} type="file" accept=".json,application/json" onChange={onFile} className="hidden" />
        </>
      )}
    </Modal>
  );
}
