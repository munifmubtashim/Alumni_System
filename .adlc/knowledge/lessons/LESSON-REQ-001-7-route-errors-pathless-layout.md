# Put page-level errorElement on a path-less child route, and build routes from a factory ^L-REQ-001-7

| Field | Value |
|---|---|
| ID | LESSON-REQ-001-7 |
| Captured | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend, routing |
| Tags | react-router, routing, error-handling |
| Severity | guideline |
| Supersedes | — |

## The lesson

A React Router `errorElement` on the layout route replaces the whole layout (header gone); put a second `errorElement` on a path-less child route for page errors, and export `createRoutes(pageRoutes)` so tests can inject a throwing page into the real tree.

## Saw it in

- `packages/frontend/src/app/router.tsx` — two error layers (REQ-001 TASK-009)
- `packages/frontend/src/app/AppShell/AppShell.test.tsx` — outer and inner layer tests

---

## Related

- Originating REQ: [[REQ-001]]
- Components: [[knowledge/components/frontend]]
