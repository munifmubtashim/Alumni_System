# TASK-006 — Theme state: persisted preference atom, live apply hook, no-flash script

| Field | Value |
|---|---|
| REQ | REQ-001 |
| Tier | 3 |
| Status | complete |
| Repo | alumni-system |
| Depends on | TASK-004 |
| Blocks | TASK-009 |

## Goal

The light/dark/system preference persists across reloads, System follows the OS live, and a saved Dark choice is applied before first paint.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/store/themeAtom.ts` (+ `.test.ts`) | create |
| `packages/frontend/src/features/theme/useApplyTheme.ts` (+ `.test.tsx`) | create |
| `packages/frontend/src/features/theme/index.ts` | create |
| `packages/frontend/index.html` | edit — `<html lang="en">`, title "Alumni Network", inline theme script in `<head>` |

## Approach

- `themeAtom.ts`: `export type ThemePreference = 'light' | 'dark' | 'system'`; `export const THEME_STORAGE_KEY = 'alumni.theme'`; `themePreferenceAtom = atomWithStorage<ThemePreference>(KEY, 'system', storage, { getOnInit: true })` where `storage` is `createJSONStorage(() => localStorage)` wrapped so an unknown/garbled value reads back as `'system'`.
- `useApplyTheme()`: reads the atom; computes resolved theme (`system` → `matchMedia('(prefers-color-scheme: dark)').matches`); `useEffect` sets `document.documentElement.dataset.theme`; while preference is `system`, subscribes to the media query's `change` event and unsubscribes on change/unmount.
- `index.html` inline script (no module, no imports, runs synchronously): `try { var p = JSON.parse(localStorage.getItem('alumni.theme')); var d = p === 'dark' || ((p !== 'light') && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = d ? 'dark' : 'light'; } catch (e) { }` — comment pointing at `THEME_STORAGE_KEY`. It must contain no hex/rgb literals.
- Test asserting `index.html` text contains `'alumni.theme'` equal to `THEME_STORAGE_KEY` (read file in a node-env test).

## Acceptance

- [x] Default preference is `system`; setting `dark` writes `"dark"` to `localStorage['alumni.theme']`; a fresh store reads it back.
- [x] Garbage in storage → `system`.
- [x] Hook: `light`/`dark` set `data-theme` accordingly; in `system`, toggling the stubbed media query flips `data-theme` without re-render from the test; switching away from `system` removes the listener (spy).
- [x] Key-sync test passes.
- [x] `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` pass.

## Notes

Browser-level "no flash" is verified by the ui-reviewer at `/review`; unit tests can't observe paint.

Implementation notes (2026-10-05):
- Storage wrapper is hand-written instead of Jotai's `unstable_withStorageValidator` (unstable API). It validates in getItem and in the cross-tab `subscribe` callback, and swallows storage exceptions. Reason: `createJSONStorage` calls the getter without try/catch, and `getOnInit` runs that read at module import, so a throwing localStorage would crash before render.
- `getOnInit` reads storage once per module load, not per store. Tests model a reload with `vi.resetModules()` + dynamic import.
- Key-sync test lives in `src/store/themeAtom.test.ts` (jsdom), not scripts/: it imports `index.html?raw` (typed by `vite/client`), so no node:fs. It goes further than a string match: it injects the inline script into jsdom for 5 stored/OS combinations and checks `data-theme`. jsdom runs injected scripts in its inner global, which lacks the setup matchMedia stub; the test bridges it through a property on `document`.
- Listener-removal test wraps add/removeEventListener on the stub list by hand (vi.spyOn on the methods tripped `@typescript-eslint/unbound-method` in expectations).
- Inline script follows the Approach text exactly (Prettier re-wrapped one line). Garbled storage makes it throw, so it sets nothing and React applies `system` on mount (a possible one-frame flash, only for garbage values).
- `useApplyTheme` returns void; it is not yet called anywhere (AppShell wiring is TASK-009).
- Checks: lint, format:check, test (126 passed), typecheck, build all green; built dist/index.html keeps the inline script.

## Related

- Architecture: [[specs/2026-10/m/REQ-001-frontend-foundation/architecture]]
- Lessons checked: none exist yet
