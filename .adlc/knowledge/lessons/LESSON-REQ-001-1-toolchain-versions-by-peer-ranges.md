# Pick toolchain majors by plugin peer ranges, not by "latest" ^L-REQ-001-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-001-1 |
| Captured | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend |
| Tags | toolchain, typescript, eslint, vitest |
| Severity | guideline |
| Supersedes | — |

## The lesson

Before choosing TypeScript / ESLint / test-runner majors, check the peer ranges of the plugins that must run on them (typescript-eslint, jsx-a11y) and the Node engine of jsdom; the newest major is often unsupported.

## Saw it in

- `packages/frontend/package.json` — TypeScript pinned `~6.0.3` (typescript-eslint 8.71 supports <6.1), ESLint 9 (jsx-a11y ≤9), jsdom 29 (jsdom 30 needs Node ≥24.15)
- TypeScript 6 also rejects `baseUrl` (TS5101); `paths` alone works — `packages/frontend/tsconfig.app.json`

---

## Related

- Originating REQ: [[REQ-001]]
- Components: [[knowledge/components/frontend]]
