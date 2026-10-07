---
kind: task
---
# Rename My Profile to Account settings; drop it from the header nav

| Field | Value |
|---|---|
| REQ | REQ-012 |
| Kind | task |
| Created | 2026-10-07 |
| Primary repo | alumni-system |
| Related | [[REQ-010]] (My Profile page, nav entries) · [[REQ-007]] (app shell, S1) · [[knowledge/lessons/LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list\|L-REQ-010-5]] · [[knowledge/lessons/LESSON-REQ-010-3-leave-prompt-needs-its-reason-too\|L-REQ-010-3]] |

## Goal

The signed-in user's own page (`/me`) is called **Account settings** everywhere, and is no longer a link in the desktop header nav: it is reached from the avatar menu, the Home card and, on phones, an "Account" tab.

## Acceptance criteria

- [ ] AC1. The desktop header nav (`<nav aria-label="Main">`) lists only Directory and Feed; no "My Profile" or "Account settings" link there.
- [ ] AC2. The avatar menu item reads "Account settings" and still goes to `/me`; the `/me` page heading, tab title and the Home quick-link card title read "Account settings" (the card still links to `/me`). The phone tab bar's third tab reads "Account", links to `/me`, and is marked current there. No visible "My Profile" text remains in the app (the public "View profile" menu item and the S3 profile page are unchanged).
- [ ] AC3. Tests are updated and pass, and docs that name these labels are corrected (CLAUDE.md, frontend/app/me READMEs, component page).

## Scope / non-goals

- Touches labels, the nav item lists and the tests only. The `/me` route, form, fields and behaviour are unchanged. Route path, `ME_PATH` and the `features/me` folder names stay.
- Deliberate deviation from S1/S2/S3/S5, which draw "My Profile" in the header nav and "Profile" in the phone tab bar. Recorded in the docs.
- No Admin nav/tab (not built).

## Approach

- `app/AppShell/navItems.tsx`: header nav no longer includes `/me`; the tab bar keeps it, labelled "Account" (S1's phone bar has a self tab, and "Account settings" is too long for a tab). Split the single shared `NAV_ITEMS` into the header list (Directory, Feed) and the tab list (Directory, Feed, Account) in the same file; `MainNav` and `BottomTabs` read their own list.
- `HeaderAuth.tsx`: menu item text. `MePage.tsx`: `ME_HEADING`. `HomePage.tsx`: card title (check the card's description still reads right). `ProfileForm.tsx`: `HIDDEN_FIELD_HINT` names the page ("Open Account settings on a wider screen…"). Comments mentioning "My Profile" updated.
- Tests: `AppShell.test.tsx` (nav list, current marking, menu items, route heading, tabs), `HomePage.test.tsx`, `MePage.test.tsx`/`ProfileForm.test.tsx` where they assert the heading or hint. Docs: grep for "My Profile" (CLAUDE.md, `packages/frontend/README.md`, `app/README.md`, `features/me/README.md`, `.adlc/knowledge/components/frontend.md`).
- The leave-prompt comment in `useLeaveGuard.ts` names "the nav's own My Profile" link; reword (that link no longer exists in the header nav).
