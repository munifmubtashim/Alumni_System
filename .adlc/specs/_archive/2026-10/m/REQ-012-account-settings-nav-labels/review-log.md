# REQ-012-account-settings-nav-labels — Review log

## Correctness findings

Summary: no blocking defects. No behaviour change to the /me route (path, lazy route, guard logic untouched; only strings, the nav list split and comments). The only other reader of NAV_ITEMS was MainNav and BottomTabs; both are updated. Grep finds no visible "My Profile" left in `packages/frontend/src`. Header list is [Directory, Feed], tab list is [Directory, Feed, Account], and the two cannot drift because the tab list spreads the header list.

**C-1 (merge hazard, REQ-011, certain on merge): textual conflicts plus one stale string.** On `feat/REQ-011-profile-headline-location-mentorship`, `ProfileForm.tsx:46` holds `HIDDEN_FIELD_HINT = 'Open My Profile on a wider screen to change it.'`. After both merge, a visible "My Profile" remains and the page is "Account settings". Fix on whichever merges second: change the hint to "Open Account settings on a wider screen..." and update its tests. REQ-011 also edits `ProfileForm.test.tsx` (line 127, the `Page` wrapper h1 "My Profile"), `MePage.test.tsx` (228-265), `me/README.md` line 7 and `features/me` tests. These are the same lines REQ-012 changes, so expect conflicts there. Neither touches the other's logic, so this is a docs/test merge only.

**C-2 (low, behaviour note): on desktop /me nothing in the header is marked current.** The avatar menu is a closed button with no `aria-current`, and MainNav no longer has the link. That is the intended deviation, so I'd accept it. Check that no AppShell test still expects `aria-current` on a /me header link (the `AppShell.test.tsx` diff is in the working tree; I did not re-read it). The phone "Account" tab still gets `aria-current="page"` at /me via NavLink, unchanged.

**C-3 (nit): label drift.** The tab says "Account" while the page, menu and Home card say "Account settings". The guest header `<nav aria-label="Account">` and the menu button "Account menu for X" share the word. They have different roles, so `getByRole('link', {name:'Account'})` is unique in the tab bar (exact string match), but a regex `/account/i` in a test would hit several. Not a bug.

Leave guard: the comment is now accurate. The same-path rule (`nextLocation.pathname !== currentLocation.pathname`) still covers the tab "Account" and the menu "Account settings" at /me. No code depended on the header link. Skip link, focus handling and the Back-to-home link are unaffected.

## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 45 lessons (0 superseded), all gotchas touching AppShell/me/tests, ADR-07/08/04, route-layout concept and frontend component page. 0 critical, 0 major, 0 minor, 2 trivial (both needs-decision for /wrapup). Repo-doc sweep (L-REQ-010-5): CLAUDE.md, frontend README, app/README, features/README, me/README, components/frontend.md, route-layout.md all already match the change; no stale "My Profile" nav, tab or header claim left (remaining hits are REQ-010/007 history lines, G37 title, ADR-04 prose, index.md row, all fine as history). ADR-07: root layout and shells untouched, no conflict. Gotchas G-AppShell test traps (guest `nav aria-label="Account"` vs new "Account" tab) do not collide: guest nav and tab bar never render together.

### REFL-001: Component page status line still says "current as of REQ-010"

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `.adlc/knowledge/components/frontend.md:6` |
| Category | vault-stale |
| Vault reference | [[knowledge/components/frontend]] |

**What:** The diff edits the page body and adds a REQ-012 row, but the Status row still reads "current as of REQ-010 (2026-10-07)".
**Recommendation:** At /wrapup set it to REQ-012. Also line 42 (REQ-007 row) names `NAV_ITEMS`, which no longer exists; leave as history or add "(split in REQ-012)".

### REFL-002: Design deviation recorded in READMEs only, designs still say "My Profile"

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/app/README.md:12`, `.adlc/knowledge/concepts/route-layout.md:15` |
| Category | vault-stale |
| Vault reference | [[knowledge/concepts/route-layout]]; CLAUDE.md "Designs live in docs/design/; follow them" |

**What:** The deliberate deviation from S1/S2/S3/S5 (no /me in header nav, tab "Account") is written in app/README.md and CLAUDE.md, but `docs/design/` (S1, S5) is unchanged, and the next REQ comparing against S1 will flag it again. Desktop also now has no active-state marker on /me (the avatar menu has none).
**Recommendation:** At /wrapup add one line to route-layout.md ("header nav = Directory, Feed; tabs add Account; deviates from S1, REQ-012") so reviewers have a vault page to cite. No ADR needed unless the user wants the design files updated.

## UI/UX findings

Written by: ui-reviewer (tier: balanced), static-only.

Read the diff, BottomTabs/MainNav/AppShell CSS and tests against AC1-AC2. 0 critical, 0 major, 1 minor, 1 trivial. Answers: tab bar sizing, checked, nothing (3 tabs before and after; `.tab` is `flex: 1`, no count assumed; `--tab-bar-height` is a fixed calc on the shell, so the save bar offset is unchanged). Desktop header spacing, checked, nothing (`.nav` is a flex with `gap: space-5`; two links just shrink it, the toggle and avatar sit right-aligned independent of it). Avatar menu first-item focus, checked, nothing (same Menu component; the first item is simply "Account settings" for non-alumni, "View profile" for alumni; the tests cover both lists). Home card copy and tab title, checked, nothing (both come from `ME_HEADING`/QUICK_LINKS; grep finds no remaining "My Profile" in non-test source). Path to /me on phone, checked, nothing (tab, avatar menu and Home card all remain).

### UI-001: Three different "Account" names on a phone

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | any signed-in page below 48rem |
| Lens | a11y |
| Evidence | static: `navItems.tsx` (tab "Account"), `HeaderAuth.tsx` (button "Account menu for <name>"), `HeaderAuth.tsx` guest nav `aria-label="Account"` |

**What:** The tab is named "Account", the avatar button "Account menu for Amina", and the page and menu item "Account settings". A screen-reader user hears no clash by name (the strings differ and the guest "Account" landmark never shows with a session). But a voice-control user saying "click Account" on a phone may match both the tab and the menu button.
**Why it matters:** Small; both stay reachable by the longer name.
**Recommendation:** Accept it, or name the tab "Account settings" in `aria-label` only (visible text stays "Account"; WCAG 2.5.3 label-in-name still holds because the name contains the visible text). Do this only if you want the tab and heading to match for screen readers.

### UI-002: On desktop, /me is two clicks from every page except Home

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | desktop, any page but `/` |
| Lens | heuristic |
| Evidence | static: `navItems.tsx` `HEADER_NAV_ITEMS` |

**What:** The only path is avatar menu, then Account settings (and the Home card). It is the user's explicit choice and AC1 requires it, so this is noted, not a defect. The chevron on the avatar button is the only hint that the menu holds it.

**UI review tier:** static-only; /me entry points (header, tab bar, avatar menu, Home) read in code and tests; 0 screenshots; 0 critical / 0 major / 1 minor (+1 trivial).

## UI manual-verification checklist

- At 375px wide, signed in, open `/`: the tab bar shows Directory, Feed, Account at equal widths, none truncated; tap Account, the tab turns accent-coloured and the page heading reads "Account settings".
- On `/me` at 375px with a dirty form: the save bar sits flush above the tab bar, with no gap or overlap.
- At 1280px: header nav shows only Directory and Feed; the avatar sits at the far right, with no hole where the third link was.
- Open the avatar menu with the keyboard (Enter, then Down): first item is "View profile" (alumni) or "Account settings" (student); Enter on the latter lands on `/me`; the browser tab title reads "Account settings · Alma".
- Home: the third card reads "Account settings" and opens `/me`.
