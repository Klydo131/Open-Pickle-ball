'use client';

import { useMemo, useState } from 'react';
import { UserPlus, Users, QrCode } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddPlayerForm } from '@/components/players/AddPlayerForm';
import { PlayerCard } from '@/components/players/PlayerCard';
import { ShareProfileModal } from '@/components/share/ShareProfileModal';
import { ImportProfileModal } from '@/components/share/ImportProfileModal';
import type { Player } from '@/lib/types';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/hooks/useHydrated';
import { rankPlayers } from '@/lib/selectors';

export default function PlayersPage() {
  const hydrated = useHydrated();
  const players = useStore((s) => s.players);
  const matches = useStore((s) => s.matches);
  const waitingQueue = useStore((s) => s.waitingQueue);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<Player | null>(null);

  const playing = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) for (const id of [...m.teamA, ...m.teamB]) set.add(id);
    return set;
  }, [matches]);

  const waiting = useMemo(() => new Set(waitingQueue), [waitingQueue]);
  const sorted = useMemo(() => rankPlayers(players), [players]);

  return (
    <div className="pt-4">
      <PageHeader
        title="Players"
        subtitle="Add names, photos, themes — track records"
        action={
          <div className="flex items-center gap-2">
            <PrimaryButton
              variant="secondary"
              onClick={() => setImportOpen(true)}
              icon={<QrCode className="h-5 w-5" />}
            >
              Import
            </PrimaryButton>
            <PrimaryButton
              data-coach="add-player"
              onClick={() => setOpen(true)}
              icon={<UserPlus className="h-5 w-5" />}
            >
              Add
            </PrimaryButton>
          </div>
        }
      />

      {!hydrated ? null : players.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="No players yet"
          message="Connect your crew — add the first name to start tracking wins, losses and themes. Got a profile shared to you? Import it."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <PrimaryButton onClick={() => setOpen(true)} icon={<UserPlus className="h-5 w-5" />}>
                Add your first player
              </PrimaryButton>
              <PrimaryButton
                variant="secondary"
                onClick={() => setImportOpen(true)}
                icon={<QrCode className="h-5 w-5" />}
              >
                Import a profile
              </PrimaryButton>
            </div>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              waiting={waiting.has(p.id)}
              playing={playing.has(p.id)}
              onShare={setShareTarget}
            />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Player">
        <AddPlayerForm onDone={() => setOpen(false)} />
      </Modal>

      <ImportProfileModal open={importOpen} onClose={() => setImportOpen(false)} />
      <ShareProfileModal player={shareTarget} onClose={() => setShareTarget(null)} />
    </div>
  );
}
