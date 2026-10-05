# Component — frontend (`packages/frontend`)

| Field | Value |
|---|---|
| Path | `packages/frontend` |
| Owner | munifmubtashim |
| Status | current as of REQ-002 (2026-10-05) |

React 19 + Vite 8 + TypeScript 6 SPA, rebuilt from scratch in [[REQ-001]]. Since [[REQ-002]] it has log in (`/login`), sign up (`/register`) and a signed-in home (`/`), behind route guards. The header shows the theme toggle plus Log in / Sign up for guests, or a user menu with Log out.

## Structure

- `src/app/` — `App` (`RouterProvider` from `react-router/dom`, [[knowledge/gotchas#^g08|G08]]), providers (TanStack Query + Jotai), `router.tsx` (`createRoutes`, two error layers, `GuestOnly`/`RequireAuth` layouts), `AppShell` (+ `HeaderAuth`, mounts `SessionBridge`), `RouteError`, `queryClient.ts`. Only `main.tsx` imports it (lint-enforced; tests are exempt).
- `src/features/` — one folder per domain: `theme/` (`useApplyTheme`), `auth/` (session hooks, `SessionBridge`, guards, validation, error mapping, Login/Register pages), `home/` (`HomePage`).
- `src/components/ui/` — Button (`loading`), ButtonLink, Input (`error`), Card, Tag, Alert, Menu, SegmentedControl, ThemeToggle (built on SegmentedControl), plus the shared `cx.ts` class joiner (reuse it; don't write another). Props in, events out; no services or store imports.
- `src/store/` — Jotai atoms (`themePreferenceAtom`, `sessionNoticeAtom`).
- `src/services/` — `httpClient.ts` (one axios instance, attaches the token, `setUnauthorizedHandler` 401 hook), `authToken.ts` (the only home of the token; `subscribe`, `getLiveToken`, expiry), `authApi.ts` (`login`, `register`, `getMe`).
- `src/styles/` — generated `tokens.css`, `global.css`, `contrast.test.ts`.
- `scripts/` — `generate-tokens.ts`, plus Node-side tests (`enforcement.test.ts`, `generate-tokens.test.ts`).

## Decisions and rules

- UI: [[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]] — own primitives on CSS Modules + tokens; Base UI for complex behavior.
- State: [[architecture/adr-02-server-state-tanstack-query|ADR-02]] — TanStack Query for server data, Jotai for client-only state.
- Session and 401s: [[architecture/adr-03-frontend-session-and-401-handling|ADR-03]], [[knowledge/concepts/session-and-401]].
- Forms: [[architecture/adr-04-forms-without-a-library|ADR-04]] — controlled inputs, pure validators, `useMutation`; no form library.
- Tokens: [[knowledge/concepts/design-tokens]].
- Toolchain pins: TypeScript ~6.0, ESLint 9, jsdom 29 — see [[knowledge/lessons/LESSON-REQ-001-1]].

## Gotchas

[[knowledge/gotchas#^g01|G01]] theme key duplicated · [[knowledge/gotchas#^g02|G02]] vitest nesting · [[knowledge/gotchas#^g03|G03]] standalone tsconfigs · [[knowledge/gotchas#^g04|G04]] Stylelint numbers / `:where()` · [[knowledge/gotchas#^g05|G05]] Base UI radio · [[knowledge/gotchas#^g06|G06]] token script · [[knowledge/gotchas#^g07|G07]] lint self-test · [[knowledge/gotchas#^g08|G08]] react-router/dom · [[knowledge/gotchas#^g09|G09]] Base UI menu · [[knowledge/gotchas#^g10|G10]] lint spellings · [[knowledge/gotchas#^g11|G11]] axios test adapter · [[knowledge/gotchas#^g12|G12]] session test traps

## Touched by

- [[REQ-001]] — foundation rebuild
- [[REQ-002]] — login, sign-up, session, header user menu, signed-in home
