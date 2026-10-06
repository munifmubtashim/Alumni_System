# TASK-003 — UI primitives: Avatar, Chip, Skeleton

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system (worktree .worktrees/REQ-006-alumni-directory-page) |
| Depends on | — |
| Blocks | TASK-007, TASK-008 |

## Goal

Three display primitives in `components/ui/` that match the S2 avatar, filter chip and loading placeholder.

## Files to touch

| Path | Action |
|---|---|
| `src/components/ui/Avatar/{Avatar.tsx,Avatar.module.css,Avatar.test.tsx,index.ts}` | create — `name`, `photoUrl?`, `size?` (md 44px-ish, sm 40px-ish via tokens); photo as `<img alt="">` (decorative, the name sits next to it), else initials (first letter of first and last word) on `--accent-soft` / `--accent-strong` |
| `src/components/ui/Chip/*` | create — pill, accent-soft, text + remove button; `onRemove`, `removeLabel` prop for the button's accessible name |
| `src/components/ui/Skeleton/*` | create — `aria-hidden` block on `--surface-sunken` with a calm pulse; respects `prefers-reduced-motion` |
| `src/components/ui/README.md` | edit — list the three |

## Approach

- Follow Tag/Button file layout and `cx`. Check the avatar and chip colour pairs against the contrast test's token pairs (L-REQ-004-2); add the pairs to `src/styles/contrast.test.ts` if it keeps a list.
- No Mentor/status colours.

## Acceptance

- [ ] Tests: Avatar photo vs initials, one-word and empty name; Chip remove button has the given name and fires `onRemove`; Skeleton is hidden from assistive tech
- [ ] Contrast guard test still green; `lint`, `typecheck` pass

## Related

- Architecture: [[specs/2026-10/m/REQ-006-alumni-directory-page/architecture]]
- Spec: AC AC8, AC11, AC13, AC14
- All paths below are under `packages/frontend/`. Tokens only (`var(--…)`), CSS Modules, no inline styles, no raw hex, imports per the boundary rules. Import `describe/it/expect/vi` from vitest.

## Notes

- **Sizes.** No size token exists for 44px / 40px, so Avatar uses 2.75rem (md) and 2.5rem (sm), in rem like PasswordInput's toggle. Initials use `--text-heading-sm` (design 15px/600) for md and `--text-label` at heading weight for sm.
- **Avatar a11y.** The whole avatar is `aria-hidden` (not only the img), so a card link reads "Amira Mendes", not "AM Amira Mendes". An empty name renders an empty circle. A photo that fails to load falls back to initials; the failed URL is remembered so a new `photoUrl` retries.
- **Chip.** Remove button is 1.75rem (design shows a ~16px target); the chip is ~36px tall, close to the 38px pill triggers. `removeButtonRef` exists for TASK-008's "focus the new chip's remove button" rule. Hover fills the button with `--surface-raised` (pair added to the contrast test).
- **Skeleton.** `shape` line / block / circle; defaults inside `:where()` so a feature class sizes it regardless of CSS order. Pulse is opacity 1 -> 0.5 over 1.5s (`--duration-fast` x 10), `animation: none` under reduced motion (global.css also cuts it). No CSS-content test: `src/` tests have no Node types (CAND-008).
- **Contrast.** accent-strong on accent-soft was already guarded (accent Tag); added rows naming Avatar/Chip, plus accent-strong on surface-raised (non-text, hover) and accent on accent-soft (non-text, focus ring on the chip). All pass in both themes.
- **README.** Prettier re-padded the whole primitives table when the rows were added, so the diff touches every row.
- Results: full suite 606 passed (43 files, includes concurrent tasks' tests), typecheck, lint and format:check clean on 2026-10-06.
