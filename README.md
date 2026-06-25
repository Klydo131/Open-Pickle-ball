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
| 📈 **DUPR-style ratings** | Local, transparent 2.000-8.000 singles/doubles ratings with reliability. Modeled on public DUPR behavior; not an official DUPR integration. |
| 🧑‍⚖️ **Umpire & scorer** | Optionally log who umpired and who recorded each match — shown in records, exports and the player card. |
| ✏️ **Fix any result** | Edit a wrong score, flip the winner, change the officials, or delete a result — records recalculate. |
| ⏳ **Waiting area + match area** | When courts are full, players queue in the waiting area; pull them onto a court when one frees up. |
| 📤 **One-tap share** | Send a profile by message, mail or social with your phone's share sheet — or let a friend scan the QR. Peer-to-peer, no server. |
| 🪪 **Player card** | A polished profile sheet (stats, results, umpire & scorer) that opens in any browser and prints to PDF. |
| 🖨️ **Export records** | Save the leaderboard & history as **PDF**, **Word** or **CSV**, generated on-device. |
| 💾 **Back up & restore** | Save a complete copy of your data as a file and reload it anytime — handy for moving to another device. |
| 🧭 **Guided coach** | A dynamic onboarding with on-screen arrows pointing to your exact next tap as you learn the app. |
| 📱 **Install anywhere** | Installable PWA, offline-capable, dark sporty UI tuned for phones. |

### DUPR-style rating note

This repo does **not** claim to calculate official DUPR ratings. The local model
is a transparent testing approximation based on DUPR's public documentation:
ratings use a 2.000-8.000 scale, singles and doubles are separate, doubles team
ratings use the average of each player, movement is based on score versus
expectation, and reliability is a 1-100% signal influenced by match volume,
recency and player variety. Official DUPR ratings still come from DUPR.

Research basis: [DUPR How It Works](https://www.dupr.com/how-it-works),
[DUPR rating FAQ](https://www.dupr.com/post/upa-integration-and-dupr-algorithm-faqs---all-you-need-to-know),
and [Understanding All Pickleball Ratings](https://www.dupr.com/post/understanding-all-pickleball-ratings).

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
npm test             # run the unit tests (Vitest)
npm run test:watch   # tests in watch mode
```

### Tests & CI

Unit tests live in [`tests/`](./tests) and run on **Vitest** — covering the store's
game rules (match guards, W/L + streaks, edit/delete rollback, officials), the
peer-to-peer share codec (round-trip + hostile-input hardening), the pure record
maths, the player-card document (content, HTML-escaping, per-player uniqueness),
and the guided-coach logic. Every push and pull request runs the full gate
(`typecheck → lint → test → build`) via [GitHub Actions](./.github/workflows/ci.yml).

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
    dupr.ts            # local DUPR-style rating and reliability model
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
