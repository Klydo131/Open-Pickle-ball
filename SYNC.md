# Cross-device sync (optional)

Open Pickleball is **local-first**: it works fully offline with no account and no
server. Cross-device sync is an **optional** layer you can switch on. When it's
not configured, the app behaves exactly as before and the Sync screen simply
says "not configured".

The design stays **vendor-neutral and device-agnostic**: any modern browser on
any operating system can host or join a session, and the backend is a swappable
hosted **Postgres + realtime** service reached over standard HTTPS/WebSocket.
This reference wiring uses Supabase, but the client only depends on two public
environment variables and two database functions — you can point it at any
equivalent provider.

## How it works

- A **session** is one shared snapshot of the board (players, courts, matches,
  history, waiting queue) stored as a single JSON document, keyed by a short,
  shareable **code**.
- Tap **Sync → Start a session** to mint a code, or **Join** to enter someone
  else's. Every device on the same code stays live in sync.
- Live updates travel over a realtime **broadcast** channel named by the code.
  Durable state is read/written through two locked-down database functions.
- Conflict handling is **last-write-wins**, ordered by a server-assigned
  revision number, so all devices converge on the latest change. (Best for a
  single host driving the night; simultaneous edits from two devices may have
  one side overwritten, but they always converge.)
- **Only the board syncs.** Device-local preferences (the tutorial/quests state)
  stay on each device and are never uploaded.

## Configuration

Sync turns on when these **public** variables are present (they are safe to
expose to the browser — see Security below):

```
NEXT_PUBLIC_SUPABASE_URL=...          # your project API URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     # the publishable / anon key (public)
```

- **Local development:** put them in `.env.local` (git-ignored — never commit
  it).
- **Hosting:** add the same two variables in your host's environment-variable
  settings, then redeploy. No other configuration is required.

The secret service-role/admin key is **never** used by the client and must never
be committed or exposed.

## Database setup

The backend needs one table and two functions. Apply this once to your project:

```sql
create table if not exists public.op_sessions (
  code        text primary key,
  state       jsonb not null,
  rev         bigint not null default 1,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

alter table public.op_sessions enable row level security;
-- No policies + revoked grants => no direct client table access.
revoke all on public.op_sessions from anon, authenticated;

create or replace function public.op_session_get(p_code text)
returns table (code text, state jsonb, rev bigint, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select s.code, s.state, s.rev, s.updated_at
  from public.op_sessions s where s.code = p_code;
$$;

create or replace function public.op_session_save(p_code text, p_state jsonb)
returns bigint
language plpgsql security definer set search_path = public as $$
declare v_rev bigint;
begin
  if p_code is null or char_length(p_code) < 6 or char_length(p_code) > 24 then
    raise exception 'invalid code';
  end if;
  if pg_column_size(p_state) > 1000000 then
    raise exception 'state too large';
  end if;
  insert into public.op_sessions (code, state, rev)
  values (p_code, p_state, 1)
  on conflict (code) do update
    set state = excluded.state, rev = public.op_sessions.rev + 1, updated_at = now()
  returning rev into v_rev;
  return v_rev;
end;
$$;

revoke all on function public.op_session_get(text) from public;
revoke all on function public.op_session_save(text, jsonb) from public;
grant execute on function public.op_session_get(text) to anon, authenticated;
grant execute on function public.op_session_save(text, jsonb) to anon, authenticated;
```

If your host enforces a Content-Security-Policy, allow the realtime/REST origin
in `connect-src` (this repo already allows `https://*.supabase.co` and
`wss://*.supabase.co`).

## Security & privacy

- **The publishable/anon key is public by design.** Direct table access is
  denied; the only entry points are the two `op_session_*` functions, which run
  with a pinned `search_path`, validate input, and require the **exact code**.
  The table cannot be listed or enumerated with the public key.
- **The code is the capability.** Treat it like a share link — anyone who has it
  can see and edit that session's board. Stop syncing to invalidate a device's
  local link; start a new session for a fresh code.
- **What is shared:** player display names and match scores only — the
  low-sensitivity data you already see on screen. No emails, no accounts, no
  device identifiers.
- **What is never shared or committed:** the admin/service key, and your
  `.env.local`.

## Verifying it works

1. Set the two variables and apply the SQL above.
2. Open the app in two browsers (or two devices).
3. In one: **Sync → Start a session**, copy the code.
4. In the other: **Sync → Join**, enter the code.
5. Add a player on one side — it appears on the other within a second.
