# d2 — wording for root CLAUDE.md (approved 2026-10-05, with the "styled component kit" tweak)

Two lines change in **Conventions (redesign) → Frontend**. One sentence is added to **Environment**. Nothing else moves.

## Conventions (redesign) → Frontend

```diff
 - React + Vite + TypeScript, rebuilt from scratch.
-- State: Jotai atoms in src/store/.
-- UI library: Claude may recommend one; I approve it at the architect gate.
+- State: server data via TanStack Query; client-only state in Jotai atoms in src/store/ (ADR-02).
+- UI: no styled component kit. Own primitives in src/components/ui/ styled with CSS Modules on design tokens; Base UI (headless) for complex behavior (ADR-01). New libraries are approved at the architect gate.
 - Scandinavian design: neutral palette, generous whitespace, clean typography, few accents.
```

## Environment (append one sentence to the first paragraph)

```diff
 ... (there's no runner and no record of which migrations have run).
+The frontend's `vite.config.ts` also reads the root `.env`, but only `PORT` (for the `/api` dev proxy); nothing from it reaches browser code.
```
