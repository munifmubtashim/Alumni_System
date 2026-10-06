# Architecture adversary — REQ-006-alumni-directory-page

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| Trigger | new-adr, ui-surface |
| Verdict | found problems |

## Summary

Checked 15 ACs, 11 tasks, ADR-08, the real router/guards/AppShell/ESLint/Stylelint code, the REQ-005 validators and the React Router 8.4 source. 6 findings: 0 critical, 2 major, 4 minor (3 trivials not listed). Biggest: the debounced search box and the URL "re-sync from outside" rule can undo Back and Clear all, and nothing in the plan says how that is avoided.

Dispatch questions, one line each:
- RR8 `lazy` + `HydrateFallback`: works only if `HydrateFallback` is a static property of the `directory` route itself (ADV-003). Existing `RequireAuth` wiring and tests are unaffected (lazy only matches `/directory`).
- Base UI Popover focus: finding ADV-002.
- `useSearchParams` + debounce loop: finding ADV-001.
- ESLint/Stylelint (G04, G10, hex, inline SVG): checked, nothing. Inline SVG is already used (ThemeToggle, Logo) and no rule bans it; `@media (width >= 48rem)` matches existing CSS; 22px/20px values are covered by "nearest token".
- AC with no task: none. AC12 is manual by design (accepted); AC3 is weakly checked (ADV-004).
- Page-past-end and 401: past-end planned (small gap, ADV-005); 401 path planned and the existing handler covers it, checked, nothing.
- Worktree build: ADV-006.
- Phone nav in header only: ADV-006 (documentation gap, not a design flaw).

## Findings

### ADV-001: Debounced search box vs URL re-sync can undo Back and Clear all

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | failure-mode |
| Where | `architecture.md` §URL as state; `tasks/TASK-008.md` Approach; `tasks/TASK-002.md` |

**What:** The plan has local text, a 300 ms `useDebouncedValue`, a write-to-URL effect, and a "re-sync box from URL when `q` changes from outside" effect, but never says how the two effects tell their own writes from outside ones.
**Break scenario:** User has `q=abc`, presses Back (URL `q=ab`) or clicks Clear all. Re-sync sets the box to `ab` / empty, but the debounced value still reads `abc` for up to 300 ms. The write effect sees `debounced !== urlQ` and replaces the URL with `abc`. Back is undone, or the search returns after Clear all, with the chips gone.
**Why it holds up:** I tried "just depend on `[debounced]` only". That fails the repo's `react-hooks` v7 lint (exhaustive-deps), so the natural implementation puts `urlQ` in the deps and hits the loop. Tests listed only cover "external `q` change updates the box", not that it stays.
**Also:** `setFilters` builds from the render-time `searchParams`; a pending typed `q` is dropped by an Apply click in the same window, then re-applied later and resets page to 1.
**Recommendation:** State the rule in TASK-008: schedule the URL write from the input's change handler with a cancellable timer, and cancel it (and set the box) on any external `q` change. Add tests: Back while a debounce is pending, Clear all while pending, Apply while pending.

### ADV-002: Keyboard focus is lost after Apply and chip removal; Popover API cannot close itself

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | ux-consistency |
| Where | `tasks/TASK-004.md`, `tasks/TASK-008.md`, spec AC14 |

**What:** TASK-004 defines `Popover` as trigger plus panel with no `open`/`onOpenChange` or close function, yet FilterPopover must close after Apply. And an inactive pill trigger becomes a chip once its filter is set.
**Break scenario:** Keyboard user opens "Department", types, presses Enter. The panel must close, but the primitive has no way to be told. When it does close, Base UI returns focus to the trigger, which has just been replaced by a chip, so focus drops to `<body>`. Same on pressing a chip's remove button: the button is unmounted and focus is lost; screen-reader users restart from the top of the page.
**Why it holds up:** I tried "Base UI returns focus to the trigger". The trigger is unmounted by the design's own pill-to-chip swap, so there is nothing to return to. No task or test mentions focus after these two actions.
**Recommendation:** Give `Popover` a controlled `open`/`onOpenChange` and have FilterPopover close it on Apply. Decide where focus goes (after Apply: the new chip's remove button; after remove: the matching pill trigger, or the search box) and add a test for each. Verify Base UI 1.8's initial-focus default for a popup holding an input (pointer vs keyboard open) when writing the primitive test.

### ADV-003: `HydrateFallback` placement is unspecified; wrong placement blanks or replaces the shell

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | omission |
| Where | `architecture.md` §Lazy route; `tasks/TASK-010.md` |

**What:** Router source (`react-router/dist/development/lib/hooks.js:739-780`): while a matched route still has unresolved `lazy`, rendering is cut at the nearest route with a `HydrateFallback`, else to `renderedMatches[0]` (RootLayout) with a "No HydrateFallback" warning and a null body.
**Break scenario:** Implementer puts `HydrateFallback` on the lazy object's return value (not yet loaded) or on the root route: a direct visit to `/directory` shows no header, or an empty page, until the chunk loads. Separately, a click on the nav link from Home shows nothing at all while the chunk loads (fallback only applies on first load), and a failed chunk fetch lands in `RouteError` with no reload advice.
**Why it holds up:** The fallback works as designed only when set statically on the `directory` route object itself; the plan does not say so, and tests (memory router, instant import) would pass either way.
**Recommendation:** In TASK-010 say: `HydrateFallback` is a static property of the `directory` route (inside the shell's `<main>`). Add a test that renders `/directory` before the import resolves and sees the shell plus "Loading…". Note the no-feedback client navigation as accepted, or add a pending cue.

### ADV-004: AC3 is only checked by hand; the guard test covers `app/` only

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | testability |
| Where | spec AC3; `tasks/TASK-010.md`; `architecture.md` §Test strategy |

**What:** The "separate chunk, none in the entry chunk" check is a manual `npm run build` plus "record the file names in the task notes". The guard test reads only `src/app/**`.
**Break scenario:** A later REQ adds `import ... from '@/features/directory'` in `features/home` or a feature barrel. The guard stays green, the build still succeeds, and the page quietly joins the entry chunk.
**Why it holds up:** I tried "ADR-08 forbids it". It forbids it in prose; the only enforcement is a test that does not look in `features/`, and the build check runs once.
**Recommendation:** Widen the guard to scan all of `src/` (excluding `features/directory` itself and tests) for static imports of `features/directory`, or add an ESLint `no-restricted-imports` pattern for it. If a build assertion is wanted, a small `scripts/` test over `dist` (as `scripts/**` tests already exist) is cheap.

### ADV-005: URL parser does not mirror every API 400, and two display states are unspecified

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | omission |
| Where | `tasks/TASK-002.md`; `tasks/TASK-009.md`; spec AC7, AC10 |

**What:** (a) The API 400s on a NUL byte in text (`validation.ts` `optionalText`); the parser rules list lengths, not NUL. A shared link `?q=%00` sends the request, gets 400 and shows the error state with a Retry that can never succeed. (b) The search box has no `maxLength`; typing 101 chars is silently dropped by the parser and the box shows text that is not applied. (c) The count line is undefined while loading and for page-past-end (`total > 0`, no items), where "Showing a–b" would read "Showing 121–108".
**Why it holds up:** I checked the API: `parseAlumniSearch` throws on NUL and over-length after trim; the parser's "ignore invalid" promise (AC7) is only as good as that mirror. The empty-state variant exists but its heading row does not.
**Recommendation:** Drop values containing `\u0000` in the parser; set `maxLength` (100 / 100 / 150) on the inputs; specify the count text for loading (hide or "Loading") and past-end (hide, or show "N alumni").

### ADV-006: Worktree install ordering, `.env`, and the phone deviation are under-documented

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | `architecture.md` §Work path, §Design fidelity; `tasks/TASK-010.md`, `TASK-011.md`, spec AC12 |

**What:** (1) "Run `npm install` first" appears in the architecture and in TASK-010, but TASK-001 to TASK-009 (tiers 0 to 2) need it too. Until then Node resolves upward into the main checkout's `/Users/munifmubtashim/Alumni_System/node_modules` (it exists), whose `@alumni/shared` links to the main checkout without the REQ-005 types: typecheck fails or, worse, tests run against the wrong packages. (2) `.env` is gitignored, so the worktree has none; TASK-011's API run needs DB vars and `JWT_SECRET`. (3) The phone header link is a flagged deviation, but the "known deliberate differences" list in TASK-011 and architecture omits it, along with the "Directory" vs "Alumni Directory" heading, so AC12 ("matches S2-Phone") cannot literally pass. At 360px the header now holds brand, nav, user menu and theme toggle, so it wraps to up to 3 rows (more at 200% zoom).
**Why it holds up:** The install risk is already named, but only as a TASK-010 step; the nested-directory resolution fallback is not mentioned anywhere. The AC12 contradiction is real in the documents; the design itself (header link) is reasonable.
**Recommendation:** Make `npm install` a stated precondition of Tier 0. Say that TASK-011 needs `.env` copied from the main checkout (user action) or uses the stub. Add the bottom tab bar and phone heading to the known-differences list, amend AC12 wording, and add a 360px / 200% header check to TASK-006's acceptance.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, contradiction/testability, ux-consistency, rollback (frontend-only, no data or schema: a revert of the branch undoes it; nothing found).
- **Lenses skipped:** cross-repo (single repo).
- **Acceptance-criteria coverage:** AC1 checked, AC2 checked, AC3 checked (ADV-004), AC4 checked, AC5 checked (ADV-001), AC6 checked (ADV-002), AC7 checked (ADV-005), AC8 checked, AC9 checked (ADV-005), AC10 checked (ADV-005), AC11 checked, AC12 checked (ADV-006), AC13 checked, AC14 checked (ADV-002, ADV-006), AC15 checked.
