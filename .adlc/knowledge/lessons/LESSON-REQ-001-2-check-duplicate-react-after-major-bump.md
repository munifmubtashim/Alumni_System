# After a major React bump in a workspace, prove there is one React copy ^L-REQ-001-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-001-2 |
| Captured | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend, npm-workspaces |
| Tags | npm-workspaces, react, dependencies |
| Severity | trap |
| Supersedes | — |

## The lesson

After bumping React (or any shared runtime) in one workspace, run `npm ls react --all` filtered to bare `react@` lines (not `@base-ui/react@` etc.), and `npm dedupe` if a second hoisted copy remains.

## Saw it in

- `package-lock.json` — root `node_modules/react` stayed 18.3.1 after the frontend moved to 19.3; hoisted libs would have loaded React 18 (REQ-001 TASK-001)

---

## Related

- Originating REQ: [[REQ-001]]
- Components: [[knowledge/components/frontend]]
