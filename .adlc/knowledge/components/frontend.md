# Component — frontend (`packages/frontend`)

| Field | Value |
|---|---|
| Path | `packages/frontend` |
| Owner | munifmubtashim |
| Status | current as of REQ-001 (2026-10-05) |

React 19 + Vite 8 + TypeScript 6 SPA, rebuilt from scratch in [[REQ-001]]. Today it renders only the shell: a header with "Alumni Network" and the light/dark/system theme toggle, plus an empty main area. Feature pages come in later REQs.

## Structure

- `src/app/` — `App`, providers (TanStack Query + Jotai), `router.tsx` (`createRoutes`, two error layers), `AppShell`, `RouteError`, `queryClient.ts`. Only `main.tsx` imports it (lint-enforced; tests are exempt).
- `src/features/` — one folder per domain; `theme/` (`useApplyTheme`) is the first.
- `src/components/ui/` — Button, Input, Card, Tag, ThemeToggle, plus the shared `cx.ts` class joiner (reuse it; don't write another). Props in, events out; no services or store imports.
- `src/store/` — Jotai atoms (`themePreferenceAtom`).
- `src/services/` — `httpClient.ts` (one axios instance, attaches the token), `authToken.ts` (the only home of the token).
- `src/styles/` — generated `tokens.css`, `global.css`, `contrast.test.ts`.
- `scripts/` — `generate-tokens.ts`, plus Node-side tests (`enforcement.test.ts`, `generate-tokens.test.ts`).

## Decisions and rules

- UI: [[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]] — own primitives on CSS Modules + tokens; Base UI for complex behavior.
- State: [[architecture/adr-02-server-state-tanstack-query|ADR-02]] — TanStack Query for server data, Jotai for client-only state.
- Tokens: [[knowledge/concepts/design-tokens]].
- Toolchain pins: TypeScript ~6.0, ESLint 9, jsdom 29 — see [[knowledge/lessons/LESSON-REQ-001-1]].

## Gotchas

[[knowledge/gotchas#^g01|G01]] theme key duplicated · [[knowledge/gotchas#^g02|G02]] vitest nesting · [[knowledge/gotchas#^g03|G03]] standalone tsconfigs · [[knowledge/gotchas#^g04|G04]] Stylelint numbers / `:where()` · [[knowledge/gotchas#^g05|G05]] Base UI radio · [[knowledge/gotchas#^g06|G06]] token script · [[knowledge/gotchas#^g07|G07]] lint self-test

## Touched by

- [[REQ-001]] — foundation rebuild
