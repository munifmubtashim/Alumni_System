# Rebrand to Alma and restyle login, sign-up and the app shell

| Field | Value |
|---|---|
| REQ | REQ-004 |
| Status | validated (decisions taken at the task plan gate, 2026-10-06; escalated to /proceed) |
| Created | 2026-10-06 |
| Related | [[architecture/adr-01-ui-layer-headless-css-modules\|ADR-01]] · [[concepts/design-tokens]] · [[knowledge/lessons/LESSON-REQ-001-5-css-modules-only-no-inline-styles\|L-REQ-001-5]] · [[knowledge/lessons/LESSON-REQ-001-6-contrast-changes-sweep-all-uses\|L-REQ-001-6]] |

## Goal

The app is called **Alma** everywhere: tab title, favicon, header logo. The login page, sign-up page and app shell match `docs/design/screens/login`, `signup` and `app/S1`, built from design tokens only. Login, registration, validation, session handling and routing behave exactly as they do today.

## Acceptance criteria

- [ ] AC1. "Alumni Network" no longer appears in the UI or `index.html`. `BRAND_NAME` is "Alma"; the header and auth pages show the Alma logo; the tab uses `docs/design/brand/favicon.svg`.
- [ ] AC2. Login, sign-up and the shell match their designs (layout, spacing, type, light/dark, 360px phone) using only `var(--…)` tokens: no hex or raw values from the design files (Stylelint + ESLint stay green).
- [ ] AC3. The made-up figures ("50,000+ alumni across 180 universities", "12,400+ verified alumni…") are replaced with neutral copy. "Remember me" is not shown (the backend has no support).
- [ ] AC5. "Forgot password?" stays on the login page. Activating it shows a short inline message: "Contact support at support@alma.app from your registered email address, and we'll help you reset your password." The address is a `mailto:` link with the subject "Password reset request" pre-filled. The address lives in one exported constant, so changing it is a one-line edit. No navigation, no API call.
- [ ] AC6. The password field on login and sign-up has a show/hide button: it toggles `type` between password and text, has an accessible name that reflects the state ("Show password" / "Hide password"), and is keyboard-operable. Covered by a test.
- [ ] AC7. The app-shell header follows S1 (Alma logo, account menu, theme toggle) but has **no nav links** until their pages exist.
- [ ] AC4. No logic changes: hooks, validators, mutations, guards and routes untouched. Existing tests pass with only two kinds of edits: brand-text assertions ("Alumni Network" → "Alma", 3 in AppShell.test), and the two "page has exactly one button" assertions (LoginPage.test:147, RegisterPage.test:166) narrowed to "exactly one submit button", because AC5 and AC6 add buttons. New tests cover AC5 and AC6. The show/hide button and the forgot-password message are the only new behaviour.

- [ ] AC8 (implement-gate revision, 2026-10-06). Login and sign-up match the layout of `docs/design/screens/login/Main.dc.html` / `Desktop-Dark.dc.html`:
  - full-height split; the brand panel is the left 45%, edge to edge, no radius
  - no app header on auth pages, only a small theme toggle top-right
  - the panel is space-between: logo top, headline + trust points middle, "© 2026 Alma" bottom
  - the form has no card or border, is centred, max-width 380px
  - the "Log in" / "Sign up" heading has its "New here? Create an account" / "Already have an account? Log in" line directly below it
  - the panel headline is "Welcome back to your alumni network." on login (sign-up keeps its own design headline)
  - tokens only: heading `--text-heading-md`, headline `--text-heading-lg` (the design's 24/34px have no token); panel on `--surface-sunken`

## Scope / non-goals

- In: `index.html`, `public/favicon.svg`, `app/brand.ts`, a Logo, `AppShell`, `features/auth` layout and page markup and CSS.
- Out (revision note: auth pages now leave the app header, which needs a router layout change, approved 2026-10-06): new routes or pages (Directory, Feed, Admin) and their nav links, a real password-reset flow, remember-me, token or palette changes, backend.

## Approach

- Brand: `BRAND_NAME = 'Alma'`; title; favicon from `docs/design/brand/favicon.svg`. Add a `Logo` component (inline SVG, mark fill `var(--accent)`, wordmark `currentColor`) instead of the hex-filled file.
- Auth pages: restyle `AuthLayout` (brand panel + form column) and `LoginPage`/`RegisterPage` markup and CSS to the designs, reusing the `Button`/`Input`/`SegmentedControl` primitives.
- Shell: restyle the `AppShell` header to S1 (logo, auth menu, theme toggle), with no nav links.
- About 12–14 files across `app/`, `features/auth/` and `components/ui/`. Tests: update brand assertions; add a Logo test.

## Decisions (task plan gate, 2026-10-06)

- Nav links: left out of the shell until their pages exist.
- "Forgot password?": kept; shows a support message with a `mailto:support@alma.app?subject=Password%20reset%20request` link; address in one config constant.
- Show/hide password: built, with a test.

## Open questions (for /architect)

- `favicon.svg` and the logo file have hex fills, and a favicon can't read CSS tokens. Decide whether the static favicon is an allowed exception and the in-app logo is a token-driven component.
- Where the support-email constant lives (`app/brand.ts` next to `BRAND_NAME`, or `features/auth`), given the import-boundary lint.
