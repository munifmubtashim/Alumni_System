# TASK-008 — FilterBar

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Tier | 1 |
| Status | done |
| Repo | alumni-system (worktree .worktrees/REQ-006-alumni-directory-page) |
| Depends on | TASK-002, TASK-003, TASK-004 |
| Blocks | TASK-009 |

## Goal

Search box, filter chips, filter pill popovers and Clear all, wired to the URL params.

## Files to touch

| Path | Action |
|---|---|
| `src/features/directory/FilterBar.tsx` (+ css, test) | create |
| `src/features/directory/FilterPopover.tsx` (+ test) | create — one labeled input + Apply (a `<form>`, Enter submits); year field validates inline |

## Approach

- Props: parsed params and callbacks (`onQueryChange`, `onFilterChange`, `onClearAll`); the page owns the hook. Search text is local state, debounced 300 ms via `useDebouncedCallback`, and re-syncs when the URL `q` changes from outside.
- Chip text "Department: Computer Science", "Grad. year: 2017", "University: …"; remove button named "Remove Department: Computer Science". Inactive filters show as pill triggers; "Clear all" appears when anything is active.
- Focus (ADV-002): after Apply → the new chip's remove button; after removing a chip → that filter's pill trigger; after Clear all → the search box; Escape → the trigger. Popover is controlled so Apply closes it.
- The URL write is scheduled from the input's change handler via `useDebouncedCallback`; an external `q` change cancels the pending write and updates the box (ADV-001). `maxLength=100` on the box.
- Helper text for the text filters: exact name, capitals don't matter. No "Field" filter.

## Acceptance

- [ ] Tests: set each filter (click, type, Enter), remove a chip, Clear all, year validation (3 digits, letters, out of range) blocks Apply and shows the message, debounce, external `q` change updates the box, and Back / Clear all / Apply while a debounce is pending are not undone by the stale write; each focus rule above
- [ ] `lint`, `typecheck` pass

## Related

- Architecture: [[specs/2026-10/m/REQ-006-alumni-directory-page/architecture]]
- Spec: AC AC5, AC6, AC7, AC14
- All paths below are under `packages/frontend/`. Tokens only (`var(--…)`), CSS Modules, no inline styles, no raw hex, imports per the boundary rules. Import `describe/it/expect/vi` from vitest.

## Notes

- **Props.** `FilterBar({ params, onQueryChange, onFilterChange, onClearAll })`; for TASK-009 wire `setQuery`, `setFilters`, `clearAll` from `useDirectoryParams`. Exports `SEARCH_DEBOUNCE_MS = 300`.
- **ADV-001 mechanism.** `writeQuery.run(text, urlQ)` from the change handler; when the timer fires it writes only if the URL's `q` still equals the `q` at that keystroke. So any outside change (Back, Clear all, Apply) makes the pending write a no-op even without `cancel()`; Apply, chip removal and Clear all also call `cancel()`. The box re-syncs during render (stored previous `q` in state, not an effect) and keeps its text when its trimmed value already equals the URL `q`, so a trailing space survives our own write. Every filter change passes `q: text` in the same `setFilters` patch.
- **ADV-002 focus.** The chip/pill swap happens only after the async navigation renders, so a `pendingFocus` ref is consumed by an every-render effect once the target exists. One `useRef` per pill and per chip button (G10). FilterPopover passes `finalFocus={!applied}` so Base UI does not focus the soon-gone pill after Apply.
- **Validation.** Text filters: empty -> "Enter a department/university name."; a value the URL parser would drop (control characters) -> "Remove tabs and other special characters." Year: one message, "Enter a 4-digit year from 1900 to <now+10>." Panels start empty on each open.
- **Design mapping.** Search box max 30rem (480px); row gap 10px/8px -> space-2; "Clear all" a link-styled button (accent, text-label) 4px (space-1) after the last pill. Chip/pill looks come from TASK-003/004. Order: University, Department, Grad. year; "Field" left out.
- **Mutation-checked.** Removing the fire-time guard and the cancels fails the Back and Clear-all tests; dropping `q: text` fails the Apply test.
- Checks: 27 new tests (21 FilterBar, 6 FilterPopover); full suite 666 passed (includes TASK-007's concurrent tests); typecheck, lint, format:check clean on 2026-10-06.
