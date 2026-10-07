# REQ-011-profile-headline-location-mentorship — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| Work path | /Users/munifmubtashim/Alumni_System |
| Isolation | branch |
| Branch | feat/REQ-011-profile-headline-location-mentorship |
| Files changed | 51 (+ this REQ's vault records) |
| Commits | 11 (base: `redesign`; config says `main`, but this REQ was cut from `redesign`) |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

Round 2 (fix round). Round-1 packet 153KB; round-2 packet 40KB. **0 critical · 1 major · 3 minor open · 1 trivial open** (was 0 / 1 / 9 / 1). Seven actionable findings were fixed and re-reviewed by quality, architecture and ui (all resolved, nothing new); the correctness and reflector sections were not re-run (no code of theirs changed). Fixes are in the working tree, uncommitted until this gate clears. Tests after fixes: 474 backend, 1299 frontend; typecheck, lint, format clean.
- All four still-open items need your decision, none is a code defect: REFL-001 (vault, ADR-04), REFL-002 (README word), CORR-001 (Start year hidden at 200% zoom), ARCH-002 (looser shared types, accepted in architecture.md).
- No `adr-conflict`. Two `vault-stale` findings (REFL-001, REFL-002) are routed to `/wrapup`.
- UI reviewer ran static-only; main-session screenshots are in `ui-evidence/differences.md`; browser-only checklist at the end of `review-log.md`.

Reviewed by: correctness (balanced) · quality (balanced, r2) · architecture (balanced, r2) · reflector (balanced) · ui (balanced, static-only, r2)

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| REFL-001 | major | ADR-04 says "up to 12 fields"; no REQ-011 outcome recorded | architecture/adr-04 | small | your call (vault, at /wrapup) |
| CORR-001 | minor | Start year hidden below 48rem also at 200% desktop zoom | features/me/Section.module.css `.wideOnly` | small | your call (design vs reflow) |
| ARCH-002 | minor | Shared types looser than the API (optional flag; `start_year` number vs string) | alumni.types.ts | medium | your call (accepted; follow-up REQ) |
| REFL-002 | minor | `features/README.md` omits My Profile from Home's links (REQ-010's miss) | features/README.md:9 | small | your call (/wrapup docs pass) |
| UI-003 | trivial | After widening the window, a stale "wider screen" alert text remains until next Save/Discard | ProfileForm.tsx | small | accept |
| UI-001, UI-002, ARCH-001, ARCH-003, QUAL-001, QUAL-002, QUAL-003 | — | resolved, round 2 | — | — | — |

## Consolidated by severity

### Major (1)
- **REFL-001** (reflector, vault-stale): ADR-04 says My Profile has "up to 12 fields"; ~17 controls now; add a Consequences row "REQ-011 stayed with controlled state". Decided at `/wrapup` step 3 (LESSON-REQ-010-4).

### Minor (3 open)
- **CORR-001** (correctness): `.wideOnly` hides Start year under 48rem CSS px, so a 1280px window at 200% zoom (640px) loses the input. The spec chose desktop-only to match S5 phone; the project also requires no breakage at 200% zoom. Options: keep as designed (documented), or show Start year at every width (differs from S5 phone).
- **ARCH-002** (architecture): optional `mentorship_available` forces `=== true` in three places; `start_year` is a number on `Alumni`, a string on `MyProfile`. Accepted in architecture.md; follow-up.
- **REFL-002** (reflector, vault-stale): one-word README fix, not this REQ's doing.

### Trivial (1 open)
- **UI-003** (ui): stale hint text in the form alert after widening the window.

### Resolved in round 2
UI-001 · UI-002 · ARCH-001 · ARCH-003 · QUAL-001 · QUAL-002 · QUAL-003 (all re-reviewed, no new findings).

## Acceptance criteria check

- [✓] AC1 migration — real DB run twice on a scratch DB and on dev DB; types/defaults checked
- [✓] AC2 fields returned (alumni/:id, list, /me); `mentorship_available` never null (COALESCE); route tests
- [✓] AC3 text validation and limits (120/100/100), trim, NUL, cleared when empty
- [✓] AC4 start year rule and order rule
- [✓] AC5 boolean rule, omitted = false
- [✓] AC6 owner-only: other user 403, admin 403, guest 401, row unchanged (route tests)
- [✓] AC7 shared types
- [✓] AC8 My Profile fields + Mentorship card (⚠ see CORR-001 for Start year at zoom)
- [✓] AC9 validation, dirty state, payload, refresh via `['alumni']` invalidation
- [✓] AC10 switch: native button, role switch, label + description (not tried with a real screen reader)
- [✓] AC11 profile header/education, hide when empty
- [✓] AC12 Mentor tag
- [✓] AC13 backend tests — 474 pass
- [✓] AC14 frontend tests — 1296 pass
- [⚠] AC15 side-by-side done for all three pages (see `ui-evidence/differences.md`); screenshots viewed, not saved as image files; S5 desktop dark not separately checked; 6 listed differences left
