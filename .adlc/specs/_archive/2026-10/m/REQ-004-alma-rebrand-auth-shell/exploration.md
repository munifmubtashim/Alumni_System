# REQ-004 — Codebase exploration

Written by: codebase-explorer (tier: fast)

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| By | codebase-explorer |
| Repo(s) scanned | Alumni_System |

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `packages/frontend/src/app/AppShell/HeaderAuth.tsx` | Renders guest (Log in / Sign up links) or signed-in (user menu with name, role, logout) — already in place; shows the auth pattern today | follow — restyle layout and appearance only |
| `packages/frontend/src/features/auth/AuthLayout.tsx` + `LoginPage.tsx` / `RegisterPage.tsx` | Centered card frame with form fields, title, footer link — current restyle target | follow — restyle CSS to match S1 designs, add show/hide password button to Input |
| `packages/frontend/src/app/brand.ts` | Exports single constant `BRAND_NAME = 'Alumni Network'` | replace — change to `'Alma'` |
| `packages/frontend/public/favicon.svg` | Current favicon (purple/violet, generic) | replace — use `docs/design/brand/favicon.svg` (Alma mark, terracotta) |
| `packages/frontend/index.html` | Title: `"Alumni Network"` | replace — change to `"Alma"` |
| `packages/frontend/src/components/ui/Input/Input.tsx` | Text input with label, error, helper text; no trailing button slot | extend — add optional trailing adornment (button) for show/hide password |

No similar Logo component exists yet. Alma logo is today a plain text `BRAND_NAME` in AppShell header line 27.

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `packages/frontend/index.html` (title) | Brand text change | **low** — purely additive (cosmetic) |
| `packages/frontend/public/favicon.svg` | Replace with Alma mark from design folder | **low** — file replacement only |
| `packages/frontend/src/app/brand.ts` | `BRAND_NAME = 'Alma'` | **low** — constant rename, one site of use |
| `packages/frontend/src/app/AppShell/AppShell.tsx` (line 27, brand text) | Replace with Logo component inline SVG | **medium** — renders logo instead of text; component doesn't exist yet |
| `packages/frontend/src/app/AppShell/AppShell.module.css` | Restyle header layout to S1 design (60–64px, logo + spacing, account menu right, theme toggle) | **medium** — layout/spacing/type changes; existing tests assert on text render |
| `packages/frontend/src/app/AppShell/HeaderAuth.tsx` | No code changes; result styled by new CSS in AppShell.module.css | **low** — CSS-only restyle |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx` | Update assertions: "Alumni Network" → "Alma" (lines 138, 173) | **low** — update expected text in 2 places |
| `packages/frontend/src/features/auth/AuthLayout.tsx` + `.module.css` | Restyle to 2-column brand-panel + form layout on desktop, stacked on phone; brand panel dark bg with logo, copy, testimonials; form column with card | **high** — major layout restructure with brand panel (new DOM/CSS) |
| `packages/frontend/src/features/auth/AuthLayout.module.css` | Full restyle: add brand panel, adjust card width/spacing to design; currently `max-width: 26rem` centered card only | **high** — adds brand panel, changes overall structure |
| `packages/frontend/src/features/auth/LoginPage.tsx` | Add show/hide password button + toggle logic; add "Forgot password?" link with support-email mailto; remove "Remember me" (not in spec) | **medium** — new UI elements and interactions (AC5, AC6) |
| `packages/frontend/src/features/auth/LoginPage.module.css` | Restyle form column to design (spacing, type, input styling with show/hide button layout) | **medium** — CSS changes for layout, password field wrapper |
| `packages/frontend/src/features/auth/LoginPage.test.tsx` | Update "Alumni Network" text assertion (line 142); add test for password show/hide button (AC6); add test for forgot-password mailto link (AC5) | **medium** — update brand text, add 2–3 new test cases |
| `packages/frontend/src/features/auth/RegisterPage.tsx` | Add show/hide password button + toggle logic to password field; restyle markup if needed for new Input adornment | **medium** — add password toggle, align input styling with Login |
| `packages/frontend/src/features/auth/RegisterPage.module.css` | Restyle to match signup design (2-column brand panel + form on desktop, stacked on phone) | **high** — major layout change |
| `packages/frontend/src/features/auth/RegisterPage.test.tsx` | Update "Alumni Network" text assertion; add password show/hide test; align with LoginPage test pattern | **medium** — update brand text, add test case |
| `packages/frontend/src/components/ui/Input/Input.tsx` | Add optional `adornment?: ReactNode` prop for trailing button | **low** — new optional prop, existing behaviour unchanged |
| `packages/frontend/src/components/ui/Input/Input.module.css` | Add wrapper `.field-with-adornment` or similar; input padding adjustment for trailing button | **low** — new CSS class, no breaking changes |
| `packages/frontend/src/components/ui/Input/Input.test.tsx` | Add test for adornment prop rendering | **low** — new test case, existing tests untouched |

**Test files that exercise changed code:**
- `packages/frontend/src/app/AppShell/AppShell.test.tsx` — 7 tests on header, theme, shell render, auth links, user menu
- `packages/frontend/src/features/auth/LoginPage.test.tsx` — 9 tests on form fields, validation, login flow, error handling
- `packages/frontend/src/features/auth/RegisterPage.test.tsx` — 10+ tests on role selection, field visibility, validation, signup flow
- `packages/frontend/src/components/ui/Input/Input.test.tsx` — 10 tests on label, helper, error, value, disabled state

## 3. Integration points

### Entry points affected
- **`AppShell` header brand area:** Currently renders `<span className={styles.brand}>{BRAND_NAME}</span>` (line 27). Will render a Logo component (inline SVG, mark fill `var(--accent)`, wordmark `currentColor`).
- **Auth pages:** Layout and styling only; no route, guard, or validation logic changes.
- **Input field:** Will accept optional `adornment` prop for password show/hide button; no breaking change to existing calls.

### Shared utilities / config
- **`BRAND_NAME`** constant in `app/brand.ts` — single source for the text "Alma". Is currently imported in AppShell (line 7); will be used as aria-label or alt text for logo.
- **Support email constant** — new, should live in one place so changing it is a one-line edit. Per spec (AC5), a constant `SUPPORT_EMAIL` with value `support@alma.app`. **Location TBD by architect** based on lint boundaries (see section 3 below).
- **Design tokens** in `packages/frontend/src/styles/tokens.css` — all colors, spacing, type already defined; no new tokens needed.

### Cross-cutting concerns
- **Auth:** No change to login/register/logout flow, guards, session handling, or mutations. Existing tests need only text assertion updates.
- **Theme switching:** Header theme toggle already works; no changes needed.
- **Styling enforcement:** ESLint + Stylelint — must use only design tokens (`var(--…)`), no raw hex/spacing values. New Logo component's inline SVG must use `var(--accent)` for the mark fill and `currentColor` for wordmark text.
- **Import boundaries:** Logo component location will be governed by lint rules (see section 3, below).

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| `packages/frontend/src/app/AppShell/AppShell.test.tsx` (lines 132–282) | Renders header with brand text, theme toggle, skip link, auth links (guest) and user menu (signed-in); dark/light/system theme; session expiry notice; logout navigation | No test of Logo component render or accessibility; no test of logo aria-label. Will need to update text assertion "Alumni Network" → "Alma" (lines 138, 173). |
| `packages/frontend/src/features/auth/LoginPage.test.tsx` (lines 138–335) | Form fields (email, password) with validation; login success/error (401, network, 5xx, 400); focus management; storage failure; session notice | No test of password show/hide button (new AC6). No test of forgot-password link or mailto behavior (new AC5). |
| `packages/frontend/src/features/auth/RegisterPage.test.tsx` (lines 138–TBD) | Role selection (student/alumni); field visibility by role; validation; signup success/error; duplicate email (409); focus management; storage failure | No test of password show/hide button (AC6). May need to update "Alumni Network" text assertion if the design includes brand copy. |
| `packages/frontend/src/components/ui/Input/Input.test.tsx` (lines 6–end) | Label, helper text, error, accessible description, value, disabled, id generation, event handling | No test of `adornment` prop rendering or click handling. |

**Gaps for new code:**
- AC5 (forgot-password): Test that "Forgot password?" link is present, has correct href (mailto with subject), and link is found by accessible name or text content. No redirect or API call.
- AC6 (show/hide password): Test that password field has a show/hide button, button has aria-label reflecting state ("Show password" / "Hide password"), clicking toggles `type` from `password` to `text`, keyboard (Enter/Space) operates it.
- Logo component: Test that it renders the Alma mark (SVG), has an accessible name / aria-label, uses only `var(--accent)` and `currentColor` in its styles (can't lint inline SVG).

## Vault references

Pages from the knowledge vault relevant to this REQ:

- [[knowledge/gotchas#^g03|G03]] — Frontend tsconfigs don't extend root; Logo's component location must respect this.
- [[knowledge/gotchas#^g04|G04]] — Stylelint rejects bare type values (`font-weight: 600`); all Auth layout CSS must use tokens.
- [[knowledge/gotchas#^g05|G05]] — Base UI Radio focus via `:focus-visible`; ThemeToggle already uses this; no change needed.
- [[knowledge/gotchas#^g09|G09]] — Base UI Menu styling uses `[data-highlighted]`; account menu already correct; no change.
- [[knowledge/gotchas#^g10|G10]] — Type-aware ESLint rules: form handlers take `SubmitEvent<HTMLFormElement>`, optional bools use `|| true`, axios errors `throw`. LoginPage/RegisterPage already follow; password toggle handler will too.
- [[knowledge/lessons/LESSON-REQ-001-5|L-REQ-001-5]] — CSS Modules only, no inline styles (they bypass Stylelint). All AuthLayout + Login/Register styling must be in `.module.css`; Logo component's inline SVG will require special handling or exemption (see open question below).
- [[knowledge/lessons/LESSON-REQ-001-6|L-REQ-001-6]] — Contrast sweeps: when a token changes (not applicable here; tokens stable) or a new color pair is introduced (logo mark with `--accent`), test all foreground/background pairs and pin accepted pairs in `contrast.test.ts`.
- [[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]] — UI primitives are Base UI headless + CSS Modules on tokens. Logo and Input adornment will follow this: no styled third-party components, own CSS Modules.
- [[architecture/adr-03-frontend-session-and-401-handling|ADR-03]] — Session handling, logout, redirect logic. No changes needed.

## Open questions

1. **Logo component location and SVG styling:** Where does the Logo component live? Given the lint rule "only `main.tsx` imports `app/`" and features can't import `app/`, the Logo either goes in `app/` (imported only by AppShell, also in `app/`) or in `components/ui/` (reusable by features too). If in `app/`, it can import nothing. If in `components/ui/`, it must be a pure UI component with no app imports. The design calls for the mark fill to be `var(--accent)` and wordmark text `currentColor` (inherits from header). Inline SVG with style attributes will fail Stylelint; can we exempt an inline SVG, or should Logo use a `<img>` or `<object>` to `public/logo.svg`? **Architect to decide.**

2. **Support email constant location:** AC5 requires the address to live in one exported constant so changing it is a one-line edit. Should it be in `app/brand.ts` (next to `BRAND_NAME`) or `features/auth/` (closer to use)? The lint rule forbids features from importing `app/` except in tests. If support email is in `app/brand.ts`, LoginPage can't import it. **Architect to decide.**

3. **Input adornment prop name and shape:** Should the prop be `adornment?: ReactNode` (generic, forward-compatible) or `passwordAdornment?: boolean` (specific to password show/hide)? Generic would let Input carry other trailing widgets later (clear button, currency symbol). Specific is more intentional. **Architect to decide.**

4. **Brand panel copy on auth pages:** The design shows static copy in the brand panel ("Welcome back to your alumni network" on login, "Stay connected with your alumni network" on signup) and three bullet points with made-up figures. Per AC3, made-up figures are replaced with neutral copy. What is the neutral copy? Design shows:
   - Login: "50,000+ alumni across 180 universities" → `?` ; "Find mentors in the career you're building" (keep); "A private, alumni-only network" (keep)
   - Signup: "12,400+ verified alumni across 180+ universities" → `?` ; other two bullets keep
   
   **Clarify neutral copy before writing AuthLayout.**

5. **Phone layout stacking:** The designs show the brand panel on the left (45%/55% split) on desktop, but designs exist for phone (390px) layouts. Do they stack vertically (brand panel above form) or does the brand panel vanish on phone? Need to check phone designs explicitly to confirm responsive breakpoint.

## Dependency sketch

(Simplified view of changed files and what depends on them)

```
brand.ts (BRAND_NAME: 'Alma')
  └─→ AppShell.tsx (imports, renders in header)
        └─→ AppShell.test.tsx (asserts on render)
        └─→ AppShell.module.css (styles header layout)

Logo component (SVG, var(--accent) mark, currentColor wordmark)
  └─→ AppShell.tsx (renders logo instead of text span)

Input.tsx (add adornment prop)
  └─→ LoginPage.tsx + RegisterPage.tsx (use adornment for show/hide button)
        └─→ LoginPage.test.tsx + RegisterPage.test.tsx (test button interaction)

SUPPORT_EMAIL constant (exported from app/brand.ts or features/auth/)
  └─→ LoginPage.tsx (renders in forgot-password link)

AuthLayout.tsx + LoginPage.tsx + RegisterPage.tsx (restyle to 2-column design)
  └─→ AuthLayout.module.css + LoginPage.module.css + RegisterPage.module.css (new layout CSS)
        └─→ Respective .test.tsx files (test layout, new interactions, updated text assertions)
```
