# Vitest 5 Node-side tests: per-file environment comment, DOM-safe setup, and live in scripts/ ^L-REQ-001-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-001-3 |
| Captured | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend, testing |
| Tags | vitest, testing, typescript |
| Severity | guideline |
| Supersedes | — |

## The lesson

In Vitest 5 put Node-only tests in `packages/frontend/scripts/` with `// @vitest-environment node` (no `environmentMatchGlobs`), keep `src/test/setup.ts` safe without a DOM, and read CSS from disk (CSS imports, even `?raw`, are stubbed to '').

## Saw it in

- `packages/frontend/scripts/generate-tokens.test.ts:1`, `scripts/enforcement.test.ts`
- `packages/frontend/src/test/setup.ts` — guards on `typeof window`; `src/` is typechecked without Node types

---

## Related

- Originating REQ: [[REQ-001]]
- Components: [[knowledge/components/frontend]]
