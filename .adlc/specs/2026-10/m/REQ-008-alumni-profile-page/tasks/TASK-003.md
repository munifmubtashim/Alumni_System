# TASK-003 — Avatar lg size

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 0 |
| Status | pending |
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

- [ ] `size="lg"` sets `data-size="lg"`; default is unchanged.
- [ ] Stylelint passes (no raw colours; rem sizes as in the other sizes).
- [ ] README lists the new size.

## Notes

Phone shrinks it to 72px from the profile's own CSS (TASK-006) with a selector at least as specific as `[data-size='lg']`; this task only adds the size.

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
