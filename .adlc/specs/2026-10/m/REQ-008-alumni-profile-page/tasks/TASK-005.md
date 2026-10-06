# TASK-005 — Timeline, text sections and Recent posts

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-001, TASK-002 |
| Blocks | TASK-006 |

## Goal

Timeline, text sections and Recent posts.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/profile/Timeline.tsx` + `.module.css` + `.test.tsx` | create |
| `packages/frontend/src/features/profile/AboutSection.tsx` + `.test.tsx` | create |
| `packages/frontend/src/features/profile/EducationSection.tsx` + `.test.tsx` | create |
| `packages/frontend/src/features/profile/EmploymentSection.tsx` + `.test.tsx` | create |
| `packages/frontend/src/features/profile/RecentPosts.tsx` + `.module.css` + `.test.tsx` | create |
| `packages/frontend/src/features/profile/PostCard.tsx` | create |
| `packages/frontend/src/features/profile/usePostsByUser.ts` | create |
| `packages/frontend/src/features/profile/Section.module.css` | create (heading + spacing shared by sections) |

## Approach

- `Timeline` is a `<ul>`; each `<li>` has a dot and a connecting line (CSS, tokens); last item has no line. Takes items `{ title, detail? }`; Employment's `experience` paragraph is a final non-dot block under the list.
- Sections take props from the profile (`Alumni`) and return `null` when empty (spec AC6–AC8). Headings are `h2`. `experience` is plain text, `white-space: pre-line`, `overflow-wrap: anywhere`.
- `usePostsByUser(userId | undefined)`: `enabled: userId !== undefined`, key `['posts','user',userId]`. `RecentPosts` shows the newest 5: skeleton cards while pending, inline `Alert` + Retry on error (profile unaffected), "No posts yet" when empty. `PostCard`: caption (omitted when blank), then "<relative time> · <N comments>"; not a link; an `<article>` with the date in `<time dateTime>`.
- Design values from S3 desktop and phone, as tokens (see architecture, known gaps); off-scale spacing as `calc()` of `--space-*`, sizes as rem literals.

## Acceptance

- [ ] Each section is absent when its data is empty and present otherwise; stray separators never appear.
- [ ] `experience` containing `<b>x</b>` renders as literal text.
- [ ] Posts: pending, error + Retry, empty, 7 posts show 5, 1 vs many comments, caption-less post.
- [ ] CSS has no hex, no raw px colours; stylelint passes.
- [ ] Tests, typecheck, lint pass.

## Notes

Do not show the email anywhere. The spec forbids invented content: no placeholder dates, no "Present".

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
