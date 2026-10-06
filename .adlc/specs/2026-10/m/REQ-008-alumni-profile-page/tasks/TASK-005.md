# TASK-005 — Timeline, text sections and Recent posts

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 1 |
| Status | done |
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

From TASK-002: text helpers return `string | undefined` (undefined = hide the line); `relativeTime` returns `''` for an invalid date, so hide the `<time>` then. From TASK-001: `getPostsByUser(userId: number)`.

Do not show the email anywhere. The spec forbids invented content: no placeholder dates, no "Present".

Implementation (2026-10-07):
- `Timeline` takes `items: { id, title, detail? }[]` and `note?: string`. The note (Employment's `experience`) is a `<p>` after the `<ul>`, indented to line up with the entry text (custom properties `--timeline-dot-size`/`--timeline-gap` on the wrapper). It uses `--text-body-sm` in `--ink-secondary`, my reading of "the timeline's text style". Dots/lines carry `data-part` for tests and sit in an `aria-hidden` rail.
- Education: university is the title, `educationLine` under it; with no university, `educationLine` becomes the title (spec table + assumption line 81).
- Sections are `<section aria-labelledby>` with an `h2` (named regions). Heading margins: About 8/10px, others 10/14px (phone/desktop), as calc() of `--space-*`.
- `RecentPosts({ userId: number })` calls `usePostsByUser` itself, so its states stay inside the section. 2 skeleton cards; error Alert "Posts didn't load" + Retry (`loading` while refetching); "No posts yet". `RECENT_POSTS_LIMIT = 5` is exported.
- `usePostsByUser` uses `skipToken` rather than `enabled` (same effect, no non-null assertion; lint forbids `!`).
- `PostCard` reuses `Card as="article"` and shares `RecentPosts.module.css` (task named no PostCard CSS). `<time dateTime>` gets an ISO string; the time and its " · " are hidden when the date is missing or invalid. The `.card` override of Card's padding/gap relies on Card's CSS loading first (it is in the main bundle via RouteError).
- Type tokens (nearest, for TASK-008's difference list): headings `--text-heading-sm`; timeline title `--text-body-sm` at weight 600; detail `--text-caption` (phone) / `--text-label` (desktop) at weight 400; caption `--text-body-sm`; post meta `--text-caption` weight 400 in `--ink-muted`. Card radius `--radius-lg` (14 vs design 12). Dots `--accent`.

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
