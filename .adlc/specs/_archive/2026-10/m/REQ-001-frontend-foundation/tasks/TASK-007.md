# TASK-007 — UI primitives: Button, Input, Card, Tag

| Field | Value |
|---|---|
| REQ | REQ-001 |
| Tier | 3 |
| Status | complete |
| Repo | alumni-system |
| Depends on | TASK-002, TASK-004 |
| Blocks | TASK-009 |

## Goal

Button, Input, Card and Tag exist in `src/components/ui/`, match their READMEs in `docs/design/design-system/components/`, use only token variables, and are covered by RTL tests for variants, states and keyboard/a11y behavior.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/components/ui/Button/{Button.tsx,Button.module.css,Button.test.tsx,index.ts}` | create |
| `packages/frontend/src/components/ui/Input/{Input.tsx,Input.module.css,Input.test.tsx,index.ts}` | create |
| `packages/frontend/src/components/ui/Card/{Card.tsx,Card.module.css,Card.test.tsx,index.ts}` | create |
| `packages/frontend/src/components/ui/Tag/{Tag.tsx,Tag.module.css,Tag.test.tsx,index.ts}` | create |
| `packages/frontend/src/components/ui/cx.ts` | create |

## Approach

- Read each component's `README.md` **and** `preview.html` in `docs/design/design-system/components/` before styling; the preview's CSS is the visual reference (translate its values into token vars — never copy raw values).
- Props extend the native element props (`ComponentPropsWithRef<'button'>` etc.); variant exposed as `data-variant` / `data-tone` attribute and styled via attribute selectors in the module. `className` is merged (simple join helper in `components/ui/cx.ts`, no dependency). No `components/ui/index.ts` barrel — consumers import `@/components/ui/Button` (each folder's `index.ts` re-exports).
- **Button**: `variant?: 'primary'|'secondary'|'ghost'` default `'secondary'`; `type` default `'button'`; `font: var(--text-label)`; `padding: var(--space-3) var(--space-4)`; `border-radius: var(--radius-md)`; hover changes border/fill toward `--accent-strong`; disabled uses `--ink-muted`, `cursor: not-allowed`.
- **Input**: required `label`, optional `helperText`; `useId()` for the input id; `<label htmlFor>`; helper `id` wired via `aria-describedby`; helper text uses `--ink-secondary` (README says `ink-muted`, which is 3.1:1 on the page — see architecture.md → Contrast); rests on `--surface-sunken` with `--border-subtle`; `:focus` → `--surface-raised` + `--accent` border, `outline: none` (README: the line is the only focus signal); disabled → `opacity: 0.5`.
- **Card**: `as?: 'div'|'article'|'section'` default `div`; `--surface-raised`, 1px `--border-subtle`, `--radius-lg`, `padding: var(--space-5)`.
- **Tag**: `tone?: 'neutral'|'accent'|'success'|'warning'|'error'` default neutral; status tones render `<span aria-hidden className={dot}>` (dot filled with the status color) before children, and the **text uses `--ink-secondary`**, not the status color (status colors are 3.0–4.0:1 as text in light mode — see architecture.md → Contrast); `--radius-sm`, `font: var(--text-label)`.

## Acceptance

- [ ] Button test: each variant sets its `data-variant`; `onClick` fires on click, Enter and Space (user-event); disabled blocks click; default `type="button"`.
- [ ] Input test: `getByLabelText('Email')` finds the input; helper text is its accessible description; typing updates value; disabled is not editable.
- [ ] Card test: renders children; `as="article"` renders an `<article>`.
- [ ] Tag test: each tone sets `data-tone`; status tones render the dot, neutral/accent don't.
- [ ] No raw color/spacing values; no `box-shadow` — `npm run lint` passes.
- [ ] `npm test`, `npm run typecheck`, `npm run format:check` pass.

## Notes

### Implementation notes (2026-10-05)

- **Specificity trap (stylelint `no-descending-specificity`).** `.input:hover:not(:disabled)` (0,3,0) beat `.input:focus` (0,2,0), so a hovered, focused field would show the hover border instead of the accent focus border. Hover guards now sit in `:where(...)` (zero specificity): `.input:hover:where(:not(:disabled, :focus))`, and Button uses `:hover:where(:not(:disabled))` so the later `:disabled` rules win.
- **Input focus:** `.input:focus, .input:focus-visible { outline: none }` overrides the global `:focus-visible` outline from global.css; the accent border is the only focus signal (README).
- **Input `className` goes on the `<input>`** (props extend native input props); the wrapper `.field` takes no className. `id` and `aria-describedby` from the caller are respected and merged with the helper id. Helper renders as `<p>` only when non-empty.
- **Button disabled:** text `--ink-muted`, primary falls back to `--surface-sunken` fill + `--border-subtle`; secondary border goes to `--border-subtle`. No opacity (task said ink-muted, not the preview's 45% opacity).
- **Tag** uses `font: var(--text-label)` per the task; the preview uses caption size (12/16). Accent tone drops the border (transparent); others keep `--border-subtle`. Dot is 6px, `--radius-pill`, colored per tone via `[data-tone] .dot`.
- **Card** accepts `ComponentPropsWithRef<'div'>` and renders `as` element; typecheck accepts the div ref type on article/section.
- **Keyboard test:** tab first, then Enter/Space, then click — clicking first leaves focus on the button so `user.tab()` moves it to body.
- **Checks:** my files pass eslint, stylelint, prettier; `npm test` 126/126; typecheck and build pass. At handoff `npm run lint` still failed on TASK-006 files only (`@typescript-eslint/unbound-method` in `src/features/theme/useApplyTheme.test.tsx` and `src/store/themeAtom.test.ts`), which this task may not edit.

## Related

- Architecture: [[specs/2026-10/m/REQ-001-frontend-foundation/architecture]]
- Lessons checked: none exist yet
