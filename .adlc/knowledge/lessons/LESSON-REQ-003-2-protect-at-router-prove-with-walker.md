# Protect at the router, and prove it with a test that walks the app ^L-REQ-003-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-003-2 |
| Captured | 2026-10-06 |
| REQ | REQ-003 |
| Component | backend |
| Tags | backend, auth, api, testing |
| Severity | guideline |

## The lesson

Put `router.use(authMiddleware)` as the first line of every non-public router, and keep a guard test that derives the route list from the Express app itself (never a hand list). It must also fail on any top-level `app.use(...)` it can't probe. A route added later is then protected by default, and a missing guard fails CI instead of shipping.

## Saw it in

- `packages/backend/src/api/routes/*Routes.ts` — `router.use(authMiddleware)` first
- `packages/backend/src/api/test/routeList.ts`, `routes/routeGuard.test.ts` — removing one `router.use` line failed 7 tests
- Before [[REQ-003]], 20 of 26 routes were public, including ones returning password hashes
