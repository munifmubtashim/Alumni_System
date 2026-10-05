# TASK-002 — Form primitives: Input error, Button loading, ButtonLink, Alert

| Field | Value |
|---|---|
| REQ | REQ-002 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-004, TASK-005 |

## Goal

Forms can show per-field and form-level errors and a busy submit, and links can look like buttons, all on tokens with tests.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/components/ui/Input/Input.tsx` | edit |
| `packages/frontend/src/components/ui/Input/Input.module.css` | edit |
| `packages/frontend/src/components/ui/Input/Input.test.tsx` | edit |
| `packages/frontend/src/components/ui/Button/Button.tsx` | edit |
| `packages/frontend/src/components/ui/Button/ButtonLink.tsx` | create |
| `packages/frontend/src/components/ui/Button/Button.module.css` | edit |
| `packages/frontend/src/components/ui/Button/index.ts` | edit |
| `packages/frontend/src/components/ui/Button/Button.test.tsx` | edit |
| `packages/frontend/src/components/ui/Alert/{Alert.tsx,Alert.module.css,Alert.test.tsx,index.ts}` | create |
| `packages/frontend/src/styles/contrast.test.ts` | edit — error text pairs |
| `packages/frontend/src/components/ui/README.md` | edit — list new primitives |

## Approach

- Input `error?: string`: when set → `aria-invalid="true"`, error text rendered in an element with its own id appended to `aria-describedby` (keep helper text too), text colour `--error`, border `--error`; focus border still `--accent`.
- Button `loading?: boolean` → `disabled`, `aria-busy="true"`, keep the label, add a small `aria-hidden` dot that animates with `--duration-fast` (respect reduced motion). `ButtonLink` = same variants and CSS, renders react-router `Link` (`to` prop).
- Alert `{ tone: 'error' | 'info', children, title? }`: error → `role="alert"`, info → `role="status"`; `surface-sunken` fill, 1px border in tone colour (`--error` / `--accent`), tone dot, text `ink-primary`, `radius-md`, `space-3`/`space-4` padding. No box-shadow.
- Contrast test: add `error` on `surface-sunken`, `surface-raised` and `surface-page`, both themes, ≥4.5.

## Acceptance

- [x] Input: error text is the accessible description, aria-invalid set and cleared
- [x] Button: loading blocks click and Enter, sets aria-busy; ButtonLink renders an `<a>` with the right href inside a router
- [x] Alert: roles per tone; renders title and children
- [x] contrast.test passes with the new pairs; lint (incl. Stylelint), format:check, typecheck, test pass

## Related

- Architecture: [[specs/2026-10/m/REQ-002-auth-login-register/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-4]], [[knowledge/lessons/LESSON-REQ-001-5]], [[knowledge/lessons/LESSON-REQ-001-6]], [[knowledge/lessons/LESSON-REQ-001-7]], [[knowledge/lessons/LESSON-REQ-001-9]]; gotchas G05, G07

## Notes

- Input: error id is `<id>-error`; describedby order is caller, error, helper. An empty-string error counts as no error. A caller's own `aria-invalid` passes through when there is no error. The error text is not a live region; form-level announcements go through Alert.
- Button loading: the busy button takes the existing disabled look (ink-muted label, sunken fill on primary), with `cursor: progress`. Deviation: the dot pulses at `calc(var(--duration-fast) * 4)` per step (alternate), not raw `--duration-fast`, because a 150ms blink reads as flicker. Reduced motion turns the animation off (on top of the global clamp in global.css).
- `.button` is now `inline-flex` (centered, `--space-2` gap) with `text-decoration: none` so the same class serves `<button>` and ButtonLink's `<a>`.
- ButtonLink takes react-router `LinkProps`; it has no `loading`/`disabled`.
- Alert: title shows in `--text-heading-sm`, body in `--text-body-sm`; dot is vertically centered on the first line with a calc on `--text-body-sm-line`. Tone border is not held to 3:1 (the text carries the message).
- Contrast: added `error` on page/raised/sunken (text, both themes) and `ink-primary` on sunken for Alert text; all pass.
- Checks (from packages/frontend, 2026-10-05): lint + Stylelint, format:check, typecheck, `npx vitest run` x2 (19 files, 255 tests) all pass. Earlier mid-run errors in `services/httpClient.ts` (TASK-001) and `ui/Menu/Menu.tsx` (TASK-003) were gone on the final run.
