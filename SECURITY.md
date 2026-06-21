# Security

Open Pickleball v1 is **local-first**: there is no server, no account, and no
personal data leaves the device. That removes most of the classic web attack
surface, but we still hold the app to an **industrial-standard baseline** so it
stays safe as features grow.

## What ships today

### HTTP security headers (`next.config.mjs`)

Applied to every route, in dev and in production (including on Vercel):

| Header | Value / purpose |
| --- | --- |
| `Content-Security-Policy` | Locks sources to `'self'`; `object-src 'none'`, `frame-ancestors 'none'`, `frame-src 'none'`, `child-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `connect-src 'self'`, `upgrade-insecure-requests`. |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` — force HTTPS. |
| `X-Frame-Options: DENY` | Anti-clickjacking (with `frame-ancestors`). |
| `X-Content-Type-Options: nosniff` | No MIME sniffing. |
| `Referrer-Policy` | `strict-origin-when-cross-origin`. |
| `Permissions-Policy` | Camera, mic, geolocation, payment, USB, and sensors all **disabled** (`=()`). |
| `Cross-Origin-Opener-Policy` | `same-origin` — isolates the browsing context. |
| `Cross-Origin-Resource-Policy` | `same-origin` — blocks cross-origin embedding of our resources. |
| `X-Permitted-Cross-Domain-Policies` | `none`. |
| `X-DNS-Prefetch-Control` | `off`. |
| `poweredByHeader: false` | Don't advertise the framework. |
| `images: { unoptimized: true }` | Disables the Next image optimizer entirely (the app uses no `next/image`), removing that attack surface. |

### Input validation & output safety

- **All** user text (player names, court names) is validated and sanitised with
  Zod schemas in `src/lib/validation.ts` *before* it enters state — length
  limits, whitespace collapsing, and ASCII control-character stripping.
- Output is rendered through React, which **escapes by default**. The app uses
  **no** `dangerouslySetInnerHTML`, so stored-XSS via a player name is not
  possible.
- Scores are clamped to integers `0–99`; ties are rejected; team composition is
  validated (size, no duplicate/overlapping players).

### State integrity

- Mutations go through guarded actions that return typed results
  (`COURT_BUSY`, `PLAYER_IN_MATCH`, `NEED_PLAYERS`, …) instead of throwing, so a
  bad action can never corrupt the store.
- The persisted store is **versioned** (`open-pickleball:v1`) so future schema
  changes can migrate cleanly.

### Dependencies

- Small, well-known dependency set. No secrets in the client bundle (there are
  none to leak in v1).
- **`npm audit` is clean — 0 known vulnerabilities.**
- The framework was upgraded to **Next.js 15** (`15.5.x`) + **React 19**, which
  clears the Next.js advisories that affected the 14.x line. A `postcss`
  override (`^8.5.10`) pins the build-time transitive dependency above its
  advisory range.
- Recommended CI gate: `npm audit` plus the typecheck / lint / build pipeline.
  Re-run `npm audit` on every dependency change.

## The production hardening path (when a backend is added)

If you ever add a hosted Postgres backend (see `ARCHITECTURE.md`), follow this
security model:

1. **Enable Row Level Security (RLS) on every table _before_ any public client
   connects.** Public reads limited to safe fields; writes restricted to the
   owner/participant.
2. **Keep high-impact actions server-side.** `join_match`, `cancel_match`,
   `confirm_player` run as transaction-safe RPCs / Edge Functions that lock the
   match row and re-check capacity — never trust the client for capacity.
3. **Never expose the service-role key.** Server-only. Never prefix a secret
   with `NEXT_PUBLIC_`. Use Vercel/CI encrypted env vars. `.env*` is gitignored.
4. **Reuse the Zod schemas server-side** so validation runs on both ends.
5. **Tighten CSP** with per-request nonces (drop `'unsafe-inline'` for scripts)
   and add a `connect-src` entry for your backend origin.
6. **Auth:** email/password first; rate-limit auth endpoints; hash with the
   provider's defaults; enforce host-only permissions in policies, not just UI.
7. **Privacy:** make profile/match visibility explicit; log backend failures
   only, not personal activity.

## Reporting a vulnerability

This is an open-source educational project. If you find a security issue, please
open a private report / security advisory on the repository rather than a public
issue, and avoid sharing exploit details publicly until it's addressed.
