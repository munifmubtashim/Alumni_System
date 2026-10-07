
## Correctness

Written by: correctness-reviewer (tier: balanced)

Summary: Reviewed 12 changed/new files. Ran the app, about and auth tests (276 pass) and ESLint on touched folders (clean). 0 critical, 0 major, 3 minor. Guest reaches /about without redirect or API calls (route sits outside `RequireAuth`; `useCurrentUser` is disabled with no live token). Biggest gap: the "no API calls" and "signed-in sees the page" claims are not actually asserted by any test.

Dispatch answers: guest/no-redirect: checked, nothing. Route placement: checked, nothing (`router.tsx:97-114`, sibling of the guarded group). Lazy/HydrateFallback: checked, nothing (set on the route object, in both guards). Link correctness: checked, nothing (all use `ABOUT_PATH`). Test quality: CORR-001, CORR-002. A11y landmarks/headings: checked, nothing (one h1, h2 per section, h3 inside; footer nav labelled "Footer").

| ID | Severity | File | Topic |
|---|---|---|---|
| CORR-001 | minor | `app/aboutRoute.test.tsx:16` | "No API calls" is not asserted |
| CORR-002 | minor | `app/aboutRoute.test.tsx` | Signed-in view of /about untested (AC1) |
| CORR-003 | minor | `features/about/AboutPage.tsx:21` | "career history" overstates the profile |

### CORR-001: "Guest makes no API calls" is only a comment

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/aboutRoute.test.tsx:15-23` |
| Category | logic |

**What:** The test comment says no adapter mock is needed, but nothing fails if a request is made. A stray call just errors in the background and the page assertions still pass.
**Why it matters:** The REQ's key promise (guest reaches /about with no API calls) could regress, for example if someone makes `HeaderAuth` fetch without a token, and this suite stays green.
**Recommendation:** In the guest test, install a spy on the axios adapter (or `httpClient.interceptors.request`) that records calls, and assert it was called 0 times after the page renders.

### CORR-002: Signed-in view of /about has no test

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/aboutRoute.test.tsx` |
| Category | logic |

**What:** AC1 says a signed-in user sees the same page inside the normal header. Every test calls `clearToken()`, so only the guest path runs.
**Why it matters:** A change that makes `/about` redirect signed-in users (or break the avatar menu there) would not be caught. Also the spec's planned link assertions in Login/Register tests were done in this route test instead; that is fine, but note no `About` assertion exists in `features/auth/*.test.tsx`.
**Recommendation:** Add one case with a stored token and a mocked `/me` response asserting the avatar menu button shows and the h1 is present at `/about`.

### CORR-003: "career history" overstates what the profile holds

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/about/AboutPage.tsx:21` |
| Category | logic |

**What:** Step 1 says "Add your education, career history, and ...". The profile stores one current company and job title, not a history (Account settings has Career with those fields).
**Why it matters:** AC2 requires every claim to match an existing feature; the copy test only blocks a few banned words, so this passes unnoticed.
**Recommendation:** Reword to "your education, your current role, and whether you're open to mentoring."

## Reflector

Written by: reflector (tier: balanced), dispatched sub-agent.

**Summary:** Checked 50 lessons (0 superseded), gotchas G04/G18/G19/G33 plus a scan of the rest, ADR-08, route-layout concept, frontend component page, and every README that lists lazy pages. Code is clean on all four named gotchas. 4 findings: 0 critical, 0 major, 3 minor, 1 trivial. Biggest: the "six lists" from LESSON-REQ-009-4 were done for 4 of 6; the enforcement test fixtures and several vault and README lists still omit `about`. Dispatch questions: G04 checked, nothing (tokens and `var(--text-*-weight)` used; no `:hover:not()` stacking); G18 checked, nothing (no `hidden` toggles); G33 checked, nothing (footer and auth link use `--ink-secondary`, the footer file says so); G19 checked, nothing (existing banner-scoped nav tests still pass logically; the new footer nav is outside the banner); ADR-08 checked, route, fallback and guard match.

| ID | Severity | Category | Short title |
|---|---|---|---|
| REFL-001 | minor | repeated-mistake | ESLint enforcement fixtures lack `about` |
| REFL-002 | minor | vault-stale | Lazy-feature lists in READMEs and vault omit `about` |
| REFL-003 | minor | vault-stale | ADR-08 and frontend.md say nothing of the fifth (public) lazy page |
| REFL-004 | trivial | concept-drift | Spec promised Login/Register test assertions; none added there |

### REFL-001: ESLint enforcement fixtures lack `about`

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/scripts/enforcement.test.ts:253-312` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-009-4-adding-a-lazy-feature-touches-six-lists]] |

**What:** `eslint.config.js` and `lazyRoutes.test.ts` got `about`, but the lint-rule fixtures in `enforcement.test.ts` (header comment and describe title say "directory, profile, feed, me") have no `about` cases.
**Why it matters:** If the `about` ban in `eslint.config.js` is typo'd or dropped, only `lazyRoutes.test.ts` would catch it; the ESLint copy is unproven. The lesson names this file explicitly.
**Recommendation:** Add `about` rows beside the `me` ones (ban from `src/app/__fixture__`, `../about` from auth; allow dynamic `import('@/features/about/AboutPage')`) and update the title.

### REFL-002: Lazy-feature lists in READMEs and vault omit `about`

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/README.md:6-17`, `packages/frontend/README.md:63-65`, `CLAUDE.md:85`, `.adlc/context/conventions-frontend.md:12` |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]] |

**What:** Four lists of features/paths still stop at `me`: `features/README.md` (no `about/` entry; "Imported by" exception lists four lazy features), `frontend/README.md` structure block (features and config `aboutPath.ts`), `CLAUDE.md` Structure bullet (config list lacks `aboutPath.ts`, features list lacks `about/`), `conventions-frontend.md` ("Today:" list stops at `feed/`).
**Recommendation:** Add `about/` and `aboutPath.ts` to each; add "and `about/`" to the features/README exception. Also add About/`SiteFooter` mention to `features/auth` docs only if `AuthLayout` is described there (the "About Alma" link is new; `features/README.md` auth line describes AuthLayout). `/wrapup` step 1 can apply these. docs likely affected: `ABOUT_PATH`, `LAZY_FEATURES`.

### REFL-003: ADR-08 and component page do not record the fifth lazy page

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/architecture/adr-08-route-code-splitting-and-url-list-state.md:48`, `.adlc/knowledge/components/frontend.md:9,45` |
| Category | vault-stale |
| Vault reference | [[architecture/adr-08-route-code-splitting-and-url-list-state]] |

**What:** ADR-08 amendments go up to "fourth lazy page" (`/me`); `components/frontend.md` has per-REQ bullets through REQ-010 and its intro lists no `/about`, footer, or "About Alma" link. Only `route-layout.md` was updated.
**Why it matters:** ADR-08 is where the next REQ counts lazy pages; it is also the first lazy page that is public (outside `RequireAuth`), a new variant worth one line.
**Recommendation:** needs-decision for `/wrapup` step 3: add an ADR-08 amendment line ("About, REQ-014, fifth lazy page, public, path in `config/aboutPath.ts`") and a REQ-014 bullet in `components/frontend.md` (SiteFooter, About page, `ABOUT_PATH`).

### REFL-004: Planned Login/Register link assertions went elsewhere

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/app/aboutRoute.test.tsx:42-55` |
| Category | concept-drift |
| Vault reference | [[knowledge/gotchas#^g19|G19]] |

**What:** Spec approach promised link assertions in the Login/Register tests. They are in `aboutRoute.test.tsx` instead (full navigation, which is stronger). No change to `LoginPage.test.tsx` or `RegisterPage.test.tsx`.
**Recommendation:** Accept, or note in the REQ that coverage lives in the route test. (2 further trivials not listed: import order in `SiteFooter.tsx` puts `@/config/brand` before `@/config/aboutPath`; the `AppShell.tsx` docblock line now exceeds 100 chars.)
