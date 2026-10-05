# Import-boundary lint must match the documented boundaries, with a fixture per boundary ^L-REQ-001-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-001-4 |
| Captured | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend, linting |
| Tags | eslint, architecture, import-boundaries |
| Severity | trap |
| Supersedes | — |

## The lesson

When docs say a layer boundary is lint-enforced, write one `no-restricted-imports` block per layer (flat config: the last matching block replaces earlier options), cover `@/x` and anchored relative forms (`./**/x`, `../**/x`, never `**/x`, which hits npm sub-paths), and add an enforcement-test fixture per boundary.

## Saw it in

- `packages/frontend/eslint.config.js` — `layerBan`/`layerBoundary` (REQ-001 review M1, n1)
- `packages/frontend/scripts/enforcement.test.ts` — one case per boundary, alias + relative + package sub-path

---

## Related

- Originating REQ: [[REQ-001]]
- Components: [[knowledge/components/frontend]]
