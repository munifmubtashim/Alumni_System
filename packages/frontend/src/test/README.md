# test/

**Purpose:** shared test harness for Vitest + React Testing Library: `setup.ts` (jest-dom matchers, `matchMedia` stub, storage reset) and harness smoke tests. Tests for a module live next to that module, not here.

**May import:** test libraries (`vitest`, `@testing-library/*`) and anything in `src/` that a harness check needs.

**Imported by:** Vitest only (via `setupFiles`). Production code must never import from `test/`.
