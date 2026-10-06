# Concept — route layout: one root, two shells

| Field | Value |
|---|---|
| Status | current as of REQ-004 (2026-10-06) |
| Introduced in | [[REQ-004]] |
| Decision | [[architecture/adr-07-root-layout-and-headerless-auth\|ADR-07]] |

`packages/frontend/src/app/router.tsx` builds one tree:

```
/  RootLayout  (SessionBridge, useApplyTheme; outer errorElement)
 ├─ AuthShell  (<main>, compact ThemeToggle top-right)
 │   └─ (inner errorElement) → GuestOnly → /login, /register
 └─ AppShell   (skip link, S1 header: Logo, HeaderAuth, full ThemeToggle)
     └─ (inner errorElement) → RequireAuth → / ; * ; createRoutes(testPages)
```

- **Effects live in the root.** Anything that must run on every page (session/401 handling, theme) mounts in `RootLayout`, exactly once ([[knowledge/lessons/LESSON-REQ-004-1-app-wide-effects-in-root-layout|L-REQ-004-1]], ADR-03).
- **Two error layers per shell.** The root's `errorElement` catches a shell crash (no chrome); each shell's path-less inner route keeps its chrome and shows page errors inside `<main>` ([[knowledge/lessons/LESSON-REQ-001-7-route-errors-pathless-layout|L-REQ-001-7]]).
- **Tests:** `createRoutes(pageRoutes)` puts test pages under `AppShell`. To test "a guest sees the header", use an unknown path, not `/login` ([[knowledge/gotchas#^g19|G19]]).

## Related

[[knowledge/concepts/session-and-401]] · [[knowledge/components/frontend]]
