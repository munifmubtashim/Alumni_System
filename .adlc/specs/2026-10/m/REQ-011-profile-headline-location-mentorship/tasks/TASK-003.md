# TASK-003 — Switch primitive

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-006 |

## Goal

A tokens-only `Switch` in `components/ui` with label and help text, operable by keyboard (AC10).

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/components/ui/Switch/Switch.tsx`, `Switch.module.css`, `Switch.test.tsx`, `index.ts` | create |
| `packages/frontend/src/components/ui/README.md` | edit (list) |
| `packages/frontend/src/**/contrast.test.ts` | edit (add the switch colour pairs) |

## Approach

- Wrap `@base-ui/react` Switch (see Radio/SegmentedControl for import style; gotcha G05, G17 style traps).
- Props: `checked`, `onCheckedChange`, `label`, `description?`, `disabled?`, `id?`. Label and description are associated (`aria-describedby`).
- Match the S5 Mentorship card look (open S5 desktop and phone). Tokens only; Stylelint/ESLint enforce.

## Acceptance

- [ ] Space toggles, role switch, aria-checked, label and description read
- [ ] Contrast pairs for on/off track, thumb and focus ring tested in light and dark
- [ ] lint, typecheck, tests pass

## Notes

No imports from services, store, features, config, app.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
