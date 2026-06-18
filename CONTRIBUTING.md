# Contributing to Open Pickleball

Thanks for helping build Open Pickleball! This guide keeps the codebase
consistent and the design system intact.

## Getting started

```bash
git clone <your-fork>
cd Open-Pickle-ball
npm install
npm run dev
```

Before pushing, make sure all three pass:

```bash
npm run typecheck   # no type errors
npm run lint        # no lint errors
npm run build       # production build succeeds
```

## Project conventions

- **TypeScript everywhere**, `strict` mode on. No `any` unless truly unavoidable
  (and commented).
- **Business logic lives in `src/lib/store.ts`.** Components should call actions,
  not reimplement rules. New rules return an `ActionResult`
  (`{ ok } | { ok:false, code, message }`) so the UI can show a friendly toast.
- **Validate input** with Zod in `src/lib/validation.ts`. Never trust raw text.
- **Use the design tokens.** Colours, radii and fonts come from
  `tailwind.config.ts` / `src/lib/theme.ts`. Don't introduce off-palette colours.
  Yellow is for the primary action only.
- **Reuse primitives**: `SportCard`, `PrimaryButton`, `SectionHeader`, `Modal`,
  `EmptyState`, `StatsStrip`, `PlayerName`/`PlayerChip`.
- **Every interactive element** needs hover/active/disabled states and an
  accessible label where the content isn't text.
- **No `dangerouslySetInnerHTML`.** Keep XSS off the table.

## Commit style

Short, imperative subject lines, e.g.:

```
Add doubles team validation to startMatch
Fix waiting-queue ordering in StartMatchModal
```

## Adding a feature

1. Add/extend types in `src/lib/types.ts`.
2. Add the rule as a typed action in `src/lib/store.ts` (+ validation).
3. Build the UI from existing primitives.
4. Run typecheck / lint / build.

## Design north star (don't regress this)

The app should feel like a **sports poster and a match command center** — fast,
competitive, friendly. Diagonal red speed streaks, halftone texture, court-line
geometry, glassy dark cards, bold athletic type. Never let it collapse into a
generic white template.
