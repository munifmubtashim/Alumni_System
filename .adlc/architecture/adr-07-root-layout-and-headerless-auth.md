# ADR-07 — A root layout above two shells; auth pages without the app header ^ADR-07

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 |
| Author | munifmubtashim (drafted by Claude) |
| Supersedes | (none) — amends where ADR-03's `SessionBridge` is mounted |
| Superseded by | (none) |
| Based on | [[REQ-004]] · [[architecture/adr-03-frontend-session-and-401-handling\|ADR-03]] · [[knowledge/lessons/LESSON-REQ-001-7-route-errors-pathless-layout\|L-REQ-001-7]] |

## Context

The login and sign-up designs are full-page split layouts with no app header, only a small theme toggle. Until REQ-004 every page rendered inside `AppShell` (the header), and `AppShell` also mounted `SessionBridge` (expired-token drop, cache clear on token change, 401 → `/login` notice) and applied the theme. Moving auth pages out of `AppShell` would have unmounted those effects on exactly the pages that show the session notice.

## Considered options

### Option 1 — path-less `RootLayout` → `AuthShell` / `AppShell`
`RootLayout` mounts app-wide effects once (`SessionBridge`, `useApplyTheme`) and holds the outer error layer. `AuthShell` (main + compact theme toggle) wraps the `GuestOnly` pages; `AppShell` (header) wraps `RequireAuth`, `*` and test pages. Each shell has its own inner error layer.
**Pros:** matches the designs; effects survive moving between shells; no remounts on login → home. **Cons:** two shells to keep consistent (theme toggle wiring is duplicated).

### Option 2 — keep one shell, hide the header on auth routes
**Pros:** no router change. **Cons:** route-name checks inside the shell; the header's landmarks and skip link still render; doesn't match the designs.

### Option 3 — auth pages outside the router's layout entirely
**Pros:** simplest markup. **Cons:** `SessionBridge` would need a second mount; breaks ADR-03's "mounted once".

## Decision

**We chose Option 1.**

## Consequences

- Rule: app-wide effects go in `RootLayout`, never in one shell ([[knowledge/lessons/LESSON-REQ-004-1-app-wide-effects-in-root-layout|L-REQ-004-1]]).
- Auth pages have no `banner` landmark and no skip link; their theme toggle is the compact icon variant.
- New page groups pick a shell; a third shell is a new decision.
- See [[knowledge/concepts/route-layout]].

## Related

- [[REQ-004]] · [[architecture/adr-03-frontend-session-and-401-handling|ADR-03]] (amended) · [[knowledge/concepts/session-and-401]]
