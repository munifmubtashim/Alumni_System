# REQ-002-auth-login-register — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-05 |
| Work path | /Users/munifmubtashim/Alumni_System |
| Isolation | branch |
| Branch | feat/REQ-002-auth-login-register |
| Files changed | 74 (excl. REQ work records) |
| Commits | 2 |
| Base | redesign |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

- **Counts:** 0 critical · 0 major · 12 minor (m1–m4 resolved in round 2; 8 open) · 3 trivial. Open: 5 actionable minor (m5–m9, deferred), 3 your call (m10–m12), 3 trivial.
- **Round 2:** user chose fix m1–m4. Correctness + ui re-ran: all resolved, no new problems except trivial t3 (CORR-004). 403 tests pass. Round-2 packet 129KB (first sent with an empty diff block by a shell bug; both reviewers read the diff from git, verdicts unaffected). Second test account left: `ui-review-r2-1791217487280@example.test`.
- **Patterns:** session edge cases outside the spec's happy paths (blocked storage, mid-session expiry, logout return page — m1–m3); form plumbing and role labels repeated across pages (m7, m8); docs and vault behind the code (m5, m10, m11).
- **ADR conflicts:** none. ARCH-001 (validation copied from backend) is accepted by ADR-04; a shared-limits follow-up is your call.
- **Vault-stale:** 2 (REFL-001 ADR-03 status in `decisions.md`; REFL-002 `knowledge/components/frontend.md`) — handled at `/wrapup` step 3, not as code fixes. Reflector's `now.md` line-15 note is a false alarm (template example inside a comment).
- **UI reviewer:** ran headless (Brave via CDP) at 1280/640/360/320 px, light + dark; 1 minor, 1 trivial; every UI criterion exercised; no manual checklist left. 30 screenshots in `ui-evidence/`. Left test account `ui-review-1791216146823@example.test` in local Postgres.
- **Packet:** 276KB (over the 250KB ceiling; docs at 5-line context, `.adlc/specs/**` excluded). No reviewer reported a packet gap.

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| m1 | minor | CORR-001 — resolved, round 2 | | | |
| m2 | minor | CORR-002 — resolved, round 2 | | | |
| m3 | minor | CORR-003 — not reproduced; guard test added, round 2 | | | |
| m4 | minor | UI-001 — resolved, round 2 | | | |
| m5 | minor | `services/` and `store/` READMEs omit authApi, 401 hook, token subscribe, sessionNoticeAtom (QUAL-001, ARCH-002) | services/README.md, store/README.md | small | yes |
| m6 | minor | `ButtonLink` has no test of its own (QUAL-002) | ui/Button/ButtonLink.tsx | small | yes |
| m7 | minor | Three separate role-to-text maps (QUAL-003) | RegisterPage.tsx:21; HeaderAuth.tsx:7; HomePage.tsx | small | yes |
| m8 | minor | Submit/validate/focus plumbing repeated in Login and Register pages (QUAL-004) | LoginPage.tsx:39-77; RegisterPage.tsx:67-113 | medium | yes |
| m9 | minor | `features/auth/index.ts` exports internals; pulls pages into the shell import (QUAL-005, ARCH-003) | auth/index.ts:1-24 | small | yes |
| m10 | minor | Validation rules hand-copied from backend; no shared source (ARCH-001) | auth/validation.ts | medium | your call |
| m11 | minor | `decisions.md` lists ADR-03 as proposed (REFL-001, vault-stale) | .adlc/decisions.md:9 | small | your call |
| m12 | minor | `knowledge/components/frontend.md` predates auth; no session concept page (REFL-002, vault-stale) | .adlc/knowledge/components/frontend.md | small | your call |
| t1 | trivial | authToken header cites only ADR-02; `AuthResponse` type unused (QUAL-006) | authToken.ts:1; user.types.ts:36 | small | yes |
| t3 | trivial | Late-firing expiry timer (background tab) stores from=/login, so re-login lands on home, not the old page (CORR-004, round 2) | auth/SessionBridge.tsx | small | yes |
| t2 | trivial | Header wraps to three rows at 320 px, nothing clipped (UI-002) | app/AppShell | small | yes |

Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced) · ui (balanced, headless). Architecture report arrived without a `Written by` line.

## Consolidated by severity

### Critical (0)

### Major (0)

### Minor (12 — 4 resolved, 8 open)

#### Resolved in round 2 (m1–m4)
m1, m2, m4 fixed and verified by correctness (code + 162 tests) and ui (headless browser, 15 screenshots in `ui-evidence/round-2/`); m3 not reproduced, guard test kept. Detail in `review-log.md` → "Round 2 re-review".

#### Docs (m5) — services/README.md, store/README.md
- **Source:** quality, architecture
- **Recommendation:** list `authApi`, `setUnauthorizedHandler`, `subscribe`/`getLiveToken`, `sessionNoticeAtom`.

#### Tidy-ups (m6–m9)
- **Source:** quality (m9 also architecture)
- **Recommendation:** m6 add `ButtonLink.test.tsx`; m7 one role-label map in `features/auth` used by all three; m8 extract a small `useSubmitWithFocus` helper; m9 export only pages, guards, hooks and `SessionBridge` from the barrel.

#### Needs your call (m10–m12)
- m10 — ADR-04 accepts mirroring; options: export limits from `@alumni/shared` now, or log a follow-up.
- m11, m12 — vault edits, made at `/wrapup` step 3.

### Trivial (3)
t1, t2, t3 — see digest; full text in `review-log.md`.

## Acceptance criteria check

- [✓] /login fields, button, link to sign-up — UI verified
- [✓] Valid login stores token, lands on home or original route — verified for `/` (the only protected route)
- [✓] 401 → "Email or password is incorrect", email kept, password cleared — UI verified (focus issue: m4)
- [✓] Network/5xx → "Couldn't reach the server, try again", form usable — UI verified
- [✓] Busy button, no double submit — one request per page verified
- [✓] Login field-level validation — UI + tests
- [✓] /register role first, only required fields; Student/Alumni sets — UI verified
- [✓] Client checks mirror backend rules — tests (drift risk: m10)
- [✓] 201 stores token, lands on home — "Welcome, Amina Test" verified
- [✓] 409 → email field message + link to login — UI verified
- [✓] Other 400 shown on form — UI verified
- [✓] Register busy/double-submit guard — verified
- [✓] Reload keeps session — UI verified
- [✓] Current user via `GET /api/me` through TanStack Query; no API calls in UI components — architecture + correctness
- [✓] Logout clears token and cached data, goes to /login — verified (return-page risk: m3)
- [✓] Signed-in 401 → logout + "Your session has expired…"; login 401 excluded — UI + correctness
- [✓] Expired token on load treated as signed out — UI verified (mid-session expiry: m2)
- [✓] Reusable guard protects home — guards.tsx
- [✓] Guest → /login → back to route — verified for `/`
- [✓] Signed-in user on /login or /register → home — UI verified
- [✓] Header: guest links; user menu with name + Log out, keyboard-operable — UI verified
- [✓] Home greets by name and role, "more coming" line — UI verified
- [✓] Primitives and tokens only, light and dark — stylelint + UI
- [✓] Visible labels, announced errors, focus to first invalid field — UI verified
- [✓] Works from 360px; no break at 200% zoom — checked at 640/360/320 px (t2 at 320)
- [✓] Unit and component tests cover the listed cases — 394 tests pass
