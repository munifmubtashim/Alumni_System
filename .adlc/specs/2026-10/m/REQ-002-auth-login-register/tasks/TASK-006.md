# TASK-006 — Routes, header auth area with user menu, signed-in Home, SessionBridge mount

| Field | Value |
|---|---|
| REQ | REQ-002 |
| Tier | 3 |
| Status | pending |
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

- [ ] AppShell tests: guest sees Log in/Sign up; signed-in sees the menu with the name; Log out → /login and token cleared; existing AppShell tests that render `/` now hit the RequireAuth guard: update them (seed a token + mock `getMe`, or render a guest route) and list each change in Notes; the theme, skip-link and error-layer behaviour they cover must still be asserted
- [ ] Full-route tests: guest at `/` → /login → log in → back at `/` with the welcome; signed-in at `/login` → `/`; an expired token at load → /login
- [ ] HomePage greets by name and role; lint, format:check, typecheck, test, build pass

## Related

- Architecture: [[specs/2026-10/m/REQ-002-auth-login-register/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-4]], [[knowledge/lessons/LESSON-REQ-001-5]], [[knowledge/lessons/LESSON-REQ-001-6]], [[knowledge/lessons/LESSON-REQ-001-7]], [[knowledge/lessons/LESSON-REQ-001-9]]; gotchas G05, G07
