# Guard Jotai storage atoms against throwing storage; test reload with resetModules ^L-REQ-001-9

| Field | Value |
|---|---|
| ID | LESSON-REQ-001-9 |
| Captured | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend, state |
| Tags | jotai, state, testing |
| Severity | trap |
| Supersedes | — |

## The lesson

With `atomWithStorage(..., { getOnInit: true })` the storage read happens at import: wrap getItem/setItem/subscribe in try/catch (private mode throws), and test "reload reads it back" with `vi.resetModules()` + re-import, not a fresh `createStore()`.

## Saw it in

- `packages/frontend/src/store/themeAtom.ts:22`, `src/store/themeAtom.test.ts:10`

---

## Related

- Originating REQ: [[REQ-001]]
- Components: [[knowledge/components/frontend]]
