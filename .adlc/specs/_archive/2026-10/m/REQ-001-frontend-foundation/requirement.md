# Rebuild the frontend foundation on the new design system

| Field | Value |
|---|---|
| REQ | REQ-001 |
| Status | validated |
| Phase | spec |
| Created | 2026-10-04 |
| Primary repo | alumni-system |
| Touched repos | alumni-system |
| Related | — (vault has no lessons, gotchas, ADRs or concepts yet) |

## Problem

The frontend in `packages/frontend` was built screen-by-screen on antd, with no tests, a stock lint setup, no formatter, no path aliases, and a flat `components/ pages/ hooks/` layout. It does not follow the redesign conventions in the root `CLAUDE.md` ("Conventions (redesign)"): no design tokens, no light/dark/system theme, no Scandinavian look, and UI components that call the API directly. A new design system now exists in `docs/design/design-system/` (tokens + Button, Input, Card, Tag, ThemeToggle), but nothing in the code uses it. Every page built on the current base would have to be rebuilt later, so the base has to be replaced first.

## Goal

`packages/frontend` is a fresh React 19 + Vite + TypeScript app with an industry-standard toolchain (strict TypeScript, ESLint + Prettier, Vitest + React Testing Library, React Router, path aliases) and a feature-based folder structure. The design system's tokens drive every color, space, radius and type style; the five documented components exist as tested UI primitives; and the app renders an empty shell — a header with a working light/dark/system theme toggle — that later REQs can add pages to. The old antd-based code and the antd dependency are gone. The UI library choice and the TanStack Query decision are recorded as ADRs (architecture decision records — the vault's "why we chose this" notes).

## Non-goals

- No feature pages or flows: no login, register, feed, directory, profile, about, or 404 screens. Those are later REQs.
- No backend changes. The API, `@alumni/shared` types, and the database are untouched.
- No endpoint wrappers (auth/posts/alumni/comments API calls) — only the shared plumbing they will sit on.

## Acceptance criteria

**Clean slate**
- [ ] Everything in `packages/frontend/src` from before this REQ is removed (pages, components, layouts, hooks, services, store, utils, content, theme). It stays reachable in git history.
- [ ] `antd` and `@ant-design/icons` are no longer dependencies, and no file in `packages/frontend` imports them. This removal happens only after the replacement primitives below exist.
- [ ] React and React DOM are on version 19, with matching type packages.

**Toolchain** — each runs from `packages/frontend` and passes on a clean checkout:
- [ ] `npm run typecheck` — TypeScript with `strict: true`, zero errors.
- [ ] `npm run lint` — ESLint (flat config, TypeScript + React + hooks + accessibility rules), zero errors.
- [ ] `npm run format:check` — Prettier reports no unformatted files; `npm run format` fixes them. ESLint and Prettier do not fight (no rule conflicts).
- [ ] `npm test` — Vitest + React Testing Library, runs once and exits with a pass.
- [ ] `npm run build` — produces a production bundle in `dist/` and writes no compiled files (e.g. `vite.config.js`, `.d.ts`, `.map`) next to source.
- [ ] `npm run dev` serves the app, and a relative `/api/...` request from the browser reaches the local API server.

**Structure**
- [ ] `src/` is organized as `app/`, `features/`, `components/ui/`, `store/`, `services/`, `styles/` (plus a test-setup location), and each folder's purpose is written down in a short README or the conventions doc.
- [ ] Imports use path aliases (e.g. `@/components/ui/Button`) instead of long relative paths, and the aliases work the same in the editor, typecheck, build, and tests.
- [ ] UI primitives in `components/ui/` make no API calls and import nothing from `services/`.

**Design tokens and theme**
- [ ] Every color, spacing, radius and type-style token in `docs/design/design-system/tokens.json` is available to components, with both light and dark values.
- [ ] An automated check (lint rule or test) fails when a file under `src/` outside `styles/` contains a raw color value (hex, `rgb()`, `hsl()`), so "tokens only" is enforced, not just intended.
- [ ] No component uses `box-shadow` (the design system says borders, not shadows).
- [ ] The header has a three-way Light / Dark / System toggle matching the ThemeToggle spec. The chosen mode survives a page reload.
- [ ] In System mode the page follows `prefers-color-scheme`, and changes live when the OS setting changes, without a reload.
- [ ] On first load with a saved Dark choice, the page never flashes the light theme before switching.

**UI primitives** — Button, Input, Card, Tag, ThemeToggle exist in `components/ui/` and match their READMEs in `docs/design/design-system/components/`:
- [ ] Button: primary / secondary / ghost variants; disabled state; keyboard-operable.
- [ ] Input: visible label tied to the field, helper text, focus state (accent border, no glow), disabled state.
- [ ] Card: raised surface, hairline border, large radius, no shadow.
- [ ] Tag: neutral, accent, and success / warning / error status forms; status shows a dot as well as color.
- [ ] ThemeToggle: as above, operable by keyboard and announced correctly by a screen reader (current choice is exposed).
- [ ] Each primitive has at least one React Testing Library test covering its variants and its keyboard/accessible behavior.

**App shell**
- [ ] The app renders a shell — header (brand name + theme toggle) and an empty main area — through React Router, with no feature routes.
- [ ] The shell works from 360px wide upward with no horizontal scroll, and does not break at 200% browser zoom.

**Server-state and HTTP plumbing**
- [ ] If TanStack Query is adopted (see ADR below), its provider is wired into the app root with project defaults; if not, the ADR says what replaces it.
- [ ] One shared HTTP client module in `services/` attaches the auth token in one place (not per call site). No endpoint functions yet.

**Decisions recorded**
- [ ] An ADR records the UI-library choice (component library vs. headless primitives vs. hand-built), with the options compared against this design system and why the winner fits.
- [ ] An ADR records whether to use TanStack Query for server state alongside Jotai, and the line between the two (what lives in Query vs. in atoms).
- [ ] The vault's `context/conventions.md` (frontend sections) and the root `CLAUDE.md` frontend notes and Commands section describe the new setup, not the old one.

## Assumptions

- The design system in `docs/design/design-system/` is final enough to build primitives from. It is currently untracked in git (`?? docs/`); it will be committed with or before this REQ. — `STATUS: needs verification`
- Clearing out the old frontend is acceptable even though the app will show only an empty shell until pages are rebuilt (confirmed by the user at spec time, 2026-10-04).
- React 19 upgrade is in scope (confirmed by the user at spec time, 2026-10-04).
- The backend API listens on the `PORT` from the root `.env`, which the dev setup can read to point `/api` at it. — `STATUS: needs verification`
- Inter is the intended font; how it is loaded (self-hosted vs. a font service vs. system fallback only) is an architect decision.

## Open questions

None blocking. Left for `/architect`, and shown at that gate:

- [ ] Which UI approach (e.g. a headless primitive library vs. a styled kit vs. hand-built) — recommendation with reasons, recorded as an ADR.
- [ ] Use TanStack Query or not — recommendation with reasons, recorded as an ADR.
- [ ] How tokens reach components (CSS custom properties, CSS Modules, a CSS-in-JS or utility layer), and how `tokens.json` stays the single source.
- [ ] Which extra strictness flags beyond `strict` (e.g. `noUncheckedIndexedAccess`) to turn on.

## Out of scope (for now)

- Rebuilding any page (login, register, feed, directory, profiles, about, forgot-password, 404) — one REQ per area later.
- The design system's `Cover` brand illustration (`components/Cover/preview.html`) — it is artwork, not a UI primitive.
- Primitives the design system doesn't document yet (modal, menu, avatar, select, toast). Add them when the first page needs them.
- Lint, format, or tests for the backend and shared packages.
- CI pipeline wiring.
- End-to-end browser tests (Playwright etc.).

## Related

- Concepts: —
- Components: —
- Lessons: —
- ADRs: — (two to be proposed at `/architect`)

## Backlinks

_(populated by /wrapup or manually)_
