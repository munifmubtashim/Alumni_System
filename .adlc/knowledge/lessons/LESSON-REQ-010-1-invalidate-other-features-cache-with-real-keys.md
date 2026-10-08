# When one feature changes data another feature caches, take the other feature's real query keys and test against a real cache ^L-REQ-010-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-010-1 |
| Captured | 2026-10-07 |
| REQ | REQ-010 |
| Component | frontend, tanstack-query |
| Tags | frontend, tanstack-query, cache, lazy-routes |
| Severity | trap |

## The lesson

A save that must refresh another lazy feature's queries has to use that feature's actual key root (grep its `constants.ts` or `queryKey` uses first; features cannot import each other, ADR-08), and its test must seed real queries with observers and assert they refetch, not spy on `invalidateQueries` with the same literal.

## Saw it in

- `features/me/useUpdateProfile.ts` invalidated `['posts']`; the feed lives under `['feed','posts']`, so feed cards kept the old name for 30 s. Three reviewers found it; the spy-only test passed with no effect (CORR-001, QUAL-001, ARCH-001).
- Fix and real-cache test: `features/me/useUpdateProfile.test.tsx`
