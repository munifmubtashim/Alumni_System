# TASK-009 — App shell, router, error boundary, wiring

| Field | Value |
|---|---|
| REQ | REQ-001 |
| Tier | 4 |
| Status | complete |
| Repo | alumni-system |
| Depends on | TASK-005, TASK-006, TASK-007, TASK-008 |
| Blocks | TASK-010 |

## Goal

`npm run dev` shows the empty shell — a header with the brand name and a working theme toggle, plus an empty main area — through React Router, responsive from 360px.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/app/App.tsx` | edit (replace placeholder) |
| `packages/frontend/src/app/router.tsx` | create |
| `packages/frontend/src/app/AppShell/{AppShell.tsx,AppShell.module.css,AppShell.test.tsx,index.ts}` | create |
| `packages/frontend/src/app/RouteError.tsx` | create |
| `packages/frontend/src/main.tsx` | edit if needed (StrictMode) |
| `packages/frontend/src/test/smoke.test.tsx` | edit — check the `@/` alias with `THEME_STORAGE_KEY` instead of rendering `<App/>` (user-approved 2026-10-05) |

## Approach

- `router.tsx`: `createBrowserRouter` from `react-router` as in architecture.md (layout route `/` → `AppShell` with `errorElement: <RouteError/>` for shell crashes; inside it a **path-less child layout route** with its own `errorElement: <RouteError/>` whose children are index + `*` rendering `null`, so page errors render inside `<main>` under the header — user-approved 2026-10-05). Export a `createAppRouter(opts?)` so tests can use `createMemoryRouter` with the same route objects (export `routes`).
- `App.tsx`: `<AppProviders><RouterProvider router={router} /></AppProviders>`.
- `AppShell`: calls `useApplyTheme()`; reads/writes `themePreferenceAtom` and passes it to `<ThemeToggle>`; markup: skip link "Skip to content" → `#main`, `<header>` with brand text "Alumni Network" (constant in `app/brand.ts`) and the toggle, `<main id="main" tabIndex={-1}><Outlet/></main>`. CSS: container `max-width` via a token-friendly value (add `--layout-max-width` only if needed — prefer `min(100%, 72rem)` written with no raw color/spacing; widths aren't in the strict-value list), header `display:flex; flex-wrap: wrap; gap: var(--space-4); padding: var(--space-4)`; at ≥ 48rem padding `var(--space-5) var(--space-6)`; bottom hairline `1px solid var(--border-subtle)`.
- `RouteError`: uses `useRouteError()`; shows "Something went wrong." heading and a link home, inside a Card. Not a page; no logging beyond `console.error` in dev only.

## Acceptance

- [ ] AppShell test (memory router at `/`): banner landmark with "Alumni Network", radiogroup "Theme", main landmark present; skip link targets `#main`.
- [ ] Selecting Dark sets `document.documentElement.dataset.theme === 'dark'` and `localStorage['alumni.theme'] === '"dark"'`.
- [ ] Memory router at `/does-not-exist` still renders the shell (no error UI).
- [ ] A child route that throws renders `RouteError` inside the app.
- [ ] `npm run build` passes; `npm run dev` shows the shell (manual check, note result in task report).
- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check` pass.

## Notes

### Blocked before writing code (2026-10-05)

- `src/test/smoke.test.tsx:16-19` ("resolves the @/ alias") renders `<App />` and asserts `toBeEmptyDOMElement()`. Once App renders providers + router + shell (this task's goal) that assertion must fail. The file is not in "Files to touch", so per the confirm-out-of-scope posture no code was written.
- Proposed fix (needs approval): keep the alias check but stop asserting emptiness, e.g. `render(<App />); expect(screen.getByRole('banner')).toHaveTextContent('Alumni Network');`, or import a non-component via the alias (`THEME_STORAGE_KEY` from `@/store/themeAtom`) and drop the App import.
- Design decision to confirm at the same time: `errorElement` on the `/` layout route replaces the whole AppShell, so a throwing child would render RouteError *outside* the shell. Architecture says RouteError is "in-shell". Plan: keep the root `errorElement` (catches shell crashes) and add a pathless child route `{ errorElement: <RouteError/>, children: [index, *] }` so child errors render inside `<main>`.
- react-router 8.4.0 verified: `createBrowserRouter`, `createMemoryRouter`, `RouterProvider`, `Outlet`, `Link`, `useRouteError`, `isRouteErrorResponse`, `RouteObject` all exported from `react-router`.

### Implementation notes (2026-10-05, after approval)

- User approved: smoke test option 2 (alias checked via `THEME_STORAGE_KEY`) and the two-layer error routes.
- `router.tsx` exports `createRoutes(pageRoutes?)`, `routes` and `createAppRouter(opts?)`; tests build a memory router from `createRoutes([{ path: 'boom', element: <Boom/> }])` for the throw case.
- `RouteError` uses inline `style` objects with token vars (`--text-heading-md`, `--accent`, `--text-label`) rather than a CSS module, to stay inside the named files. A `RouteError.module.css` would be cleaner if the ui-reviewer prefers it.
- `RouteError` heading is an `<h1>` (it is the only content of the page when shown); logs via `console.error` only when `import.meta.env.DEV`.
- Shell CSS: header hairline full width; inner row and `<main>` use `width: min(100%, 72rem)`; gutters `--space-4`, from 48rem `--space-5/--space-6`; header row wraps. Skip link is moved off-screen with `transform` and shows on focus. `<main>:focus` has no outline (focused only by the skip link, tabIndex -1).
- Brand text uses `--text-heading-sm`; it is a `<span>`, not a heading.
- Checks: lint, format:check, typecheck, build green; `npx vitest run` twice: 15 files / 131 tests passed both times.
- Manual dev check: started Vite on :5199, fetched `/` (200, title "Alumni Network", #root + main.tsx), `/src/app/App.tsx` and `AppShell.module.css` both 200 (compile OK), then stopped it. I cannot see the rendered page; visuals go to the ui-reviewer at /review.

## Related

- Architecture: [[specs/2026-10/m/REQ-001-frontend-foundation/architecture]]
- Lessons checked: none exist yet
