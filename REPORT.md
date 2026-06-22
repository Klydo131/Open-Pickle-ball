# Open Pickleball — Build Report

**Play More. Play Open.** · Local-first · No backend · No accounts · MIT (free for anyone)

This report summarises what was added, how the system works, and how any
developer can run, extend and trust it — while keeping every byte on the
player's own device. A formatted **PDF** and **Word** version (with screenshots)
were delivered alongside it.

---

## 1 · What shipped

| # | Asked for | Delivered |
| - | --- | --- |
| 1 | A **dynamic tutorial** that guides people *while* they use the app, with a Help button for more. | A state-driven **guided coach** that always points to the single next action and advances as you actually do it — no XP, no levels. Links to Help for the deeper features. |
| 2 | **Photos/selfies** kept local; **share** profiles, ranks & records device-to-device with **no central database** — a key code or QR. | On-device photo capture + **peer-to-peer sharing** by QR, copy-paste code, or file. Importing decodes locally — the app is purely a *bridge* between devices. Email is intentionally **not** required. |
| 3 | A **simple process**: sign a profile right away, record matches, **edit** small mistakes, **print to PDF/docs**. | One-step sign-in, record results, **edit/delete** any result with auto-recomputed W-L & streaks, and **export to PDF, Word and CSV** — all generated locally. |

---

## 2 · The guided coach (dynamic onboarding)

The old gamified quest/XP tutorial was removed. The coach reads the app's real
state and surfaces the single most useful next step, so people **learn by
doing**:

- 0 players → "Sign in your first player"
- 1 player → "Add a couple more"
- 2+ players, no match → "Start a match"
- match running → "Record the score"
- basics done → "You've got it — explore themes, photos, sharing & exports" → Help

It collapses to a pill, can be dismissed, and reopened from **Help → Show the
coach**. Returning users with data are never nagged.

**Code:** `src/lib/coach.ts` · `src/components/coach/CoachGuide.tsx`

---

## 3 · Profiles, photos & peer-to-peer sharing (the bridge, not a database)

Each player is a **profile on the device**: a name, an optional photo/selfie (a
256-px JPEG compressed entirely on-device), a colour theme, and their record.

A profile is encoded into one self-contained string — `OPB1.<base64url(JSON)>`.
**That string *is* the data.** Hand it to another phone as a QR, a copy-paste
code, or a file; their device decodes it and saves it locally. No server, no
account, no shared database.

```
Device A  ──(QR / code / file)──▶  Device B
profiles in localStorage           profiles in localStorage
   (private to A)                     (private to B)
the profile travels *inside* the code — nothing is ever uploaded
```

**Safety of the share path**

- Incoming codes are **untrusted input**: `decodeProfile()` checks the
  magic/version, clamps numbers, bounds list lengths, re-sanitises the name, and
  drops oversized/invalid photos before anything reaches the store.
- Scanning uses the browser's built-in `BarcodeDetector` (no third-party scanner
  that phones home); frames are processed on-device. `Permissions-Policy` allows
  the camera for the **same origin only**.
- Photos are accepted only as small local `data:` images — never remote URLs.

**Code:** `lib/share.ts`, `lib/qr.ts`, `lib/image.ts`, `components/share/*`,
store action `importPlayer()`.

---

## 4 · Simple flow: record, fix, export

- **Fix a result** — on Ranks, the pencil on any match corrects the score, flips
  the winner, or deletes it. Win/loss totals adjust and streaks recompute from
  history (a best-streak badge is never wrongly erased).
- **Export records** — PDF (browser print / "Save as PDF"), Word `.doc`, or CSV,
  all generated on the device from local data.

**Code:** store `editMatchRecord()` / `deleteMatchRecord()` →
`lib/records.ts` (pure, unit-tested) · `components/records/*` · `lib/export.ts`.

---

## 5 · How the system works

```
UI (app/*, components/*)      presentation only; reads via useStore selectors
        │                     calls typed actions; shows { ok:false, code } toasts
Domain (lib/store.ts)         every invariant & guard; returns ok | { ok:false }
        │                     record maths factored into lib/records.ts (pure)
Persistence                   zustand persist → localStorage (versioned, v4)
Sharing                       lib/share.ts encode/decode ↔ QR / code / file
```

**Principles:** local-first · one source of truth for logic · backend-agnostic
types · validate at every boundary (names, scores, photos, decoded codes).

---

## 6 · Quality gate

- `npm run typecheck` — passes
- `npm run lint` — no warnings or errors
- `npm run build` — succeeds (all routes static)
- **20 unit checks** on the pure logic (share codec round-trip + hostile-input
  rejection, coach steps, record edit/delete math, validation) — all pass
- `npm audit` — **0 vulnerabilities**
- Source scan — **no** `eval` / `innerHTML` / `dangerouslySetInnerHTML`, **no**
  outbound network calls, **no** secrets committed

---

## 7 · Free & safe for any developer

The project is **MIT-licensed** — free to use, fork and build on, commercially or
not. It needs no paid service, no API keys, and no account, and collects no data.

**Rules for contributors** (see `ARCHITECTURE.md → "Local-first sharing — the
bridge, not a database"`):

1. **No central database for profiles** — don't store players/photos/records as a
   server-side source of truth.
2. **Offline-first by default** — any new transport must work with no network and
   no account.
3. **Online/email hand-off is opt-in only** — keep the offline path the default.
4. **Always validate decoded payloads** — extend `decodeProfile()`, never bypass
   it.
5. **Keep it benign** — no tracking, no covert collection, nothing designed to
   harm or deceive.
