'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ThemePicker } from './ThemePicker';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { DEFAULT_THEME_ID, getPlayerTheme, playerNameStyle } from '@/lib/playerThemes';

/** Connect a name to the app (local roster) + pick a starting theme. */
export function AddPlayerForm({ onDone }: { onDone?: () => void }) {
  const addPlayer = useStore((s) => s.addPlayer);
  const [name, setName] = useState('');
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const theme = getPlayerTheme(themeId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = addPlayer(name, themeId);
    if (result.ok) {
      toast('success', `${name.trim()} is on the roster`);
      setName('');
      setThemeId(DEFAULT_THEME_ID);
      onDone?.();
    } else {
      toast('error', result.message);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="player-name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
          Player name
        </label>
        <input
          id="player-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          autoComplete="off"
          placeholder="e.g. Maria Santos"
          className="w-full rounded-md border border-glass bg-ocean-950/70 px-4 py-3 font-display text-lg font-bold tracking-wide placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/60 focus:border-pickle focus:outline-none"
          style={name ? playerNameStyle(theme) : { color: '#FFFFFF' }}
        />
      </div>

      <ThemePicker value={themeId} onChange={setThemeId} />

      <PrimaryButton type="submit" fullWidth icon={<UserPlus className="h-5 w-5" />}>
        Add Player
      </PrimaryButton>
    </form>
  );
}
