---
id: REQ-007
title: App shell and home page match the S1 designs
kind: task
status: approved
created: 2026-10-06
---

# REQ-007 — App shell and home page match S1

## Goal
After this ships, the signed-in app shell (header on desktop, top bar plus bottom tab bar on phone) and the Home page at `/` match `docs/design/screens/app/S1-*` in light and dark, using tokens only.

## Acceptance criteria
1. **Shell.** Desktop header: full width, 4rem tall, raised surface with a hairline; logo left, then nav links for existing pages only (Directory), with the active link in ink-primary and a 2px accent underline; right side holds the existing compact icon-only `ThemeToggle` (same component and variant as the login page) and the avatar menu. Phone: top bar (logo, theme toggle, avatar) and a bottom tab bar with the same pages (Directory only), active tab in the accent colour.
2. **Avatar menu.** Initials avatar with a chevron opens a menu showing the user's name, email and Log out. Opens and moves with the keyboard; closes on Escape and on an outside click. No View profile / Admin settings yet.
3. **Home.** `/` shows "Welcome back, <first name>", the subtitle "Here's what's happening in your alumni network.", and one quick-link card, "Browse the directory" (links to `/directory`). Other cards wait for their pages.

Also: no hex values in code; tests updated and added; before finishing, the shell and home are screenshotted next to S1 at desktop and phone width in light and dark, and every difference is listed and fixed.

## Scope / non-goals
- Frontend only (`packages/frontend`). No API, auth or data change.
- Not building Feed, Profile or Admin pages, nav links, tabs or cards.
- Not restyling the Directory page (its width is kept as it is today).

## Approach
- `app/AppShell`: rebuild the header CSS and markup (full-width, S1 spacing; compact `ThemeToggle`; avatar `Menu`). Add `BottomTabs` and share one nav-items list (with icons) between `MainNav` and `BottomTabs`. Phone/desktop switch at 48rem, as today.
- `components/ui`: `Menu` gets an accessible-name prop for an icon trigger and a separator-style label block; `Avatar` gets an `xs` size (S1's 32px).
- `features/home/HomePage`: new heading, subtitle and a `QUICK_LINKS` list rendered as link cards.
- `AppShell` main becomes full-width with S1 padding (S1 content is left-aligned at the header's gutter); `features/directory/DirectoryPage.module.css` gets the 72rem cap the shell used to give it.
- Tests: update `AppShell.test.tsx`, `HomePage.test.tsx`, `Menu.test.tsx`, `Avatar.test.tsx`; add `BottomTabs`/nav tests. Update `app/README.md` and the CLAUDE.md frontend notes (shell, phone tab bar).
- Token mapping: S1 sizes with no token (15px, 24px, 20px, 10px, 40px) use the nearest token or a `calc()` of tokens; remaining gaps are listed after the screenshot comparison.

## Related
- REQ-004 (Alma rebrand, shell), REQ-006 (Directory link in the header; this reverses its "no tab bar on phones" choice).
- ADR-01 (own primitives on tokens), ADR-08 (lazy routes — unchanged).
- Design gap: the bundle has S1 Desktop **Dark**, Phone Dark and Phone Light only. Desktop Light is derived from the same tokens.
