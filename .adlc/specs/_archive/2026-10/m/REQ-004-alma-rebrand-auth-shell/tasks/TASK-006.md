# TASK-006 — Revision: full-page auth layout without the app header

| Field | Value |
|---|---|
| REQ | REQ-004 |
| Tier | 3 (revision at the implement gate) |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-001..005 |
| Blocks | — |

## Goal

Login and sign-up follow the login design's layout (spec AC8): full-height 45/55 split, no app header (theme toggle top-right only), no card, a space-between brand panel, and the heading with its prompt line directly below. Session handling keeps working on every page.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/app/router.tsx` | edit — root layout → AuthShell(GuestOnly…) + AppShell(RequireAuth, `*`, test pageRoutes); two error layers on each branch |
| `packages/frontend/src/app/RootLayout.tsx` (+ test if useful) | create — `useApplyTheme()`, `<SessionBridge />`, `<Outlet />` |
| `packages/frontend/src/app/AuthShell/{AuthShell.tsx,AuthShell.module.css,index.ts}` | create — `<main id="main">` + top-right ThemeToggle + Outlet (+ skip link not needed: no header to skip) |
| `packages/frontend/src/app/AppShell/AppShell.tsx` | edit — drop `SessionBridge` and `useApplyTheme` (moved to RootLayout) |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx`, `src/features/auth/guards.test.tsx` | edit only if a test renders AppShell directly and relied on SessionBridge/theme there; report each change |
| `packages/frontend/src/features/auth/AuthLayout.tsx`, `AuthLayout.module.css` | edit — layout per architecture.md → Revision; `headline` prop; no Card |
| `packages/frontend/src/features/auth/LoginPage.tsx`, `RegisterPage.tsx` (+ `.module.css`) | edit — pass `headline`; prompt line under the heading (from `footer`); no logic change |
| `packages/frontend/src/features/auth/LoginPage.test.tsx`, `RegisterPage.test.tsx` | add cases (no banner, prompt after h1, © line); existing cases unchanged |
| `packages/frontend/src/styles/contrast.test.ts` | add any new pair (e.g. `ink-muted` on `surface-sunken` for the © line) |
| `CLAUDE.md`, `.adlc/context/conventions.md`, `packages/frontend/README.md`, `src/app/README.md` | edit — routing: root layout + AuthShell; SessionBridge mounted in RootLayout; auth pages have no header |

## Approach

See architecture.md → "Revision (implement gate)". Key rules:
- `SessionBridge` mounts exactly once, in `RootLayout`, above both shells.
- `createRoutes(pageRoutes)` keeps its signature. Test pages go under `AppShell`.
- Below 60rem the panel shows only its logo row (one Logo DOM node at every width); the h1 is the only h1.
- Map every design value to tokens. Headline `--text-heading-lg`, heading `--text-heading-md`, © `--text-caption`. The design's 24/34px are not used.

## Acceptance

- [ ] `/login` and `/register` have no `banner`; one ThemeToggle; the panel holds logo, headline, 3 points, "© 2026 Alma"; the form has no Card
- [ ] Session tests (expired token, 401 → /login notice, cache clear) and guard tests pass **unchanged**
- [ ] No diff to hooks, validators, `authErrors`, guards, `redirect`, `SessionBridge` itself, services
- [ ] `npm run typecheck`, `lint`, `format:check`, `test`, `build` pass in packages/frontend

## Notes

### Implementation notes (2026-10-06)

- **Status: done.** typecheck, lint, format:check, build pass; `npm test` 459 passed. The 4 AppShell tests that opened `/login` to see the header were changed with user approval at the implement gate: tests 1-3 now open `/does-not-exist`; "Log out clears the token…" now ends with "no banner" (Log out lands on the header-less login page). No check weakened. The theme tests at `/login` and the ShellBoom test pass unchanged.
- Session tests (`session.test.tsx`) and guard tests (`guards.test.tsx`) pass with no diff. No diff to hooks, validators, authErrors, guards, redirect, SessionBridge, services.
- **Routing:** `createRoutes(pageRoutes)` keeps its signature. Auth routes (`AUTH_ROUTES`) are now always under AuthShell; `pageRoutes` (default: RequireAuth Home + `*`) go under AppShell. So a test passing its own pages now also gets `/login`, `/register` — harmless.
- **Login prompt:** now the design's "New here? Create an account" (link to /register), approved; the two existing LoginPage tests that found the link by "Sign up" now use "Create an account", nothing else changed in them. Sign-up's "Already have an account? Log in" already matched its design.
- **Deviation, © colour:** `--ink-secondary`, not `--ink-muted` (2.79:1 on surface-sunken in light, under 4.5:1). No new contrast pair needed: ink-secondary on surface-sunken is already tested.
- **Layout:** below 60rem the panel is transparent, shows only the logo (centred, named via its wordmark), with `--space-8` top padding to clear the toggle; heading and prompt centred as in Phone-Light. From 60rem: panel `--surface-sunken`, `--space-7` padding, space-between; column centres a `min(100%, 380px)` block; header block gap `--space-2`, block gap `--space-6`. Toggle insets `--space-4` (phone) / `--space-5` (48rem+). Toggle sits before `<main>` in the DOM, outside any landmark.
- **New tests:** `app/AuthShell/AuthShell.test.tsx` (no banner, no skip link, one toggle, h1 in main, named logo on /login and /register; theme applies on auth pages; header kept on other pages); one case each in LoginPage/RegisterPage tests (one h1, prompt is the h1's next sibling and precedes the form, headline, © line).
- **Not done:** the browser side-by-side check with the design files (no browser in this run). `src/features/README.md` brand-panel sentence updated (brought into scope).

## Related

- Architecture: [[specs/2026-10/m/REQ-004-alma-rebrand-auth-shell/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-7-route-errors-pathless-layout|L-REQ-001-7]], [[knowledge/lessons/LESSON-REQ-002-4-one-guard-owns-post-login-navigation|L-REQ-002-4]], ADR-03

### Browser comparison (orchestrator, 2026-10-06)

Compared side by side in Chrome at 1440×900: `/login` light vs `login/Main.dc.html`, `/login` dark vs `login/Desktop-Dark.dc.html`, `/register` vs `signup/Main.dc.html`; phone width (Chrome's minimum is a 500px viewport).
- Matches: full-height 45/55 split, edge to edge; space-between panel (logo / headline + points / ©); no header, toggle top-right; borderless centred 380px form; heading with its prompt directly below.
- Fixed after the comparison: heading→prompt gap `--space-2` → `--space-1`; headline `max-width` 26rem → 20rem so it wraps after "your" as in the design; desktop panel made `position: sticky` (100vh), so the logo and © stay visible while the long sign-up form scrolls.
- Intentional differences: beige `--surface-sunken` panel (architect gate); 20/28px type (no 24/34 tokens); inputs on `--surface-sunken` per the design-system README (the screen export's white inputs are older); "Create an account" keeps its underline (link not shown by colour alone); no "Remember me" or counts; © uses `--ink-secondary` (contrast); phone logo shows mark and wordmark side by side, not stacked.
- At a real 390px phone the 24px column padding matches the design's margins; no horizontal scroll at 500px.
