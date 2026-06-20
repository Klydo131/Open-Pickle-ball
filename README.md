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

## ✨ Features (v1)

| Feature | What it does |
| --- | --- |
| 👤 **Connect players locally** | Add names to a local roster — no account, no internet required. |
| 🏆 **Win / loss records** | Every recorded match updates each player's W/L and win-rate. |
| ⏳ **Waiting area + match area** | When courts are full, players queue in the waiting area; pull them onto a court when one frees up. |
| 🎨 **Name themes** | Each player picks a gradient theme that styles their name everywhere. |
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
npm run dev          # http://localhost:3000
```

That's it — **no environment variables, no database**. Data is stored in your
browser (`localStorage`). To create a `.env.local` later (only needed for the
optional backend), copy `.env.example`.

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
  app/                 # routes: / (home), /play, /players, /leaderboard
  components/          # UI primitives + feature components
  lib/
    store.ts           # ← all business logic (the "backend") lives here
    types.ts           # domain models
    validation.ts      # zod schemas (reused server-side later)
    playerThemes.ts    # name themes
    selectors.ts       # ranking / lookups
  hooks/
public/                # PWA manifest, service worker, icons
```

## 📚 Docs

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how it's built and **how to swap in a real backend** without touching the UI.
- [`SECURITY.md`](./SECURITY.md) — threat model, the headers we ship, and the production hardening path.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — dev workflow and conventions.

## 🗺️ Roadmap

Local-first today; the architecture is ready for a Supabase/Postgres backend
(accounts, realtime, match discovery) — documented in `ARCHITECTURE.md`.

## 📄 License

[MIT](./LICENSE) — open source, free to use and build on.
