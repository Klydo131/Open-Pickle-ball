# Architecture

This document explains how Open Pickleball is put together and — most
importantly — **how a developer can swap the local-first store for a real
backend without rewriting the UI.**

## Principles

1. **Local-first.** The app is fully functional with zero backend. State lives
   in the browser via `localStorage`. This makes it trivial to run, demo and
   deploy (Vercel needs no env vars).
2. **One source of truth for logic.** Every rule about players, courts, matches,
   records and the waiting queue lives in **`src/lib/store.ts`**. The UI never
   mutates state directly; it calls typed actions. This mirrors the "keep
   business logic in one place" guidance from the implementation brief.
3. **Backend-agnostic types.** `src/lib/types.ts` defines the domain. The local
   store and any future remote backend both speak these shapes, so swapping
   storage never changes a component.
4. **Validate at every trust boundary.** `src/lib/validation.ts` (Zod) sanitises
   and validates all user input before it enters state. The same schemas are
   reused server-side when a backend is added.

## Layers

```
┌─────────────────────────────────────────────────────────┐
│  UI  (src/app/*, src/components/*)                        │
│  - Pure presentation + local component state             │
│  - Reads state via useStore selectors                    │
│  - Calls typed actions; shows ActionResult errors as      │
│    toasts                                                  │
├─────────────────────────────────────────────────────────┤
│  Domain / "backend"  (src/lib/store.ts)                   │
│  - addPlayer, startMatch, recordResult, joinQueue, ...    │
│  - All invariants & guards (e.g. COURT_BUSY, NEED_PLAYERS)│
│  - Returns { ok } | { ok:false, code, message }           │
├─────────────────────────────────────────────────────────┤
│  Persistence  (zustand `persist` → localStorage)          │
│  - Versioned key `open-pickleball:v1`                     │
└─────────────────────────────────────────────────────────┘
```

## Data model

See `src/lib/types.ts`. In short:

- **Player** — `id, name, themeId, photo?, wins, losses, streak, bestStreak`.
  "Connecting a name" = adding a player to the roster. `photo` is an optional,
  on-device-compressed data URL (see `src/lib/image.ts`).
- **Court** — `id, name, status (open | in_progress), matchId`.
- **Match** — `courtId, type (singles|doubles), teamA[], teamB[], scoreA, scoreB,
  status, winner`.
- **MatchRecord** — a completed match kept in `history`.
- **waitingQueue** — ordered `playerId[]`; first in, first onto a free court.

## Core flows

| Action | Guarantees |
| --- | --- |
| `startMatch(court, type, A, B)` | Court must be `open` (never double-booked); correct team sizes; no duplicate/overlapping players; players not already on a court. Removes those players from the queue. |
| `recordResult(match, a, b)` | Integer 0–99 scores, no ties; winners +1 W, losers +1 L; match moves to `history`; court frees. |
| `editMatchRecord(id, a, b)` | Correct a recorded score; if the winner flips, W/L moves across; streaks recomputed from history (`bestStreak` never lowered). |
| `deleteMatchRecord(id)` | Removes a record and rolls back its W/L + streak effect. |
| `joinQueue` / `leaveQueue` | Idempotent; can't queue a player who's in a live match. |
| `removePlayer` / `removeCourt` | Blocked while the player/court is in a live match. |
| `importPlayer(profile)` | Adds (or refreshes) a player from a profile shared by another device — see below. |

These mirror the server-side transaction guards in the brief (e.g. the
"lock the match row, check `max_players`" join logic). In a single-threaded
browser there are no real races, but keeping the guard + typed-error shape now
means the exact same surface works when it becomes a networked backend.

## Local-first sharing — the bridge, not a database

**Read this before adding any "sync" or "cloud" feature.** Sharing in Open
Pickleball is deliberately peer-to-peer and serverless. Profiles — names,
photos, themes, records and recent results — live **only** in each device's
`localStorage`. The app is a *gateway* that carries a profile from one device to
another; it is **not** a place that stores anyone's data.

```
┌──────────────────────────┐        share          ┌──────────────────────────┐
│  Device A                │   QR / code / file     │  Device B                │
│  localStorage profiles   │ ─────────────────────▶ │  localStorage profiles   │
│  (private to A)          │   (no server hop)      │  (private to B)          │
└──────────────────────────┘                        └──────────────────────────┘
        the profile data travels *inside* the QR/code — nothing is uploaded
```

How it works in code:

1. **Encode.** `src/lib/share.ts` serialises one player to a self-contained
   string: `OPB1.<base64url(JSON)>`. The JSON *is* the payload (profile + recent
   results, optionally the photo). There is no id that points at a server record
   — the data is the message.
2. **Transport.** `src/lib/qr.ts` renders that string to a QR (drawn in-browser,
   no network). The same string can be copied, or downloaded as a `.txt`. QR
   shares omit the photo to stay scannable; copy/file shares include it.
3. **Import.** `decodeProfile()` parses and **validates/clamps** the untrusted
   payload (never trust an incoming code), then `store.importPlayer()` adds it as
   a new local player or refreshes an existing one of the same name. Scanning
   uses the browser's native `BarcodeDetector` when present, with a paste/upload
   fallback — still no dependency that phones home.
4. **Photos** are captured and compressed entirely on-device in
   `src/lib/image.ts` (canvas → small JPEG data URL). They are part of the same
   local-only model.

### Rules for contributors

- **No central database for profiles.** Don't introduce a backend that *stores*
  players, photos or records as the source of truth. That breaks the core
  promise. (Swapping the *match-running* store for a backend is a separate,
  documented path — see the next section — but the share model stays P2P.)
- **Offline-first by default.** Any new transport must work with no network and
  no account. The QR/code/file path is the baseline; keep it.
- **Online or email hand-off is opt-in only.** If you add, say, a short link, an
  email invite, or a relay to make sharing easier across distance, gate it behind
  an explicit, off-by-default setting and keep the offline path as the default.
  Deliberately, the app ships with **no email dependency**; integrating one is a
  downstream project's choice, not a core requirement.
- **Always validate decoded payloads.** Treat every imported code as untrusted
  input. `decodeProfile()` already strips control data, clamps numbers, drops
  oversized/invalid photos, and bounds list lengths — extend that, don't bypass
  it.

### Where to extend it

| Want to… | Touch |
| --- | --- |
| Change what a shared profile contains | `SharedProfile` in `src/lib/share.ts` (bump the `OPB1` version + handle it in `decodeProfile`). |
| Add a new transport (NFC, file type, opt-in link) | a new module + a button in `src/components/share/*`; reuse `encodeProfile` / `decodeProfile`. |
| Share more than one profile at once | encode an array; keep the per-profile validation. |

## Swapping the backend (the important part)

The UI depends only on the **action surface** of the store, not on
`localStorage`. To go networked:

1. **Pick a backend.** Any hosted Postgres service with auth, realtime and
   row-level security (RLS) works — the data model maps 1:1 to our types, with a
   transaction-safe `join_match` RPC for capacity-safe joins.
2. **Implement the same actions against it.** Create
   `src/lib/remoteStore.ts` exposing the identical method names
   (`addPlayer`, `startMatch`, `recordResult`, …), each calling your API/RPC and
   returning the same `ActionResult`.
3. **Reuse the Zod schemas** from `src/lib/validation.ts` inside your Edge
   Function / route handler so validation runs server-side too.
4. **Swap the import.** Components import `useStore` from one module — point that
   at the remote store (or a hybrid that keeps an offline cache and syncs).

Because every component already handles `{ ok:false, code, message }` results
and loading states, no screen needs to change.

### Suggested production schema (from the brief)

`profiles, courts, matches, match_players, match_requests, conversations,
messages, ratings, notifications, availability` — relational core, **RLS enabled
on every table before any public client connects**, and high-impact actions
(`join_match`, `cancel_match`, `confirm_player`) behind validated RPCs/Edge
Functions so they can't be abused or race.

## PWA / offline

- `public/manifest.webmanifest` makes the app installable.
- `public/sw.js` precaches the shell (network-first for navigations,
  cache-first for static assets). Registered only in production by
  `AppShell.tsx`.
- Because data is local, the installed app is fully usable offline.

## Why this stack vs. the brief's Expo target

The brief sketched **two** options: a Next.js PWA (Multi-Sport guide) and an
Expo/React Native app (Codex report). We chose **Next.js PWA** because the
requirement was "open in any web app *and* mobile, tested on Vercel." Expo
produces native binaries that don't run as a Vercel web app; a Next.js PWA gives
us one codebase that runs in every browser, installs to the home screen, and
deploys to Vercel — while keeping the exact design system and backend blueprint
from the Codex report.
