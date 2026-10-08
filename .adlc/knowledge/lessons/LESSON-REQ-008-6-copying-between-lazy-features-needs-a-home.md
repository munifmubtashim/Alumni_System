# Helpers copied between lazy features need a decided shared home and a tracked follow-up, not a code comment ^L-REQ-008-6

| Field | Value |
|---|---|
| ID | LESSON-REQ-008-6 |
| Captured | 2026-10-07 |
| REQ | REQ-008 |
| Component | frontend |
| Tags | frontend, lazy-routes, duplication, tests |
| Severity | guideline |

## The lesson

Because lazy features may not import each other, each copied the same small things: `present()` (trim or undefined), the error-plus-Retry block and its CSS, and the fake-login test helper (now in 8 test files, with its follow-up named only in a comment). Decide where pure helpers shared by lazy features live (`config/` per its README, or a new folder) and give the test helper a tracked task, before the third feature copies them again. Extract the UI block once a third page repeats it.

## Saw it in

- `features/profile/format.ts`, `features/directory/AlumniCard.tsx`, `ProfilePage.test.tsx`, `RecentPosts.module.css` — [[REQ-008]] (CAND-020, CAND-021, CAND-022, CAND-025; review findings QUAL-001..003, REFL-003)

- Related: [[knowledge/gotchas#^g26|G26]] · [[architecture/adr-08-route-code-splitting-and-url-list-state|ADR-08]]


## Saw it again

- [[REQ-015]]: `serverMessage` reached five copies and `present` three before review moved them to `services/httpErrors.ts` and `config/text.ts`; cache-key roots went to `config/queryKeys.ts`. `focusIsLost`, the toast hook and `useDebouncedCallback` are still copied (follow-up: a shared hooks folder).
