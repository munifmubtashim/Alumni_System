# When a new feature needs a card or test helper another feature already has, move it to a shared eager home first; do not copy it ^L-REQ-016-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-016-4 |
| Captured | 2026-10-08 |
| REQ | REQ-016 |
| Component | frontend |
| Tags | frontend, duplication, shared-components, tests |
| Severity | guideline |

## The lesson

The new people card copied Home's section shell (card, loading, error plus Retry, empty) and its CSS, and its test re-declared the fake-API helpers: a third copy in each case, caught at review (QUAL-001, QUAL-003). The shell now lives in `features/people` (eager, shared by Home and the lazy Feed) and the helpers in `src/test/fakeApi.tsx`. A shared fake API should also have a strict mode that rejects unlisted URLs, or a wrong URL becomes a timeout. The feed and admin test kits still carry their own copies.

## Saw it in

- `features/people/SectionCard.tsx`, `src/test/fakeApi.tsx` — [[REQ-016]]

- Related: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home|L-REQ-008-6]]
