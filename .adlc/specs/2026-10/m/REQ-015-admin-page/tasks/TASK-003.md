# TASK-003 — Frontend: error-soft + scrim tokens; Drawer and ConfirmDialog primitives

| Field | Value |
|---|---|
| REQ | REQ-015 |
| Tier | 0 |
| Status | done (one test pending approval, see Notes) |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-005 |

## Goal

Two new colour tokens exist (generated), and two tested primitives wrap Base UI Dialog (side drawer) and AlertDialog (confirm) on tokens only.

## Files to touch

| Path | Action |
|---|---|
| `docs/design/design-system/tokens.json` | edit (error-soft, scrim) |
| `docs/design/design-system/README.md` | edit if it lists tokens |
| `packages/frontend/src/styles/tokens.css` | regenerate (npm run tokens) |
| `packages/frontend/src/styles/contrast.test.ts` | edit (error on error-soft pair) |
| `packages/frontend/src/components/ui/Drawer/{Drawer.tsx,Drawer.module.css,Drawer.test.tsx,index.ts}` | create |
| `packages/frontend/src/components/ui/ConfirmDialog/{ConfirmDialog.tsx,ConfirmDialog.module.css,ConfirmDialog.test.tsx,index.ts}` | create |
| `packages/frontend/src/components/ui/README.md` | edit |

## Approach

- `error-soft`: light #f6e1dd (S6), dark a brick tint where --error stays ≥ 3:1 (icon) — add the pair to contrast.test.ts. `scrim`: light ≈ ink 35% alpha, dark a darker scrim; check generate-tokens.ts accepts the value form (8-digit hex is fine) and `tokens:check` passes.
- Drawer props: `open`, `onOpenChange(open, reason)`, `title`, `children`, `footer`, `closeLabel` (default "Close"), optional `initialFocus`. Right-anchored panel, 420px from 48rem and full width below, header with h2 title + × button, scrolling body, footer bar; backdrop uses --scrim; slide-in via --duration-fast/--easing-standard, none under prefers-reduced-motion. No box-shadow; border-left hairline.
- ConfirmDialog props: `open`, `onOpenChange`, `title`, `description`, `confirmLabel`, `cancelLabel` (default "Cancel"), `onConfirm`, `loading`, `tone` ("danger"), `icon`, `children` (error slot). AlertDialog semantics, initial focus on Cancel, Escape closes, backdrop click does not. Danger icon circle uses --error-soft / --error; confirm button danger variant (add a `danger` Button variant if none exists, with its test).

## Acceptance

- [ ] Primitive tests: accessible name from title, focus moves in and returns to the trigger, Escape closes, alertdialog role, backdrop rules, loading disables confirm
- [ ] `npm run tokens:check`, lint (no hex/shadow), contrast and enforcement tests pass
- [ ] `components/ui` imports nothing from services/store/features/config/app (boundary lint)

## Notes

Base UI 1.8 has `@base-ui/react/dialog` and `alert-dialog` installed (G25: name the popup; check first-focus behaviour). These primitives are generic: no admin wording inside.

### Implementation notes (TASK-003, 2026-10-08)

- **Token values.** `error-soft` light `#f6e1dd` (S6), dark `#3d2622` (brick tint next to `accent-soft`'s `#3a2c23`); `error` on it is 4.43:1 light, 4.44:1 dark, held to 3:1 (icon). `scrim` light `#2b272459` (ink-primary at 35%), dark `#0e0c0b99` (near-black at 60%). The generator copies values verbatim, so 8-digit hex works; `tokens:check` passes.
- **Out-of-scope file, not edited.** `packages/frontend/scripts/generate-tokens.test.ts:35` asserts `toHaveLength(17)` colour tokens; it now fails (19). The fix is changing 17 to 19. Left for approval because the task did not name the file.
- **Contrast pairs added:** `error` on `error-soft` (3:1), `accent-ink` on `error` (danger label, 5.27 / 5.49), `error` on `surface-raised` (danger hover), plus ink pairs for the panels. `scrim` is never a pair (alpha).
- **Danger Button.** `--error` fill, `--accent-ink` text (S6's `#fdf8f3`). No darker error token, so hover flips to `surface-raised` fill with `error` text and border, instead of inventing an `error-strong` token.
- **Added prop beyond the task list:** `finalFocus` on both primitives (and `DrawerFocusTarget`), because TASK-007 needs focus on the table caption after a delete (G35) and TASK-006 may need it after an edit; default is Base UI's return-to-previous-focus.
- **Drawer reasons.** `onOpenChange(open, reason)` with reason `close-press` / `escape-key` / `outside-press` / `other`, mapped from Base UI's reason strings so its types stay inside. The drawer is controlled and never closes itself, so TASK-006's dirty-close confirm just refuses the request.
- **ConfirmDialog.** Cancel is `AlertDialog.Close` rendered as our `Button` (via `render`), focused first through a ref. Escape and Cancel call `onOpenChange(false)`; the backdrop does nothing (AlertDialog). Close requests are forwarded even while `loading`: the caller decides (ADV-004 put that in TASK-006/007). `tone` is `neutral` (default; accent circle, primary button) or `danger`.
- **jsdom limits.** Base UI sets no `aria-modal`; it hides the rest of the page with `aria-hidden` + `data-base-ui-inert`, which the tests check. The Tab trap uses focus-guard spans whose redirect jsdom does not run, so the Tab loop must be checked in a browser in TASK-008.
- **Layering.** Both use z-index 10 (like Menu/Popover), so a popover opened inside a drawer is portalled later and draws on top; Toast (z 20) stays above.

## Related

- Architecture: [[specs/2026-10/m/REQ-015-admin-page/architecture]]
- Lessons checked: L-REQ-001-5, L-REQ-004-2, G05, G18, G25, G33
