# REQ-012-account-settings-nav-labels — Verification (task, round 1)

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| Branch | feat/REQ-012-account-settings-nav-labels (base `redesign`) |
| Files changed | 20 (+102/−79), uncommitted until the gate clears |
| Packet | 81KB |

Narratives: `review-log.md`.

## Summary

Reviewed by: correctness (balanced) · reflector (balanced) · ui (balanced, static-only). **0 critical · 0 major · 1 minor · 3 trivial.** Tests after the change: 1217 frontend pass; typecheck, lint, format clean. Backend untouched.

## Findings at a glance

| ID | Severity | Finding | Where | Fix |
|----|----------|---------|-------|-----|
| C-1 | minor (merge hazard) | `HIDDEN_FIELD_HINT` on REQ-011's branch still says "Open My Profile on a wider screen…"; REQ-011 also edits the same lines in ProfileForm/MePage tests, me/README, HomePage(+test) | REQ-011 branch | handled at merge (checklist item) |
| UI-001 | minor | Voice-control "click Account" could match the "Account" tab and the "Account menu" button | BottomTabs | accepted (optional `aria-label="Account settings"` on the tab) |
| REFL-001 | trivial | `components/frontend.md` status row and REQ-007 row stale | vault | fixed at wrapup |
| REFL-002 | trivial | design deviation recorded only in READMEs | vault | fixed: `concepts/route-layout.md` |
| UI-002 / C-2,C-3 | trivial | /me is two clicks on desktop; no header element is `aria-current` at /me; tab "Account" vs page "Account settings" | — | intended / accepted |

## Acceptance criteria check

- [✓] AC1 header nav lists Directory and Feed only (new test: no /me link, nothing current at /me)
- [✓] AC2 avatar menu, page heading and tab title, Home card read "Account settings" and link to /me; phone tab "Account" links to /me and is marked current; no visible "My Profile" left (grep of `src`: none)
- [✓] AC3 tests updated and pass; docs corrected (CLAUDE.md, READMEs, component page, route-layout concept)
