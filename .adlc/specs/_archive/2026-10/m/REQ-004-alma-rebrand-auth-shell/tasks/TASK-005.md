# TASK-005 — Docs: brand, config folder, new primitives

| Field | Value |
|---|---|
| REQ | REQ-004 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-001, TASK-002, TASK-003, TASK-004 |
| Blocks | — |

## Goal

The docs say "Alma" and describe `src/config/`, its import boundary, `Logo`, `PasswordInput` and the favicon exception.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/README.md` | edit — "The Alumni Network web app" → Alma; folder list gains `config/` |
| `CLAUDE.md` | edit — Frontend: Structure (`config/`), boundaries (config is a leaf), primitives (Logo, PasswordInput), `app/brand.ts` mention removed |
| `.adlc/context/conventions.md` | edit — Frontend folder purposes + Linting boundaries gain `config/`; favicon is the one design-asset hex exception |
| `packages/frontend/src/app/README.md`, `packages/frontend/src/features/README.md`, `packages/frontend/src/components/ui/README.md` | edit — mention `config/` imports / new primitives where those READMEs list rules (L-REQ-002-6) |

## Approach

- Edit in place, keep tone and density.
- Check every folder README for a boundary list and keep it consistent with `eslint.config.js`.

## Acceptance

- [ ] `grep -rn "Alumni Network" README.md CLAUDE.md packages/frontend` finds nothing (except design files under `docs/`)
- [ ] Boundary lists in CLAUDE.md, conventions.md and folder READMEs match `eslint.config.js`

## Related

- Architecture: [[specs/2026-10/m/REQ-004-alma-rebrand-auth-shell/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-002-6-docs-task-lists-every-folder-readme|L-REQ-002-6]], [[knowledge/lessons/LESSON-REQ-001-8-adr-changes-update-claude-conventions|L-REQ-001-8]]
