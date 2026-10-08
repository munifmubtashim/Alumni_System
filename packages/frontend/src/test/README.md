# test/

**Purpose:** shared test harness for Vitest + React Testing Library: `setup.ts` (jest-dom matchers, `matchMedia` stub, storage reset), `fakeApi.tsx` (a fake API at the axios adapter routed by URL, `ok`/`fail`/`never` responders, `requests`, `resetApi`, and `renderWithProviders` with a no-retry query client and a router; REQ-016) and harness smoke tests. Tests for a module live next to that module, not here. New tests use `fakeApi.tsx` rather than another copy (the feed and admin kits predate it).

**May import:** test libraries (`vitest`, `@testing-library/*`) and anything in `src/` that a harness check needs.

**Imported by:** Vitest (`setup.ts` via `setupFiles`) and test files or feature test kits (`fakeApi.tsx`). Production code must never import from `test/`.
