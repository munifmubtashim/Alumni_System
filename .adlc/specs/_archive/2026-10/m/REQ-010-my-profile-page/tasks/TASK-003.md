# TASK-003 — Navigation: My Profile entry, avatar menu items, Home card

| Field | Value |
|---|---|
| REQ | REQ-010 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | none |
| Blocks | TASK-004 |

## Goal

A signed-in user can reach `/me` from the header nav, the phone tab bar, the avatar menu and Home, and can open their public profile from the avatar menu.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/config/mePath.ts` | create (`ME_PATH = '/me'`) |
| `packages/frontend/src/app/AppShell/navItems.tsx` | edit (add My Profile after Feed; update the doc comment) |
| `packages/frontend/src/app/AppShell/NavIcons.tsx` | edit (add `PersonIcon`) |
| `packages/frontend/src/app/AppShell/HeaderAuth.tsx` | edit (View profile, My Profile) |
| `packages/frontend/src/features/home/HomePage.tsx` | edit (third card) |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx`, `features/home/HomePage.test.tsx`, a HeaderAuth test | edit/create |

## Approach

- Menu order: label (name, email), 'View profile' (only when `alumni_id !== null`, goes to `profilePath(alumni_id)`), 'My Profile', separator, 'Log out'. `MenuItem` has only `onSelect`, so use `useNavigate` in `HeaderAuth`; do not add a library.
- NavLink marks `/me` current. The route does not exist until TASK-005; links to it are fine meanwhile (the catch-all page shows).
- Home card copy: title 'My Profile', short description in the voice of the other cards.

## Acceptance

- [x] Header nav and tab bar show My Profile with the right current state on `/me`
- [x] Menu shows View profile only for a user with an alumni id; both items navigate
- [x] Home shows the third card linking to `/me`
- [x] Existing nav tests updated; typecheck, lint, tests pass

## Notes

Student accounts have no alumni row: no 'View profile'. Do not add Admin.

Implementation (2026-10-07):
- Menu: label, View profile (alumni_id !== null), My Profile, separator, Log out. My Profile is shown even while ['me'] is loading or failed (the label and View profile need the user; My Profile does not), so that menu reads My Profile, Log out.
- No separate HeaderAuth test file: the menu tests live in AppShell.test.tsx's "Header auth area", which already has the fake API and router harness. Added stub routes `me` and `alumni/:id` to NAV_TEST_ROUTES so both menu items are clicked through to a page.
- The keyboard-open test now expects focus on View profile (Base UI focuses the first item).
- Icon: PersonIcon copied from S1-Phone-Light (circle r=4 + shoulders path).
- Home card copy is the architecture's draft: "My Profile" / "Keep your details current so classmates can find you".
- Follow-up: config/README.md should mention mePath.ts (not named by this task).
- Gates: full vitest 79 files / 1078 tests pass, typecheck clean, `npm run lint` clean, prettier clean on touched files.

## Related

- Architecture: [[specs/2026-10/m/REQ-010-my-profile-page/architecture]]
- Lessons checked: [[LESSON-REQ-006-3-client-copies-of-api-limits]], [[LESSON-REQ-002-3-must-succeed-steps-inside-mutationfn]], [[LESSON-REQ-009-4-adding-a-lazy-feature-touches-six-lists]], [[LESSON-REQ-007-1-sticky-bottom-bar-needs-scroll-padding]], [[LESSON-REQ-004-2-check-design-colours-against-token-pairs]]
