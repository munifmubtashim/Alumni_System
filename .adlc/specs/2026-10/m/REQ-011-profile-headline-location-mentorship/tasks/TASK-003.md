# TASK-003 — Switch primitive

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 0 |
| Status | done |
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

- [x] Space toggles, role switch, aria-checked, label and description read
- [x] Contrast pairs for on/off track, thumb and focus ring tested in light and dark
- [x] lint, typecheck, tests pass

## Notes

No imports from services, store, features, config, app.

Implementation (2026-10-07):
- `Switch.Root` is rendered with `nativeButton render={<button type="button" />}`. Without it, Base UI renders a span and puts `id` on the hidden checkbox, so `<label htmlFor>` would point at an aria-hidden input. With it, `id`, `role="switch"`, `aria-checked` and `aria-describedby` sit on one focusable button; clicking the label toggles it. The hidden checkbox is still rendered (position fixed, out of flow).
- Sizes follow S5 (40x22px track, 16px thumb, 3px inset) in rem. Colours: on = `accent` track + `accent-ink` thumb (the design's pair, via tokens); off (not in the design) = `ink-muted` track + `surface-raised` thumb. Ratios: ink-muted on surface-raised 3.31 light / 3.74 dark; on surface-page 3.10 / 4.16; accent on surface-raised 5.35 / 5.57; accent-ink on accent 5.07 / 6.19. Focus ring = 2px accent outline, offset 2px. Disabled uses border-strong track and ink-muted text (exempt from contrast).
- Label is body-sm size at label weight (design 14px/500); help text is caption size at 400 (design 12px).
- No `className` prop: the task's prop list did not include one; TASK-006 can wrap the field if it needs layout.
- Checks: `npm test` 87 files / 1245 tests pass; typecheck, lint (ESLint + Stylelint) and format:check clean.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
