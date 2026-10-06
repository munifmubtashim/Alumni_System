
## Correctness findings

Written by: correctness-reviewer (tier: balanced)

Summary: read the diff for AppShell, HeaderAuth, MainNav, BottomTabs, navItems, Menu, Avatar, HomePage and the Directory/Home CSS. Checked: duplicate landmarks (nothing: the hidden nav is display:none, so one "Main" nav at a time, labels differ), Directory width regression (nothing: 72rem cap and centring added), Escape/outside click (Base UI default). 0 critical, 0 major, 3 minor. Biggest: empty or whitespace names give a blank greeting and a blank avatar.

### CORR-001: Empty or blank user name gives "Welcome back, " and an empty avatar

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `features/home/HomePage.tsx:26`, `app/AppShell/HeaderAuth.tsx:40,44` |
| Category | logic |

**What:** `firstNameOf` does `.split(/\s+/)[0] ?? name`. For "" or "   " the split returns `['']`, so the `??` fallback never fires and the heading reads "Welcome back, ". The menu label becomes "Account menu for " and the avatar shows no initials.
**Why it matters:** A user with a blank name sees a broken greeting and an empty circle.
**Recommendation:** In `firstNameOf` use `|| 'there'` (or drop the name) when the first word is empty. In `HeaderAuth` use `user?.name.trim() ? ... : 'Account menu'`.

### CORR-002: While /me loads or fails, the account button is an empty circle

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `app/AppShell/HeaderAuth.tsx:40-41` |
| Category | logic |

**What:** With no user, `Avatar name=""` renders no initials, so the trigger is a blank circle (and no chevron on phones). The old trigger said "Account".
**Why it matters:** The button looks broken in the loading/failed state, though Log out still works and the name "Account menu" is correct.
**Recommendation:** Pass a placeholder (e.g. a person glyph) when `user` is undefined, or render a skeleton circle.

### CORR-003: Sticky bottom tab bar can cover the focused element

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `app/AppShell/BottomTabs.module.css:9`, `app/AppShell/AppShell.module.css` |
| Category | logic |

**What:** The tab bar is `position: sticky; bottom: 0` with no `scroll-padding-bottom` on the page. Tabbing to a control near the bottom (Directory pagination, last card) can leave it behind the bar.
**Why it matters:** Keyboard focus hidden on phones (WCAG 2.4.11 Focus Not Obscured). Not confirmed without a browser run.
**Recommendation:** Add `scroll-padding-block-end` equal to the bar height on `html` below 48rem, or confirm in a phone-width keyboard pass.

## Reflection findings

Written by: reflector (tier: balanced), dispatched sub-agent.

**Summary:** Checked 29 lessons (0 superseded), 16+ gotchas (G04, G08, G09, G10 touched), 8 ADRs, 3 concepts, 2 component pages, plus the user-facing docs. No code conflicts with a lesson, gotcha or ADR. 0 critical, 0 major, 5 minor (all doc/vault staleness, needs-decision for /wrapup), 1 trivial. Biggest: `components/ui/README.md` still describes the old Menu, ThemeToggle and Avatar.
Dispatch questions: Menu export style vs G09 checked, nothing (`MenuSeparator` exported flat). Contrast pairs for tab bar and accent underline checked, nothing (`accent`/`surface-raised` and `ink-secondary`/`surface-raised` already pinned in `contrast.test.ts`).

### REFL-001: ui/README.md stale on Menu, ThemeToggle, Avatar

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/components/ui/README.md:15,17,18` |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-002-6-docs-task-lists-every-folder-readme]] |

**What:** Row 15 says `Menu` takes `trigger` and `align` and lists no `MenuSeparator` or `label`. Row 17 says `variant="full"` is the "app header" and compact is "auth pages"; the header now uses compact, so `full` has no caller. Row 18 lists Avatar sizes `md`/`sm` only; `xs` (2rem) is new.
**Recommendation:** Update the three rows. Same Menu line is stale in `packages/frontend/README.md:135` (`Menu, MenuItem, MenuLabel`), and its ThemeToggle/Avatar mentions at lines 15 and 183 are fine.

### REFL-002: route-layout concept diagram shows old header

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/concepts/route-layout.md:15` |
| Category | diagram-stale |
| Vault reference | [[knowledge/concepts/route-layout]], [[architecture/adr-07-root-layout-and-headerless-auth]] |

**What:** The tree says AppShell holds "MainNav, HeaderAuth, full ThemeToggle". Now: MainNav (desktop), compact ThemeToggle, HeaderAuth avatar menu, BottomTabs on phones.
**Recommendation:** Redraw that line at /wrapup step 3. ADR-07 line 19 ("`AppShell` (header ...") is still true; no ADR change needed.

### REFL-003: components/frontend.md lacks REQ-007

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/components/frontend.md:13,16,41` |
| Category | vault-stale |
| Vault reference | [[knowledge/components/frontend]] |

**What:** `app/` bullet does not name `BottomTabs`/`navItems`; `ui/` bullet does not list Menu `label`/`MenuSeparator` or Avatar `xs`; the REQ list ends at REQ-006 and `home/` still reads as a plain `HomePage`.
**Recommendation:** Add the REQ-007 line and those names at wrap-up.

### REFL-004: ADR-01 / ui-primitives lines not rechecked; conventions-frontend `features/` list fine

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/features/README.md:9` |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-002-6-docs-task-lists-every-folder-readme]] |

**What:** `features/README.md` says `home/` is "the signed-in home page"; true but now has quick-link cards (`QUICK_LINKS`). Optional.
**Recommendation:** Add "with quick-link cards for existing pages" if you want parity with CLAUDE.md.

### REFL-005: unused ThemeToggle `full` variant

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/components/ui/ThemeToggle/ThemeToggle.tsx:6` |
| Category | concept-drift |
| Vault reference | [[knowledge/components/frontend]], CLAUDE.md "UI (ADR-01)" line |

**What:** After this change no app code renders `variant="full"` (both shells use compact), yet CLAUDE.md and READMEs still present it as a live option "(words)".
**Recommendation:** Decide at wrap-up: keep it (say "currently unused") or remove it with its test. Not a blocker.

### REFL-006: CLAUDE.md and app/README.md checked

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `CLAUDE.md` UI and Routing bullets |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-001-8-adr-changes-update-claude-conventions]] |

**What:** Checked, accurate. One nit: CLAUDE.md "Frontend structure" line still lists `components/ui/` primitives without noting the shell's tab bar; fine. The "Lazy routes" paragraph still says "Home stays eager", true. (Folded into one entry; no action.)
**Recommendation:** None.

docs likely affected: `Menu` props (`label`), `MenuSeparator`, Avatar `xs`, `ThemeToggle` `full` usage.
