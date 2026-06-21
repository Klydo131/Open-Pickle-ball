'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient, isSyncConfigured } from './supabase';
import { useStore, toSnapshot, type SyncSnapshot } from './store';
import { useSyncStore } from './syncStore';

/**
 * Cross-device sync over a shareable session code.
 *
 * Model: the shared board (players/courts/matches/history/queue) is one JSONB
 * document keyed by a capability `code`. Durability goes through the locked-down
 * `op_session_*` RPCs; live updates use a Supabase Realtime *broadcast* channel
 * named by the code. Conflict resolution is last-write-wins, ordered by the
 * server-assigned `rev`, so all peers converge on the latest save.
 *
 * The connection lifecycle is module-level (a single active session per tab);
 * `useSyncStore` mirrors status for the UI.
 */

const CODE_KEY = 'op-sync-code';
// Friendly, unambiguous code alphabet (no 0/O/1/I etc.).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const clientId =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

let channel: RealtimeChannel | null = null;
let unsubscribeStore: (() => void) | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let suppressPush = false;
let localRev = 0;

export type SyncResult =
  | { ok: true; code: string }
  | { ok: false; message: string };

function generateCode(): string {
  let out = '';
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 8; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Normalise user-typed codes: uppercase, strip non-alphabet chars. */
export function normalizeCode(input: string): string {
  return (input || '')
    .toUpperCase()
    .split('')
    .filter((c) => ALPHABET.includes(c))
    .join('');
}

/** Display form, grouped for readability: "ABCD-EFGH". */
export function formatCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

function applyRemote(snapshot: SyncSnapshot, rev: number) {
  suppressPush = true;
  useStore.getState().applyRemote(snapshot);
  suppressPush = false;
  localRev = rev;
}

async function pushNow() {
  const sb = await getSupabaseClient();
  const { code } = useSyncStore.getState();
  if (!sb || !code) return;
  const data = toSnapshot(useStore.getState());
  const { data: rev, error } = await sb.rpc('op_session_save', {
    p_code: code,
    p_state: data,
  });
  if (error) {
    useSyncStore.setState({ status: 'error', error: error.message });
    return;
  }
  localRev = Number(rev);
  channel?.send({
    type: 'broadcast',
    event: 'state',
    payload: { from: clientId, rev: localRev, data },
  });
}

function schedulePush() {
  if (suppressPush) return; // ignore store changes we caused by applying a remote update
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushNow();
  }, 500);
}

async function openChannel(code: string): Promise<boolean> {
  const sb = await getSupabaseClient();
  if (!sb) return false;
  if (channel) {
    await sb.removeChannel(channel);
    channel = null;
  }
  const ch = sb.channel(`op:${code}`, { config: { broadcast: { self: false } } });
  ch.on('broadcast', { event: 'state' }, ({ payload }) => {
    if (!payload || payload.from === clientId) return;
    const rev = Number(payload.rev);
    if (!Number.isFinite(rev) || rev <= localRev) return;
    applyRemote(payload.data as SyncSnapshot, rev);
  });
  channel = ch;
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') done(true);
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') done(false);
    });
    setTimeout(() => done(false), 10000);
  });
}

function watchStore() {
  unsubscribeStore?.();
  unsubscribeStore = useStore.subscribe(schedulePush);
}

/** Host a new session: mint a code, publish the current local board. */
export async function startHosting(): Promise<SyncResult> {
  const sb = await getSupabaseClient();
  if (!sb) return { ok: false, message: 'Cloud sync is not configured' };
  const code = generateCode();
  useSyncStore.setState({ status: 'connecting', code, role: 'host', error: undefined });

  const data = toSnapshot(useStore.getState());
  const { data: rev, error } = await sb.rpc('op_session_save', { p_code: code, p_state: data });
  if (error) {
    useSyncStore.setState({ status: 'error', error: error.message });
    return { ok: false, message: error.message };
  }
  localRev = Number(rev);

  const ok = await openChannel(code);
  if (!ok) {
    useSyncStore.setState({ status: 'error', error: 'Could not open realtime channel' });
    return { ok: false, message: 'Could not open realtime channel' };
  }
  watchStore();
  if (typeof window !== 'undefined') localStorage.setItem(CODE_KEY, code);
  useSyncStore.setState({ status: 'live', code, role: 'host', error: undefined });
  return { ok: true, code };
}

/** Join an existing session by code: pull its board, then go live. */
export async function joinSession(input: string, role: 'guest' | 'host' = 'guest'): Promise<SyncResult> {
  const sb = await getSupabaseClient();
  if (!sb) return { ok: false, message: 'Cloud sync is not configured' };
  const code = normalizeCode(input);
  if (code.length < 6) return { ok: false, message: 'Enter a valid code' };
  useSyncStore.setState({ status: 'connecting', code, role, error: undefined });

  const { data, error } = await sb.rpc('op_session_get', { p_code: code });
  if (error) {
    useSyncStore.setState({ status: 'error', error: error.message });
    return { ok: false, message: error.message };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    useSyncStore.setState({ status: 'error', error: 'No session found' });
    return { ok: false, message: 'No session with that code' };
  }
  applyRemote(row.state as SyncSnapshot, Number(row.rev));

  const ok = await openChannel(code);
  if (!ok) {
    useSyncStore.setState({ status: 'error', error: 'Could not open realtime channel' });
    return { ok: false, message: 'Could not open realtime channel' };
  }
  watchStore();
  if (typeof window !== 'undefined') localStorage.setItem(CODE_KEY, code);
  useSyncStore.setState({ status: 'live', code, role, error: undefined });
  return { ok: true, code };
}

/** Leave the session. Local data stays on the device. */
export async function stopSync(): Promise<void> {
  const sb = await getSupabaseClient();
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  unsubscribeStore?.();
  unsubscribeStore = null;
  if (channel && sb) {
    await sb.removeChannel(channel);
  }
  channel = null;
  localRev = 0;
  if (typeof window !== 'undefined') localStorage.removeItem(CODE_KEY);
  useSyncStore.setState({ status: 'off', code: null, role: null, error: undefined });
}

/** On app boot, transparently rejoin a previously-active session. */
export async function resumeSync(): Promise<void> {
  if (typeof window === 'undefined' || !isSyncConfigured()) return;
  const code = localStorage.getItem(CODE_KEY);
  if (!code) return; // nothing to resume — SDK is never loaded
  // Rejoin as guest: the shared session is authoritative, so pull latest.
  await joinSession(code, 'host').catch(() => {
    /* leave the persisted code so a later retry can reconnect */
  });
}
