# TASK-003 — Avatar lg size

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-006 |

## Goal

Avatar lg size.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/components/ui/Avatar/Avatar.tsx` | edit |
| `packages/frontend/src/components/ui/Avatar/Avatar.module.css` | edit |
| `packages/frontend/src/components/ui/Avatar/Avatar.test.tsx` | edit |
| `packages/frontend/src/components/ui/README.md` | edit (sizes line) |

## Approach

- Add `'lg'` to `AvatarSize`; CSS `[data-size='lg']`: 5.25rem square (S3 84px), initials use `--text-heading-lg`.
- Tokens only; follow the existing size rules.

## Acceptance

- [x] `size="lg"` sets `data-size="lg"`; default is unchanged.
- [x] Stylelint passes (no raw colours; rem sizes as in the other sizes).
- [x] README lists the new size.

## Notes

Phone shrinks it to 72px from the profile's own CSS (TASK-006) with a selector at least as specific as `[data-size='lg']`; this task only adds the size.

Done 2026-10-07: `lg` = 5.25rem square, `font: var(--text-heading-lg)` (28px; S3 desktop initials). Test added for `data-size="lg"`; default md test unchanged. Prettier re-aligned the README table row. Full `npm test` was flaky under parallel load (5s timeouts in DirectoryPage/AppShell/Login/Register tests, files not touched here); a quiet rerun passed 55/55 files, 777 tests. Lint, stylelint, typecheck, format:check all clean.

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
