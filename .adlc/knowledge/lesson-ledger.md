# Lesson ledger

<!-- GENERATED from knowledge/lessons/ — do not hand-edit.
     Rebuilt (whole file) by /wrapup, /task, /bugfix, /recover, and /config migrate,
     from each lesson's header lines only:
       grep -h '^# \|^| ID \|^| Tags \|^| Severity \|^| REQ \|^> \*\*STATUS: superseded' knowledge/lessons/LESSON-*.md
     This file carries merge=union in .adlc/.gitattributes: a parallel merge can leave a
     duplicated row. That is expected — the next rebuild clears it. A merge conflict here
     is resolved by rebuilding, never by hand. -->

One row per lesson file. Title is the H1 without its `^L…` anchor. Superseded lessons render as `~~ID~~` with `→ LESSON-…` after the title. Order: legacy `LESSON-NNN` ascending, then `LESSON-<WORK_ID>-<n>` by work ID, then `<n>`.

| ID | Title | Tags | Severity | REQ |
|---|---|---|---|---|
| LESSON-REQ-001-1 | Pick toolchain majors by plugin peer ranges, not by "latest" | toolchain, typescript, eslint, vitest | guideline | REQ-001 |
| LESSON-REQ-001-2 | After a major React bump in a workspace, prove there is one React copy | npm-workspaces, react, dependencies | trap | REQ-001 |
| LESSON-REQ-001-3 | Vitest 5 Node-side tests: per-file environment comment, DOM-safe setup, and live in scripts/ | vitest, testing, typescript | guideline | REQ-001 |
| LESSON-REQ-001-4 | Import-boundary lint must match the documented boundaries, with a fixture per boundary | eslint, architecture, import-boundaries | trap | REQ-001 |
| LESSON-REQ-001-5 | Keep component styling in CSS Modules — inline styles bypass the token lint | css, design-tokens, linting | guideline | REQ-001 |
| LESSON-REQ-001-6 | When fixing contrast for one use of a token, sweep every use and pin the pairs in the contrast test | accessibility, contrast, design-tokens | guideline | REQ-001 |
| LESSON-REQ-001-7 | Put page-level errorElement on a path-less child route, and build routes from a factory | react-router, routing, error-handling | guideline | REQ-001 |
| LESSON-REQ-001-8 | When an ADR changes a convention, update CLAUDE.md conventions in the same REQ | adr, conventions, docs | guideline | REQ-001 |
| LESSON-REQ-001-9 | Guard Jotai storage atoms against throwing storage; test reload with resetModules | jotai, state, testing | trap | REQ-001 |
| LESSON-REQ-002-1 | Act on a 401 only when the failed request's token is the current token | auth, session, http | guideline | REQ-002 |
| LESSON-REQ-002-2 | Keep session snapshots pure reads, and end time-based expiry with a timer that runs the normal expire path | auth, session, react | trap | REQ-002 |
| LESSON-REQ-002-3 | Put must-succeed client steps inside `mutationFn` and never swallow a storage write failure | auth, forms, tanstack-query | trap | REQ-002 |
| LESSON-REQ-002-4 | Login and sign-up mutations only store the token; one guard owns where the user goes next | auth, routing | guideline | REQ-002 |
| LESSON-REQ-002-5 | Take redirect-back targets only from in-app `location.state`, validated to one leading `/` | auth, routing, security | critical | REQ-002 |
| LESSON-REQ-002-6 | A REQ's docs task must list every folder README, component page and catalog row the code touched | docs, vault, process | guideline | REQ-002 |
| LESSON-REQ-002-7 | After a failed async submit, move focus to the field or alert — a disabled busy button drops it | forms, a11y | guideline | REQ-002 |
| LESSON-REQ-003-1 | Mock workspace packages partially — keep AppError, DTOs and validators real | backend, testing, vitest | trap | REQ-003 |
| LESSON-REQ-003-2 | Protect at the router, and prove it with a test that walks the app | backend, auth, api, testing | guideline | REQ-003 |
| LESSON-REQ-003-3 | When you change error handling in a controller, move every handler in that file to the shared helper | backend, api, errors | guideline | REQ-003 |
| LESSON-REQ-003-4 | A package tested through a source alias needs a typecheck that includes its tests | backend, testing, typescript, build | guideline | REQ-003 |
| LESSON-REQ-003-5 | Declare a dependency in the workspace that imports it, not only at the root | npm-workspaces, dependencies, backend | nice-to-know | REQ-003 |
| LESSON-REQ-004-1 | Mount app-wide effects in a path-less root layout, never inside one shell | frontend, routing, session, auth | trap | REQ-004 |
| LESSON-REQ-004-2 | Check a design's colour choice against the real token pair before using it | frontend, design-tokens, accessibility, contrast | guideline | REQ-004 |
| LESSON-REQ-004-3 | When code moves between layers, grep the ADRs and context pages for its old home in the same change | adr, docs, architecture | nice-to-know | REQ-004 |
| LESSON-REQ-005-1 | Paged list endpoints: single-value query checks, a stable order, a separate count, `{ items, total }` | backend, api, pagination, validation | guideline | REQ-005 |
| LESSON-REQ-005-2 | Mocked query tests never run the SQL: check new SQL once against a real database | backend, testing, sql, postgres | trap | REQ-005 |
| LESSON-REQ-006-1 | An input that mirrors a URL param must track its own last write | frontend, url-state, debounce, search | trap | REQ-006 |
| LESSON-REQ-006-2 | A list that swaps to skeletons on every query change strands keyboard focus | frontend, accessibility, focus, pagination | trap | REQ-006 |
| LESSON-REQ-006-3 | A client copy of an API's validation limits needs a pointer to its source | frontend, backend, validation, api | guideline | REQ-006 |
| LESSON-REQ-007-1 | A sticky bottom bar needs a matching scroll-padding, or focus lands behind it | frontend, accessibility, focus, layout, phone | guideline | REQ-007 |
| LESSON-REQ-008-1 | A detail page keys its query by the route id and shows the error view only when it has no data | frontend, tanstack-query, detail-page, routing | trap | REQ-008 |
| LESSON-REQ-008-2 | Move focus to a page heading only when focus is on the body or on a node that left the page | frontend, accessibility, focus, routing | trap | REQ-008 |
| LESSON-REQ-008-3 | Hand state between two lazy features through one config/ contract that validates on read, and test it by clicking through | frontend, routing, router-state, config, adr | guideline | REQ-008 |
| LESSON-REQ-008-4 | Give each lazy feature its own import ban and guard check, each exempting only its own folder | frontend, eslint, lazy-routes, adr | guideline | REQ-008 |
| LESSON-REQ-008-5 | Decide at architect time how to match a design that uses the browser default line height | frontend, design-system, stylelint, tokens | guideline | REQ-008 |
| LESSON-REQ-008-6 | Helpers copied between lazy features need a decided shared home and a tracked follow-up, not a code comment | frontend, lazy-routes, duplication, tests | guideline | REQ-008 |
| LESSON-REQ-009-1 | Link a person to their profile with the alumni id, and check which id a route takes before planning the link | frontend, api, routing, alumni, profile | trap | REQ-009 |
| LESSON-REQ-009-2 | Undo only what the mutation wrote, and let the settle check count itself and ignore paused writes | frontend, tanstack-query, optimistic, adr-09 | guideline | REQ-009 |
| LESSON-REQ-009-3 | Offset-paged lists need an id tie-break in the query and offsets taken from the server page lengths | api, frontend, pagination, tanstack-query | guideline | REQ-009 |
| LESSON-REQ-009-4 | Adding a lazy feature means editing six places, and the vault copies have no check | frontend, lazy-routes, eslint, docs, vault | guideline | REQ-009 |
| LESSON-REQ-010-1 | When one feature changes data another feature caches, take the other feature's real query keys and test against a real cache | frontend, tanstack-query, cache, lazy-routes | trap | REQ-010 |
| LESSON-REQ-010-2 | A route guard that owns a query's loading and error state makes the page's own states unreachable; guard on `data === undefined` | frontend, auth, guards, tanstack-query | guideline | REQ-010 |
| LESSON-REQ-010-3 | Gate a leave prompt on the blocker state and on the current reason to block, because `blocker.reset()` lands a render later | frontend, react-router, forms, tests | trap | REQ-010 |
| LESSON-REQ-010-4 | When an ADR names a "revisit at X" trigger, the REQ that reaches X records the outcome in that ADR at its architect gate | vault, adr, process, forms | guideline | REQ-010 |
| LESSON-REQ-010-5 | A new nav entry or menu item means grepping every README for the old entry list, not only the lazy-page counts | frontend, docs, navigation, vault | guideline | REQ-010 |
