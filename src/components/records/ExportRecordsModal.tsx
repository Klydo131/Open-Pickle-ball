'use client';

import { Printer, FileText, Sheet, ShieldCheck } from 'lucide-react';
import type { MatchRecord, Player } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { downloadRecordsCsv, downloadRecordsDoc } from '@/lib/export';
import { toast } from '@/lib/toast';

/**
 * Export the leaderboard + results. Three fully-local outputs: the browser print
 * dialog (Save as PDF), a Word .doc, or a CSV. Nothing is uploaded.
 */
export function ExportRecordsModal({
  open,
  onClose,
  players,
  history,
}: {
  open: boolean;
  onClose: () => void;
  players: Player[];
  history: MatchRecord[];
}) {
  const empty = history.length === 0 && players.every((p) => p.wins + p.losses === 0);

  return (
    <Modal open={open} onClose={onClose} title="Export Records">
      {empty ? (
        <p className="text-sm text-muted">Record a match first — there’s nothing to export yet.</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            Save your leaderboard and match history. Everything is generated on this device.
          </p>

          <div className="mt-4 space-y-2">
            <ExportRow
              icon={<Printer className="h-5 w-5 text-pickle" />}
              title="Print / Save as PDF"
              body="Opens your browser’s print dialog — choose “Save as PDF”."
              onClick={() => {
                onClose();
                // Let the modal close before the print dialog steals focus.
                setTimeout(() => window.print(), 150);
              }}
            />
            <ExportRow
              icon={<FileText className="h-5 w-5 text-electric" />}
              title="Download Word (.doc)"
              body="A formatted document you can edit and share."
              onClick={() => {
                downloadRecordsDoc(players, history);
                toast('success', 'Word document downloaded');
              }}
            />
            <ExportRow
              icon={<Sheet className="h-5 w-5 text-emerald-400" />}
              title="Download CSV"
              body="Open in Excel, Numbers or Google Sheets."
              onClick={() => {
                downloadRecordsCsv(players, history);
                toast('success', 'CSV downloaded');
              }}
            />
          </div>

          <p className="mt-4 flex items-start gap-2 text-[11px] text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
            Exports are built locally from your device’s data — nothing is sent anywhere.
          </p>
        </>
      )}
    </Modal>
  );
}

function ExportRow({
  icon,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-press flex w-full items-center gap-3 rounded-lg border border-glass/60 bg-ocean-950/40 p-3 text-left hover:border-electric/60"
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-bold uppercase tracking-wide text-white">{title}</span>
        <span className="block text-xs text-muted">{body}</span>
      </span>
    </button>
  );
}
