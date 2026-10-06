# TASK-006 — ProfilePage: data hooks, header, back link, states

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-001, TASK-002, TASK-003, TASK-004, TASK-005 |
| Blocks | TASK-007 |

## Goal

ProfilePage: data hooks, header, back link, states.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/profile/ProfilePage.tsx` + `.module.css` + `.test.tsx` | create |
| `packages/frontend/src/features/profile/useAlumniProfile.ts` | create |
| `packages/frontend/src/features/profile/ProfileHeader.tsx` + `.module.css` + `.test.tsx` | create |
| `packages/frontend/src/features/profile/BackLink.tsx` + `.module.css` + `.test.tsx` | create |
| `packages/frontend/src/features/profile/ProfileStates.tsx` + `.module.css` + `.test.tsx` | create (skeleton, not found, load error) |
| `packages/frontend/src/features/profile/README.md` | create |

## Approach

- `ProfilePage`: `useParams().id`, `useAlumniProfile(id)`. Pending → skeleton (+ polite status line); `isNotFoundError` → not found with Back link; error → message + Retry; success → `BackLink`, `ProfileHeader`, About, Education, Employment, `RecentPosts userId={profile.user_id}`. No `placeholderData`.
- `ProfileHeader`: `Avatar size="lg"`, `h1` (tabIndex -1, focused when the profile first shows and when the id changes), headline, LinkedIn `<a target="_blank" rel="noopener noreferrer">` only for `safeLinkedInUrl`, with its icon decorative. Set `<title>` to "<name> · Alma" using the brand constant from `@/config/brand`. No location, badge, or email.
- `BackLink`: target `directoryReturnPath(useLocation().state)`; arrow + text from 48rem; below 48rem text visually hidden and a separate aria-hidden "Profile" title beside the arrow (architecture).
- Every state has an `h1` (tabIndex -1) and a `<title>`: hidden "Loading profile", "Profile not found", "Couldn't load this profile"; focus moves to the current `h1` when the state changes, including on arrival (ADV-005). The phone top row (arrow link + "Profile") is a slim in-page row under the shell bar unless the gate picks the shell change (ADV-001).
- Phone avatar: the 72px override must use `.header .avatar[data-size='lg']` (at least as specific as Avatar's own rule) inside the media query (ADV-004).
- Off-scale spacing as `calc()` of `--space-*`; sizes as rem literals (architecture).
- Header: row on desktop, centred column on phone (S3). Page max width from S3 (860px), tokens for gaps.

## Acceptance

- [ ] Success, 404 (unknown id and `abc`), 500 + Retry works, 401 reaches the session handler, id change shows skeleton and never the old name.
- [ ] Posts failure leaves the profile visible; a profile without bio/company/etc. hides those parts.
- [ ] Back link: with state → `/directory?q=ann&page=2`; without → `/directory`; accessible name "Back to directory" at both widths.
- [ ] One `h1`, focus lands on it once the profile appears, `javascript:` LinkedIn is not a link.
- [ ] Loading, not-found and error each expose an `h1`, a matching document title, and move focus to it.
- [ ] Tests, typecheck, lint pass.

## Notes

Lesson L-REQ-006-2: do not leave focus on a node that unmounts when the skeleton is replaced. Use label-in-name safe markup for the back link. README states the import rules (no import of features/directory; lazy).

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
