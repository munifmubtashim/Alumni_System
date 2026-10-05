# REQ-001-frontend-foundation — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-05 |
| Work path | /Users/munifmubtashim/Alumni_System |
| Isolation | branch |
| Branch | feat/REQ-001-frontend-foundation |
| Files changed | 157 |
| Commits | 2 |
| Base | redesign (branch was cut from it; config default `main` would include unrelated commits) |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

- **Re-review round 3.** Every round-1 and round-2 code finding is resolved and confirmed by its reviewer. 196 tests pass across repeated runs; lint, format, typecheck, build and tokens:check pass. d2 is applied to CLAUDE.md exactly as approved.
- **Open:** 0 critical · 0 major · 1 minor (optional) · 2 trivial · plus a short doc list for /wrapup.
- **Browser run (main session, Claude in Chrome, production build).** Steps 1, 2, 4, 5 and 7 pass; step 6 passes down to about 354px. Not run: the live OS flip, the component design match, and the round-2 steps 9–11 (unit-tested). Details are in the round-2 notes in review-log.md.
- **ADRs:** no conflict. Packets: 193KB, then 110KB, then 115KB.

## Findings at a glance

**Resolved:** M1 · m1–m12 · d1 · d2 · d4 · n1 (34 import cases run against the real config) · n2 · n3 (repo docs) · round-2 trivial (motion test list).
**Accepted by you:** n4 (pill overflows below ~200 CSS px).

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| o1 | minor | Symlink test throws EPERM on Windows without developer mode; it should skip there (QUAL-010) | `scripts/generate-tokens.test.ts:122` | trivial | yes (optional) |
| o2 | trivial | `spawnSync` has no timeout (QUAL-011) | same file:123 | trivial | yes (optional) |
| o3 | trivial | `./**/app` also blocks a sibling folder named `app`/`store`/… inside a layer (over-blocks, no hole) (CORR-006) | `eslint.config.js` | — | count only |
| w1 | doc | For /wrapup: `tokens.json` usage strings (ink-muted "placeholder", border-subtle "inputs") · design README token table "border-strong: hover/focus" · CLAUDE.md frontend paragraph (line ~81) lists only 2 of the boundaries · vault stubs, index.md, conventions blanks (d3) | docs / vault | small | /wrapup |

Reviewed by: correctness · quality · architecture · reflector · ui (static tier). All balanced. Round 2 re-run by all five; round 3 by correctness, quality and reflector. Browser checks by the main session.

## Consolidated by severity

### Critical (0) · Major (0)

### Minor (1 open, optional)
o1. See QUAL-010 in review-log.md (round 3).

### Trivial (2 open + earlier counts)
o2, o3; plus the round-2 trivials (easing unchecked, `src/test/` without a boundary block, placeholder vs value judgement, smoke test order dependence, 28px toggle targets).

## Acceptance criteria check

- [✓] Clean slate: old src removed (62 deletions + 1 rewritten), antd/@ant-design gone, React 19.3
- [✓] typecheck · lint · format:check · test (131) · build — all exit 0 (implement phase + re-verified)
- [✓] Dev proxy: `/api/health` → `{"status":"OK"}` through Vite (TASK-001, TASK-010)
- [✓] Structure: app/ features/ components/ui/ store/ services/ styles/ test/, each with a README
- [✓] Path alias `@/` works in typecheck, build, tests, editor
- [✓] UI primitives make no API calls, and every documented boundary is now lint-enforced (M1 resolved)
- [✓] Every token available in both themes; generator plus drift test
- [✓] Automated raw-color check (ESLint + Stylelint) · [✓] no box-shadow
- [✓] Three-way toggle in header, persisted · [✓] System follows OS live (source + unit tests)
- [✓] No flash: browser-checked on the production build. The saved choice survives a reload against the OS setting, and the inline blocking script runs in `<head>` before the stylesheet
- [✓] Button / Input / Card / Tag / ThemeToggle match READMEs (static); each has RTL tests incl. keyboard
- [✓] Shell renders through React Router with no feature routes
- [✓] 360px / 200% zoom: browser-checked. No overflow at 715px or 354px CSS width, and the toggle wraps under the brand. Overflow only below about 200px (n4)
- [✓] TanStack Query provider wired · [✓] one HTTP client attaches the token once
- [✓] ADR-01 and ADR-02 recorded and accepted
- [⚠] Docs updated: frontend README, CLAUDE.md Commands/Frontend, conventions.md, architecture.md ✓. Root README fixed (d4); round-2 doc drift (n3); your conventions lines (d2)
