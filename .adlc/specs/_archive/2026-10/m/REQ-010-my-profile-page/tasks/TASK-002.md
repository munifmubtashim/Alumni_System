# TASK-002 — Textarea and Toast primitives

| Field | Value |
|---|---|
| REQ | REQ-010 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | none |
| Blocks | TASK-004 |

## Goal

Two token-only UI primitives exist with tests and README entries.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/components/ui/Textarea/{Textarea.tsx,Textarea.module.css,Textarea.test.tsx,index.ts}` | create |
| `packages/frontend/src/components/ui/Toast/{Toast.tsx,Toast.module.css,Toast.test.tsx,index.ts}` | create |
| `packages/frontend/src/components/ui/README.md` | edit |

## Approach

- Textarea: same props contract as Input (label, helperText, error, aria wiring), native textarea props, `rows` default 4, resize vertical, styles from tokens only.
- Toast: props `children`, `onDismiss`, `dismissLabel`; `role="status"`; check icon decorative; fixed top-right on desktop, inset full width on phone; enter animation using `duration-*`/`easing-standard` tokens and honouring `prefers-reduced-motion`; surface `ink-primary`, text `surface-page`. No timer inside (caller owns it).
- Check the contrast of that pair in both themes (G33, LESSON-REQ-004-2). If it fails, add `surface-inverse` to `docs/design/design-system/tokens.json`, run `npm run tokens`, and say so in the task report.

## Acceptance

- [x] Both render in light and dark with tokens only (Stylelint passes)
- [x] Textarea label/error/helper wiring tested like Input's
- [x] Toast has status role, dismiss button works, no inline styles
- [x] ui README lists both; boundary rules still pass

## Notes

Primitives may not import services, store, features, config, app. No new dependency.

Implementation (2026-10-07):
- Contrast (G33): surface-page on ink-primary is 13.9:1 light, 14.7:1 dark, so no `surface-inverse` token was added and `tokens.json` is untouched. It is the same ratio as the existing `ink-primary` on `surface-page` pair in `contrast.test.ts`, so that test already guards it.
- Toast: the outer div is positioned; only the `<p role="status">` holds the message, so the dismiss button's name is not part of the announcement. The dismiss button is 2.75rem square, and its focus ring uses currentcolor because the accent ring is too faint on ink-primary.
- Expected differences from S5 (for TASK-007): no shadow (box-shadow is banned by Stylelint), check in currentcolor instead of S5's green, radius-lg (14px) instead of 10px, enter animation 150ms (`duration-fast`, the only duration token) instead of 250ms, text `surface-page` instead of S5's `#fdf8f3`, and a dismiss button that S5 does not have. z-index 20 sits above the header (2) and menus/popovers (10).
- Textarea: Input's CSS is duplicated. It uses the body line height (26px) rather than Input's 22px, and has no end adornment.
- `npm run format:check` fails only on `src/services/authApi.test.ts` (TASK-001's file, being edited at the same time); all files from this task pass Prettier.

## Related

- Architecture: [[specs/2026-10/m/REQ-010-my-profile-page/architecture]]
- Lessons checked: [[LESSON-REQ-006-3-client-copies-of-api-limits]], [[LESSON-REQ-002-3-must-succeed-steps-inside-mutationfn]], [[LESSON-REQ-009-4-adding-a-lazy-feature-touches-six-lists]], [[LESSON-REQ-007-1-sticky-bottom-bar-needs-scroll-padding]], [[LESSON-REQ-004-2-check-design-colours-against-token-pairs]]
