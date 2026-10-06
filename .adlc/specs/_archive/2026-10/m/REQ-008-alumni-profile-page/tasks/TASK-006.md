# TASK-006 — ProfilePage: data hooks, header, back link, states

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 2 |
| Status | done |
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

- [x] Success, 404 (unknown id and `abc`), 500 + Retry works, 401 reaches the session handler, id change shows skeleton and never the old name.
- [x] Posts failure leaves the profile visible; a profile without bio/company/etc. hides those parts.
- [x] Back link: with state → `/directory?q=ann&page=2`; without → `/directory`; accessible name "Back to directory" at both widths.
- [x] One `h1`, focus lands on it once the profile appears, `javascript:` LinkedIn is not a link.
- [x] Loading, not-found and error each expose an `h1`, a matching document title, and move focus to it.
- [x] Tests, typecheck, lint pass.

## Notes

Lesson L-REQ-006-2: do not leave focus on a node that unmounts when the skeleton is replaced. Use label-in-name safe markup for the back link. README states the import rules (no import of features/directory; lazy).

**Implementation notes (2026-10-07):**

- Focus: one `useEffect(() => headingRef.current?.focus(), [id, view])` in `ProfilePage` with a ref passed to whichever state's h1 is mounted (`view` = loading / notFound / error / profile). A failed Retry keeps the same view, so focus stays on the Retry button.
- `BackLink` renders on every state (loading, not found, error, profile), so "not found with Back link" is met by the same top link; `ProfileNotFound` is an h1 + explanation, no `Alert` (focus already announces the h1; an `Alert` would announce twice). Deviation from architecture's "Alert plus Back link" wording.
- Loading h1 is a plain `h1` (margin 0) wrapping `VisuallyHidden` text, because `VisuallyHidden` takes no ref. `aria-busy` sits only on the decorative skeleton, not around the status line.
- Blank name: h1 and title fall back to "Alumni profile" (`UNNAMED_PROFILE`), avatar gets empty initials.
- LinkedIn link name is "LinkedIn (opens in a new tab)" (hidden suffix), label-in-name safe.
- BackLink label clip rule is a copy of VisuallyHidden's, inside `@media (width < 48rem)` only; the primitive cannot be responsive.
- `ProfilePage.test.tsx` copies the token builder (G26 said not to; a shared `src/test/` helper is QUAL-002 and outside this task's files). Tests turn query retry off so the 500 + Retry case is fast.
- Data shape: `GET /api/alumni/:id` still returns `email` (not rendered, asserted absent in tests). `useParams().id` is passed through as a string; the API decides 404 for `abc` (G14).

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
