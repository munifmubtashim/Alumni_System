# TASK-002 — Directory URL params, hook and debounce

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system (worktree .worktrees/REQ-006-alumni-directory-page) |
| Depends on | — |
| Blocks | TASK-008, TASK-009 |

## Goal

The directory's `q`, `department`, `university`, `graduationYear` and `page` round-trip through the URL query string; invalid values are ignored.

## Files to touch

| Path | Action |
|---|---|
| `src/features/directory/params.ts` | create — pure `parseDirectoryParams`, `toSearchParams`, limits as named constants |
| `src/features/directory/useDirectoryParams.ts` | create — wraps `useSearchParams` |
| `src/features/directory/useDebouncedCallback.ts` | create |
| `src/features/directory/params.test.ts`, `useDirectoryParams.test.tsx`, `useDebouncedCallback.test.ts` | create |

## Approach

- Rules: trim text; drop empty; page integer 1..10000 else ignored (page 1); year 4 digits, 1900..current year + 10, else dropped; q ≤ 100, department ≤ 100, university ≤ 150 else dropped; repeated params use none of them. Never rewrite the URL on load.
- `setFilters(patch)` resets `page`; filter and page changes push history, `q` changes replace; `clearAll()` drops all five; `setPage(n)`.
- `useDebouncedCallback(fn, 300)` returning `{ run, cancel }`; unmount cancels (replaces a debounced-value hook, ADV-001). Reject text with control characters (NUL etc.) like the API (G23).

## Acceptance

- [x] Tests per architecture.md → Test strategy: invalid-value matrix, round trip, page reset, push vs replace, back/forward restores state, debounce with fake timers
- [x] `npm test`, `typecheck`, `lint` pass

## Related

- Architecture: [[specs/2026-10/m/REQ-006-alumni-directory-page/architecture]]
- Spec: AC AC5, AC7
- All paths below are under `packages/frontend/`. Tokens only (`var(--…)`), CSS Modules, no inline styles, no raw hex, imports per the boundary rules. Import `describe/it/expect/vi` from vitest.

## Notes

- **API for TASK-008/009.** `useDirectoryParams()` → `{ params, setFilters(patch), setQuery(q), setPage(n), clearAll() }`. `setFilters` patch may include `q`; a key set to `undefined` or blank text is cleared, a key left out stays. `setQuery` replaces history and resets page; the others push. A write that would not change the URL is skipped (no duplicate history entry). `params.ts` also exports `isValidGraduationYear` for FilterPopover's inline check, and the length limits as constants (`Q_MAX_LENGTH` for the box's `maxLength`).
- **Stale-params fix (ADV-001 "Also").** React Router's `setSearchParams(fn)` hands `fn` the render-time params, so the hook uses `useNavigate` and a ref of the last search it wrote (synced from the location in a layout effect). Two writes in one tick compose. FilterBar should still, on Apply while a search write is pending, `cancel()` it and pass the box text as `q` in the same `setFilters` patch (one push, nothing lost).
- **Control characters.** The API only rejects NUL (G23); the parser drops text with any C0 control character or DEL, a slightly wider rule, so the API never sees them.
- **Unknown params** (e.g. `pageSize`) are ignored on read and not carried over on the next write; the URL holds only the five keys.
- Checks: 51 new tests; full suite 606 passed; typecheck, lint, format:check clean.
