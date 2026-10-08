# TASK-008 — Docs + side-by-side S6 screenshot comparison and fixes

| Field | Value |
|---|---|
| REQ | REQ-015 |
| Tier | 5 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-007 |
| Blocks | — |

## Goal

Repo docs describe the admin page, endpoints, primitives and links; the running page is screenshotted next to every S6 file (desktop 1440 and phone 390, light and dark, drawer, dialog) and differences are fixed or recorded.

## Files to touch

| Path | Action |
|---|---|
| `CLAUDE.md (root)` | edit: Architecture → auth/admin routes, frontend structure, lazy routes (six), nav, primitives |
| `packages/frontend/README.md` | edit |
| `packages/frontend/src/app/README.md, features/README.md, services/README.md, config/README.md, components/ui/README.md` | edit |
| `packages/frontend/src/features/admin/**` | edit (visual fixes only) |
| `.adlc/specs/2026-10/m/REQ-015-admin-page/visual-check.md` | create (screenshot log: pairs compared, differences, fixed/recorded) |

## Approach

- Start API + Vite (root `npm run dev`; rebuild businessLogic dist first, G32), sign in as admin@alumni.test.
- Open each S6 file and the matching app state in the same browser at the same width; compare layout, spacing, type, colours; fix differences in features/admin CSS; record the rest as deliberate deviations (architecture list).
- Update docs per L-REQ-010-5 (every README list naming nav/menu items or lazy routes).

## Acceptance

- [ ] visual-check.md lists all 6 S6 files × the app state, each marked matches / fixed / deliberate deviation
- [ ] Docs updated; no stale "add Admin when built" comments remain
- [ ] All frontend and backend gates from architecture.md Test strategy pass

## Notes

Screenshots that would show real people's data use seed data only.

## Related

- Architecture: [[specs/2026-10/m/REQ-015-admin-page/architecture]]
- Lessons checked: L-REQ-004-2, L-REQ-010-5, L-REQ-012-2

### Docs part (implementer, 2026-10-08)

- Updated root CLAUDE.md (project section only), packages/frontend/README.md (new "Admin page" and "Primitives and tokens added in REQ-015" sections, guards, lazy routes, header, folder map), and the app, config, features, services READMEs. components/ui README already had Drawer, ConfirmDialog and Button danger (TASK-003); left as is.
- L-REQ-010-5: also added `admin` (and the missing `about`) to the "may not import" lines in features/feed, me and profile READMEs.
- Stale notes removed: app/README "add Admin there when built"; HomePage.tsx comment "add the admin card when that page is built" reworded (comment only). Home has no admin card; the spec does not ask for one, so docs now say Home lists pages every signed-in user may open.
- Also corrected services/README authApi list (was missing updateMyProfile, changePassword).
- Screenshot comparison and visual-check.md not done here (orchestrator does it).
- format:check clean; npm test 104 files / 1526 tests passed.
