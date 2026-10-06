# An input that mirrors a URL param must track its own last write ^L-REQ-006-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-006-1 |
| Captured | 2026-10-06 |
| REQ | REQ-006 |
| Component | frontend |
| Tags | frontend, url-state, debounce, search |
| Severity | trap |

## The lesson

When a text box writes a URL param after a debounce and also re-syncs from the URL (Back, Clear all), schedule the write from the change handler with a cancellable timer, cancel it on any outside change of the param, and remember the value you last wrote so the re-sync skips it. Comparing text with the URL is not enough: a key typed between "write fired" and "URL rendered" is overwritten. Reproduce that race in one `act` (fire the timer, then `fireEvent.change`), since `userEvent` awaits between steps and hides it.

## Saw it in

- `features/directory/FilterBar.tsx` (the `SyncState` / `sent` value), `useDirectoryParams.ts` (writes through `useNavigate` on the last written search; `setSearchParams`' function form drops the first of two writes in one tick), `FilterBar.test.tsx` — [[REQ-006]]
- Found by a stress-test finding (ADV-001) and a review finding (CORR-001); the first fix (compare URL values, CAND-016) was not enough.
