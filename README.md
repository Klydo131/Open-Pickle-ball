<div align="center">

# 🥒 Open Pickleball

### **Play More. Play Open.**

A hyped, sporty, **local-first** pickleball match app. Add your crew, track wins
& losses, and run the **waiting area** and **match area** of any court night from
one screen.

**Works everywhere** — it's a Progressive Web App built on Next.js, so the same
codebase runs in any browser on desktop and mobile, and installs to the home
screen. **Deploys to Vercel** with zero configuration.

</div>

---

> **🔒 Privacy:** 100% local. No account, no sign-in, no tracking, no backend,
> no network calls. Everything you enter (names, scores, themes, **photos**)
> stays on your device in `localStorage` and **never leaves it**. Sharing a
> profile is **peer-to-peer** — the data travels inside a QR/code, not through a
> server. Nothing to leak.

---

## ✨ Features (v1)

| Feature | What it does |
| --- | --- |
| 👤 **Connect players locally** | Add names to a local roster — no account, no internet required. |
| 📸 **Profiles & photos** | Snap a selfie for any player; it's compressed and kept on-device only. |
| 🎨 **Name themes** | Each player picks a gradient theme that styles their name everywhere. |
| 🏆 **Win / loss records** | Every recorded match updates each player's W/L, win-rate and streaks. |
| 🧑‍⚖️ **Umpire & scorer** | Optionally log who umpired and who recorded each match — shown in records, exports and the player card. |
| ✏️ **Fix any result** | Edit a wrong score, flip the winner, change the officials, or delete a result — records recalculate. |
| ⏳ **Waiting area + match area** | When courts are full, players queue in the waiting area; pull them onto a court when one frees up. |
| 🔗 **Share by QR / code** | Hand a player's profile + record to another phone, peer-to-peer — no server, no account. |
| 🪪 **Downloadable player card** | Export a polished profile sheet (stats, results, umpire & scorer) as a standalone HTML/PDF — the share QR & code ride inside it. |
| 🖨️ **Export records** | Save the leaderboard & history as **PDF**, **Word** or **CSV**, generated on-device. |
| 🧭 **Guided coach** | A dynamic onboarding with on-screen arrows pointing to your exact next tap as you learn the app. |
| 📱 **Install anywhere** | Installable PWA, offline-capable, dark sporty UI tuned for phones. |

## 🎨 Design system

Pulled straight from the Open Pickleball art direction — a sports poster, not a
generic template:

- **Deep Ocean** `#061B3A` · **Court Blue** `#082A5E` · **Electric Blue** `#32A7FF`
- **Pickle Yellow** `#FFD626` (primary action) · **Serve Red** `#FF314F` (accents)
- Athletic condensed type (Barlow Condensed), diagonal speed streaks, halftone
  texture, court-line geometry, glassy dark cards.

## 🚀 Quick start

```bash
npm install
npm run dev
```

Then open your browser and the app will be running locally. That's it — **no environment variables, no database, no backend**. All data stays on your device in the browser (`localStorage`) and never leaves it.

### Useful scripts

```bash
npm run dev          # start the dev server
npm run build        # production build
npm run start        # run the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit (no emit, types only)
```

## ☁️ Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **New Project → Import** the repo.
3. Framework preset: **Next.js** (auto-detected). No env vars required.
4. **Deploy.**

The security headers in `next.config.mjs` (CSP, HSTS, etc.) apply automatically
on Vercel.

## 🧱 Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** design tokens
- **Zustand** (persisted) for state — see `src/lib/store.ts`
- **Zod** for input validation
- **PWA**: `manifest.webmanifest` + a dependency-free service worker

## 🗂️ Project structure

```
src/
  app/                 # routes: / (home), /play, /players, /leaderboard, /help
  components/
    coach/             # the dynamic guided-coach onboarding + on-screen arrows
    share/             # share + import a profile (QR / code / file)
    records/           # edit a result + export (PDF / Word / CSV)
    players/ play/ …   # feature components + UI primitives (incl. officials picker)
  lib/
    store.ts           # ← all business logic (the "backend") lives here
    types.ts           # domain models
    validation.ts      # zod schemas (reused server-side later)
    coach.ts           # next-step logic + arrow targets for the guided coach
    share.ts           # encode/decode a portable profile (the P2P "bridge")
    qr.ts              # in-browser QR rendering (no network)
    image.ts           # on-device photo compression
    export.ts          # CSV / Word / PDF record exports
    profileCard.ts     # standalone player-card document (stats, results, officials)
    playerThemes.ts    # name themes
    selectors.ts       # ranking / lookups
  hooks/
public/                # PWA manifest, service worker, icons
```

> **🔗 Local-first sharing:** profiles move device-to-device via QR, a copy-paste
> code, or a file — there is **no central database**. See
> [`ARCHITECTURE.md`](./ARCHITECTURE.md) → *Local-first sharing — the bridge, not
> a database* for the model and the rules for contributors.

## 📚 Docs

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how it's built and **how to swap in a real backend** without touching the UI.
- [`SECURITY.md`](./SECURITY.md) — threat model, the headers we ship, and the production hardening path.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — dev workflow and conventions.

## 🗺️ Roadmap

Local-first by design. The architecture is backend-agnostic: a hosted Postgres
backend (accounts, realtime, match discovery) can be added later without
touching the UI — documented in `ARCHITECTURE.md`.

## 📄 License

[MIT](./LICENSE) — open source, free to use and build on.
