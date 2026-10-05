# TASK-006 — Routes, header auth area with user menu, signed-in Home, SessionBridge mount

| Field | Value |
|---|---|
| REQ | REQ-002 |
| Tier | 3 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-005 |
| Blocks | TASK-007 |

## Goal

The app routes guests and signed-in users per the spec, the header shows auth links or a user menu, and the signed-in home greets the user.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/app/router.tsx` | edit |
| `packages/frontend/src/app/App.tsx` | edit — import `RouterProvider` from `react-router/dom` (needed for `flushSync`; TASK-004) |
| `packages/frontend/src/features/auth/guards.module.css` | create — space the RequireAuth error Alert's Retry/Log out buttons (`gap: var(--space-3)`), wire the class in guards.tsx |
| `packages/frontend/src/features/auth/guards.tsx` | edit — className only |
| `packages/frontend/src/app/AppShell/AppShell.tsx` | edit |
| `packages/frontend/src/app/AppShell/AppShell.module.css` | edit |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx` | edit |
| `packages/frontend/src/app/AppShell/HeaderAuth.tsx` | create |
| `packages/frontend/src/features/home/{HomePage.tsx,HomePage.module.css,HomePage.test.tsx,index.ts}` | create |
| `packages/frontend/src/features/README.md` | edit — list auth, home |

## Approach

- From TASK-004: `app/App.tsx` and any test that renders `RouterProvider` must import it from `react-router/dom` (it wires ReactDOM.flushSync, which SessionBridge/useLogout rely on to avoid a double redirect to /login). Verify with the "two simultaneous 401s → one navigation" behaviour in the full-route tests.

- Menu API (from TASK-003): import `{ Menu, MenuItem, MenuLabel }` from `@/components/ui/Menu` (separate exports, not `Menu.Item`).

- router: inside the existing path-less error layout add `{ element: <GuestOnly/>, children: [{ path: 'login', element: <LoginPage/> }, { path: 'register', element: <RegisterPage/> }] }` and `{ element: <RequireAuth/>, children: [{ index: true, element: <HomePage/> }] }`; keep `*` → null and both errorElements; keep `createRoutes(pageRoutes)` working for tests.
- AppShell: mount `<SessionBridge/>` once; header right side = `HeaderAuth` + ThemeToggle, wrapping on narrow widths. HeaderAuth: no session → ButtonLink ghost "Log in" (/login) + ButtonLink primary "Sign up" (/register); session → Menu with trigger = user name (from useCurrentUser; while loading or on error the trigger reads "Account" and still offers Log out), a Menu.Label with name + role, and a "Log out" item → useLogout().
- HomePage: `heading-lg` "Welcome, {name}", body "You're signed in as a student|an alumnus", ink-secondary "More is coming soon: the feed, directory and profiles."

## Acceptance

- [x] AppShell tests: guest sees Log in/Sign up; signed-in sees the menu with the name; Log out → /login and token cleared; existing AppShell tests that render `/` now hit the RequireAuth guard: update them (seed a token + mock `getMe`, or render a guest route) and list each change in Notes; the theme, skip-link and error-layer behaviour they cover must still be asserted
- [x] Full-route tests: guest at `/` → /login → log in → back at `/` with the welcome; signed-in at `/login` → `/`; an expired token at load → /login
- [x] HomePage greets by name and role; lint, format:check, typecheck, test, build pass

## Notes

Implementation notes (2026-10-05):
- `App.tsx` imports `RouterProvider` from `react-router/dom`. Checked: swapping the AppShell test import to `react-router` makes "Log out → /login" and "two simultaneous 401s" fail (double navigation), so the tests pin it.
- AppShell test changes (REQ-001 tests that rendered `/`, now behind RequireAuth): "renders the header, theme toggle, main area and skip link", "applies and saves Dark", "starts in System mode" now render the guest route `/login` (no session needed; same assertions). "unknown path" (`/does-not-exist` → `*`), "page throws" (custom `createRoutes`) and "shell throws" (`/` with the shell swapped) are unchanged. The file now uses `react-router/dom` and mocks the axios adapter (`GET /me`, `POST /auth/login`, `GET /posts`).
- New AppShell tests: guest links; signed-in menu (name, role label, Log out item, `aria-haspopup`); keyboard open (Enter focuses Log out); Log out → /login, one navigation, token cleared, no expired notice; /me 404 → trigger "Account" still logs out. Full-route: guest `/` → /login → log in → `/` with welcome; signed-in `/login` and `/register` → `/`; expired token at load → /login, token dropped, no /me call; two 401s → one navigation + notice.
- HeaderAuth: guest links sit in `<nav aria-label="Account">`. The menu uses `align="end"` (it sits at the right edge). MenuLabel shows the name (`ink-primary`, label type) over the role ("Student" / "Alumni" / "Admin").
- HomePage: role line ends with a full stop; `admin` reads "an admin" (spec only names student/alumnus; `MyProfile.role` also allows admin). Returns null if `['me']` has no data (RequireAuth guarantees it does).
- guards.tsx: besides the class, removed the `{' '}` spacer between Retry and Log out (the flex gap replaces it).
- Checks (packages/frontend): lint, format:check, typecheck, `npm test` (27 files, 392 tests), `npm run build` all pass. Build now warns the single JS chunk is ~565 kB (> 500 kB); follow-up: route-level code splitting.

## Related

- Architecture: [[specs/2026-10/m/REQ-002-auth-login-register/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-4]], [[knowledge/lessons/LESSON-REQ-001-5]], [[knowledge/lessons/LESSON-REQ-001-6]], [[knowledge/lessons/LESSON-REQ-001-7]], [[knowledge/lessons/LESSON-REQ-001-9]]; gotchas G05, G07
