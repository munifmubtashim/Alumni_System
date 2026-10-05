# REQ-002-auth-login-register — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Read all 38 non-test, non-CSS source files in the diff (auth services, SessionBridge, guards, hooks, both pages, validation, redirect, header, router) and checked the 401 flow, token/cache lifecycle, open-redirect guard, and validation against the spec. 0 critical, 0 major, 3 minor. No injection, auth-bypass or redirect hole found: `resolveFrom` blocks `//`, `/\` and the auth pages, and the 401 handler correctly ignores login/register and stale-token 401s. Biggest: login silently does nothing when localStorage is blocked (CORR-001).

### CORR-001: Login/sign-up "succeeds" silently when localStorage is unavailable

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/services/authToken.ts:5523-5530` (setToken), `useLogin.ts:4638` |
| Category | error-handling |

**What:** `setToken` swallows a storage failure, then notifies; `getLiveToken` re-reads storage and gets null, so `GuestOnly` never redirects.
**Why it matters:** In a browser with blocked storage the server call succeeds (an account is even created on sign-up), but the user stays on the form with no message and no busy state.
**Recommendation:** Have `setToken` return a boolean (or throw) and have `useLogin`/`useRegister` `onSuccess` surface "Couldn't save your session, check browser storage settings" via the page's form error. Alternatively keep an in-memory fallback token in `authToken.ts`.

### CORR-002: Token that expires between requests is dropped without a notice and left in storage

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/services/authToken.ts:5592-5596`, `guards.tsx:3825` |
| Category | logic |

**What:** `getLiveToken` is a pure read, so once `exp` passes (minus 10s) any re-render of `RequireAuth` redirects to `/login` with no "session expired" notice, and the dead token stays in localStorage. Cleanup only runs once, on SessionBridge mount.
**Why it matters:** The spec's expiry message appears only on a 401. A user idle past the 1-hour expiry who clicks anything that re-renders gets bounced with no explanation. The stale token is still sent by the request interceptor until the next login.
**Recommendation:** Add a timer in `SessionBridge` that, at `exp - leeway`, runs the same path as the 401 handler (clear token, set `'expired'`). Or on re-render in `RequireAuth`, call the shared expire function instead of only navigating.

### CORR-003: Manual logout may carry `state.from` into the next login (unconfirmed)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/auth/useLogout.ts:4661-4664`, `guards.tsx:3826` |
| Category | logic |

**What:** `clearToken()` makes a mounted `RequireAuth` render `<Navigate to="/login" state={{from}}>`, while `useLogout` also calls `navigate('/login', {replace})` with no state. Which one lands last depends on render/navigation ordering.
**Why it matters:** If the guard's navigation wins, the next person to log in on this tab (any user) is sent to the previous user's last page instead of home.
**Recommendation:** To confirm, add a test: log out from a protected page, then log in, and assert the user lands on `/`. If it fails, pass `state: null` is not enough; set a "logging out" ref that makes `RequireAuth` render nothing, or have `useLogout` navigate first and clear the token after.

**Dispatch questions:** none beyond the spec checks above. Spec AC checked: 401 vs login-401 handling (ok), expired-on-load (ok), cache clear on token change incl. cross-tab (ok), double-submit guard (ok), focus-first-invalid (ok).

### Round 2 re-review

Written by: correctness-reviewer (round 2). Ran `vitest src/features/auth src/services`: 9 files, 162 tests pass.

**Summary:** All three round-1 findings are resolved. No new correctness problems in the fix; 0 critical, 0 major, 0 minor. One trivial note on a timer-versus-render race (below).

| ID | Status | Evidence |
|----|--------|----------|
| CORR-001 | resolved | `setToken` returns `false` and notifies nothing on a storage failure, so state is not half-set. `useLogin`/`useRegister` throw `TokenNotSavedError` from `mutationFn`; `mapAuthError` maps it to a form message (a distinct "account was created, log in" text for sign-up). |
| CORR-002 | resolved | `SessionBridge` arms one timer per token at `exp - 10s`, the same threshold as `isTokenExpired`, and fires `expireSession`, the same path as the 401 handler. Session test: token cleared, notice `'expired'`, at `/login` with `from`. |
| CORR-003 | resolved (test is meaningful) | The new test logs out from the header menu on `/`, asserts `location.state` has no `from`, then logs in and lands on `/`. The `from` assertion is the strong one, since `from="/"` would also land on home. Only `/` is protected today, so a deeper-page case can't be built yet. |

**Checked for new problems, nothing found:**
- Timer leaks: the effect cleanup clears the timer and unsubscribes. `watch` clears the old timer on every token change, and an unchanged token value keeps its timer. Tested: unmount means no expiry, and a new token means the old expiry is ignored.
- Double firing: `expireSession` calls `clearToken`, which notifies `watch`, which sees `null` and clears the timer. The callback also re-checks `getToken() === token`.
- Racing a 401 or a logout: whichever clears the token first wins. The other sees a changed token. The 401 handler's `requestToken === getToken()` check and the timer's token check both hold. Logout clears the token, and `watch` cancels the timer.
- Re-arm: a delay capped at 2^31-1 ms re-arms when it fires early. If a throttled timer fires slightly early, it re-arms with delay >= 0 and does not loop.
- Effect re-run: if `navigate` changed, cleanup then `watch()` re-arms, so there is no leak under StrictMode.
- Focus: `formErrorRef`, `focusField` and `?.focus()` are null-safe. `onError` passed to `mutate` does not run after unmount. `flushSync` inside `onError` renders the Alert before the focus call.
- `isTokenExpired` is unchanged in behaviour: a null expiry means expired, and `<= now` equals the old `exp*1000 <= now + leeway`.

**CORR-004 (trivial, optional): the expiry timer can read `from` as `/login`**
If a re-render of `RequireAuth` lands in the gap between the expiry threshold and a late-firing timer (background-tab throttling), the guard has already redirected to `/login`. `expireSession` then stores `from=/login`, which `resolveFrom` rejects, so after login the user goes home instead of back. The notice still shows. No security effect. Acceptable as is.

**Packet-gap:** `review-packet.md` — the "Diff with full context" block was empty (the diff was never embedded), so I read the diff via `git diff HEAD` and the two files `useLogout.ts` and `guards.tsx`.

## Quality findings

Written by: quality-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Reviewed all 74 files via the packet (code and tests), plus conventions.md and the folder READMEs. 0 critical, 0 major, 5 minor, 1 trivial. Biggest: the services/ and store/ READMEs still list only the old files, and `ButtonLink` has no test file of its own. Conventions followed well: file layout, SCREAMING_SNAKE constants, `Atom` suffix, `import type`, no console/TODO/commented-out code, tests co-located, HTTP mocked at the adapter only. Dispatch questions: none beyond the standard checklist; no new env vars, so `.env.example` is not affected.

### QUAL-001: services/ and store/ READMEs are stale

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/services/README.md:3`, `packages/frontend/src/store/README.md:3` |
| Category | documentation |
| Rule | conventions.md, Frontend: "Each src/ folder has a README.md with its own rules" |

**What:** services/README says the folder holds only `httpClient.ts` and `authToken.ts`; `authApi.ts` is missing, as are the new 401 handler and token `subscribe`/`isTokenExpired`. store/README does not mention `sessionNoticeAtom`.
**Why it matters:** The READMEs are the per-folder import rules the next REQ reads first.
**Recommendation:** Add `authApi.ts` and `sessionNoticeAtom.ts` to the two Purpose lines; one sentence each on the 401 handler and token subscription.

### QUAL-002: ButtonLink has no test file of its own

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/components/ui/Button/ButtonLink.tsx:1` |
| Category | test-coverage |
| Rule | conventions.md, Testing: "co-located, `Button.tsx` -> `Button.test.tsx`" |

**What:** `ButtonLink` is a new exported primitive. It is only touched inside `Button.test.tsx` (and indirectly via HeaderAuth), with no `ButtonLink.test.tsx`.
**Why it matters:** Its own contract (renders an `<a>` with `data-variant`, merges `className`, forwards `to`) is not pinned in a file a reader would look for.
**Recommendation:** Move or add the link cases in `Button/ButtonLink.test.tsx`; confirm the existing cases in `Button.test.tsx` actually cover variant and className.

### QUAL-003: Two different `ROLE_LABEL` constants, plus a third role-to-text map

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/auth/RegisterPage.tsx:21`, `packages/frontend/src/app/AppShell/HeaderAuth.tsx:7` |
| Category | naming |
| Rule | none (clarity) |

**What:** `ROLE_LABEL` means the text "I am a..." in RegisterPage but a role-to-display-name map in HeaderAuth; `HomePage.tsx:5` adds `ROLE_PHRASE` with the same keys.
**Why it matters:** Same name, different meaning, so a future import of the wrong one type-checks only by luck. The role names (Student, Alumni, Admin) are also written twice.
**Recommendation:** Rename the RegisterPage one to `ROLE_GROUP_LABEL`. Optionally put one `roleDisplayName` map in `features/auth` and have HeaderAuth use it.

### QUAL-004: Login and register pages repeat the same form plumbing

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/frontend/src/features/auth/LoginPage.tsx:39-77`, `packages/frontend/src/features/auth/RegisterPage.tsx:67-113` |
| Category | duplication |
| Rule | none (ADR-04 allows no form library but does not forbid a small helper) |

**What:** `handleChange`, the `flushSync(setErrors...)` then focus-first-invalid block, and the ref-per-field map are written twice, and will be again for the next form.
**Why it matters:** A fix to the focus or announce order (a deliberate a11y detail) has to be made in every form.
**Recommendation:** Not urgent. When a third form arrives, extract a `useAuthForm`-style helper in `features/auth`; for now, note it in ADR-04's "revisit" line.

### QUAL-005: `features/auth/index.ts` exports far more than other features use

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/auth/index.ts:1-24` |
| Category | convention |
| Rule | features/README.md (public surface of a feature) |

**What:** The barrel re-exports validators, error mappers, message constants, `AuthLayout`, `resolveFrom` and both pages. Outside the folder only the router, AppShell, HeaderAuth and HomePage import from it (guards, pages, SessionBridge, `useCurrentUser`, `useHasSession`, `useLogout`).
**Why it matters:** Wide barrels make internals look like API and make later renames breaking.
**Recommendation:** Drop exports with no importer outside `features/auth` (validation, authErrors, AuthLayout, resolveFrom, `useLogin`, `useRegister`, `CURRENT_USER_QUERY_KEY` if unused). Tests can import from the files directly.

### QUAL-006: Stale ADR number in authToken.ts header (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/services/authToken.ts:1`, `packages/shared/src/types/user.types.ts:36` |
| Category | documentation |
| Rule | none |

**What:** The header still cites ADR-02 for the token store, which now also holds the live-token and subscription logic of ADR-03. `AuthResponse` is marked "kept for compatibility" but has no importer in the repo.
**Why it matters:** Misleading pointer; an unused type invites reuse of the wrong login shape.
**Recommendation:** Cite "ADR-02, ADR-03"; delete `AuthResponse` (or add a `@deprecated` tag) if the backend does not import it.

(0 further trivials not listed)

## Architecture findings

Written by: architecture-reviewer (tier: balanced)

**Summary:** Checked 74 changed files (services, store, ui primitives, features/auth, features/home, app shell/router, shared types, docs) against ADR-01..04, the layering lint rules in `components/ui/README.md` and `features/README.md`, and the backend response shapes. 0 critical, 0 major, 2 minor, 1 trivial. Layering holds: services has no app/store/feature imports (401 hook is registered, not imported), ui imports only react-router and Base UI, features never import app. Biggest: client validation rules are a hand-kept copy of backend rules with no shared source.
Dispatch questions: none given.

### ARCH-001: Validation rules duplicated from the backend, no shared source

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/frontend/src/features/auth/validation.ts` |
| Category | contract |
| Rule broken | ADR-04 (accepts mirroring); CLAUDE.md "Shared types ... keep in sync manually" |

**What:** Email pattern, 8-char/72-byte password, name/university/department limits and the year window are copied from the backend's validation.ts, and the same limits are not exported from `@alumni/shared`.
**Why it matters:** A backend rule change silently makes the form accept or reject the wrong input. Tests pin the frontend copy only, so they cannot notice drift.
**Recommendation:** Accepted for now under ADR-04. Follow-up: export the limits (constants, no runtime logic) from `@alumni/shared` and import them in both packages. Needs its own REQ/ADR since shared has "no runtime code".
**References:** [[architecture/adr-04-forms-without-a-library]], CLAUDE.md "Shared types"

### ARCH-002: Folder READMEs for `services/` and `store/` not updated

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/services/README.md`, `packages/frontend/src/store/README.md` |
| Category | pattern |
| Rule broken | CLAUDE.md "each folder has a README with its import rules" |

**What:** `authApi`, the 401 hook in httpClient, `subscribe/getLiveToken` in authToken, and `sessionNoticeAtom` are absent from those READMEs (grep for authApi / sessionNotice finds nothing). TASK-007 listed only other READMEs.
**Why it matters:** These READMEs are where the "services never import app" rule and the registration pattern are explained; the new 401 hook is the one place that rule is easy to break.
**Recommendation:** Add one line each: authApi (endpoint functions only), the `setUnauthorizedHandler` registration pattern, and sessionNoticeAtom.
**References:** [[knowledge/lessons/LESSON-REQ-001-4]], ADR-03

### ARCH-003: `features/auth` barrel exposes internals and pulls pages into the shell

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/features/auth/index.ts:1-24` |
| Category | separation |
| Rule broken | features/README.md (public API via index) |

**What:** The barrel re-exports message constants, `mapLoginError`, `validate*`, `toRegisterInput`, `AuthLayout` and both pages. `AppShell` and `HeaderAuth` import the same barrel, so the header's code path depends on the page modules.
**Why it matters:** Extra public surface other features may start using (e.g. `AuthLayout`), and a heavier import for the shell.
**Recommendation:** Keep exported only what `app/` and `features/home` use (guards, SessionBridge, hooks, pages); import tests' helpers by relative path.
**References:** `packages/frontend/src/features/README.md`

**Checked, nothing:** API contract (login returns `{token}`, register `{token,user}`, matches UserController/AuthRoutes and the new shared types); test architecture (axios mocked at adapter as in REQ-001); `ButtonLink` importing react-router (allowed by lint and architecture); handler singleton and SessionBridge mount inside outer error layer (consistent with L-REQ-001-7). **Packet-gap:** none.


## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 9 lessons (0 superseded), 7 gotchas, 4 accepted ADRs, 1 concept, 1 component page, 1 Mermaid diagram (architecture data-flow, matches the code). 2 findings: 0 critical, 0 major, 2 minor (both vault-stale, both go to /wrapup step 3). Code follows ADR-01 to ADR-04 and lessons 4, 5, 7, 8, 9. The biggest issue is that the `decisions.md` catalog still lists ADR-03 as proposed. 7 candidates appended to `lesson-candidates.md` (CAND-001 to CAND-007).
Dispatch questions: follow-ups (services/store/app READMEs, 565 kB bundle) - agree with routing, already tracked as CAND-T7; the 565 kB bundle is not a vault matter. Docs likely affected: `AppShell` header description, and `{ index: true, element: null }` home route (now HomePage).
G04 (`:where()` on hover): checked, nothing; Button uses `:where`, Menu trigger hover has no focus-border rule to hide. G05 (radio focus): checked, SegmentedControl uses `:focus-visible` and `[data-checked]`.

### REFL-001: decisions.md still lists ADR-03 as proposed

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/decisions.md:9` |
| Category | vault-stale |
| Vault reference | [[architecture/adr-03-frontend-session-and-401-handling]] |

**What:** The ADR file says `Status: accepted, Decided 2026-10-05`, but the catalog row says `proposed`, with no decided date.
**Why it matters:** CLAUDE.md says a `proposed` ADR is not in effect. A future reflector or architect reading the catalog could skip the 401 rule.
**Recommendation:** In `/wrapup` step 3, change that row to `accepted | 2026-10-05`. Also confirm `now.md` line 15 (a stale REQ-002 "review / worktree D:/repos/myapp" row, which looks like leftover template text) is removed.

### REFL-002: frontend component page and vault have no record of auth

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/components/frontend.md:8-16` |
| Category | vault-stale (also missing-vault-page) |
| Vault reference | [[knowledge/components/frontend]] |

**What:** The page says the app "renders only the shell" and lists primitives as Button, Input, Card, Tag, ThemeToggle, services as httpClient and authToken, one feature (`theme/`), and ADR-01 and ADR-02 only. The diff adds `features/auth`, `features/home`, `authApi`, `sessionNoticeAtom`, Alert, ButtonLink, Menu, SegmentedControl, and ADR-03 and ADR-04.
**Why it matters:** This is the page the next REQ reads first. `features/auth` (about 25 files, public exports) also has no component or concept page for the session flow; CLAUDE.md and conventions.md carry it, the knowledge layer does not.
**Recommendation:** At `/wrapup` step 3, update the page's structure, status ("current as of REQ-002") and ADR links. Add `knowledge/components/auth.md` or `concepts/session-and-401.md` (token store, SessionBridge, guards, redirect-back) and link ADR-03 and ADR-04. Likewise bump `concepts/design-tokens.md` if `--error` contrast pairs were added to it.

## UI/UX findings

Written by: ui-reviewer (tier: balanced)

**Summary:** Drove the real app (Brave headless over CDP) through login, sign-up, session, guard, header menu and home, in light/dark at 1280, 640, 360 and 320 px. Every UI AC passed on screen; 0 critical, 0 major, 1 minor, 1 trivial. Biggest: a failed login drops keyboard focus to the page top. Dispatch questions: 401 message and password clear, checked, nothing; 409 link to login, checked, nothing; double submit (login and register each sent exactly 1 request), checked, nothing; keyboard user menu (Enter opens, focus on Log out, Esc returns to trigger, ArrowDown opens), checked, nothing; guest to /login and back, only `/` is protected so return-to was only proven for `/`.

### UI-001: Focus falls to the page top after a failed login or network error

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/login`, submit that returns 401, 503 or no connection |
| Lens | a11y |
| Evidence | `ui-evidence/login-401.png`, `login-fail.png`; `document.activeElement` is `body` after the response |

**What:** Submit sets the button to `disabled` while busy (`Button.tsx` `disabled={... || loading}`). A focused button that becomes disabled loses focus, and nothing puts it back. After 401 the password is cleared but focus is on `body`, not the password field. Register 409 does move focus to email (good); register 400 leaves focus on the button.
**Why it matters:** A keyboard or screen-reader user who pressed Enter restarts from the top of the page. The alert is announced, so this is not a blocker.
**Recommendation:** In `LoginPage.tsx`, on 401 focus the password input (it was just cleared); on network/5xx focus the submit button or the alert. Optionally use `aria-disabled` plus a click guard in `Button` for the busy state so focus is never dropped.

### UI-002: Header wraps to three rows at 320 px

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | all pages at 320 px wide |
| Lens | responsive |
| Evidence | `ui-evidence/register-320-dark.png` |

**What:** Brand, Log in / Sign up, and the theme toggle stack into about 170 px of header. No overflow or clipping (scrollWidth equals viewport at 320, 360 and 640). Passes the 360 px and 200% zoom ACs; this is polish only.

**Checks that passed (evidence in `ui-evidence/`, 30 screenshots):** labels on every field; empty and bad-email errors inline with `aria-invalid` + `aria-describedby`, focus on first invalid field, `role=alert` on form errors; 401 shows "Email or password is incorrect", email kept, password cleared; 503 and refused connection show "Couldn't reach the server, try again" and the form re-enables; busy button is `disabled` + `aria-busy`; register shows Student fields by default, Alumni hides department and year; year range 2026 to 2034 enforced; 201 lands on "Welcome, Amina Test / You're signed in as a student"; 409 shows the message on email with "Log in instead" link; backend 400 text shows on the form; reload keeps session; signed-in `/login` and `/register` redirect home; forged token gives 401 on `/api/me`, then `/login` with "Your session has expired, please log in again" (role=status); expired or malformed token is dropped silently; logout clears the token and goes to `/login`. No console errors or exceptions in any run. Note: a second open tab holding a rejected token clears the shared token, which is the intended cross-tab behaviour.

**Test accounts created (throwaway, left in local Postgres):** `ui-review-1791216146823@example.test` (student).

**UI review tier:** headless (Brave via CDP, no Playwright) - `/login`, `/register`, `/` , header menu, session/401/expiry paths; 30 screenshots; 0 critical / 0 major / 1 minor (+1 trivial).


### Round 2 re-review

Written by: ui-reviewer (tier: balanced). Tier: headless (Brave via CDP; the 5173 dev server started and stopped by me, your API on :3000 left running). Server replies (401, 400, 409, 503, refused connection) were faked with CDP request interception; the regression pass used the real API.

**Summary:** UI-001 is resolved. m1 and m2 behave as intended on screen. Quick regression passed. 0 critical, 0 major, 0 minor new findings, no console errors or exceptions. 15 screenshots in `ui-evidence/round-2/`.

**UI-001: resolved.** Focus after each failed submit (`document.activeElement`):
- Login 401: password field, now empty, email kept (`login-401.png`).
- Login 503 and refused connection: the form Alert (`role=alert`), password kept.
- Sign-up 409: email field, `aria-invalid=true` (`reg-409.png`).
- Sign-up 400, 503 and refused connection: the Alert.
- Double submit: first click disables the button; a second click, `requestSubmit()` and Enter sent no extra request. Login and sign-up each made exactly 1 request.

**m1: resolved.** With `Storage.prototype.setItem` throwing, a login that the server accepted stays on `/login`, shows the Alert "Couldn't save your sign-in. Check that your browser allows site storage, then try again.", and focuses it (`m1-login-storage-blocked.png`). Sign-up stays on `/register` and shows "Your account was created, but we couldn't save your sign-in. Check that your browser allows site storage, then log in." (`m1-register-storage-blocked.png`).

**m2: resolved.** A token with `exp` 25 s ahead loaded `/` signed in (one mocked `/api/me`, no 401). About 15 s later (exp minus the 10 s leeway) the page went to `/login` with "Your session has expired, please log in again" (`role=status`), and `localStorage.token` was null. Only the timer fired this; no request got a 401 (`m2-signed-in-before-expiry.png`, `m2-expired-notice.png`).

**Regression:** sign-up success lands on `/` ("Welcome, Round Two"); header menu Log out goes to `/login` and removes the token; logging in again lands on `/`. UI-002 (320 px header) is untouched this round and still trivial.

**Test-method note (not an app bug):** a second tab left open on the same origin holds the shared token, so it reacts to storage changes made by my test (it redirected and cleared a hand-set token). This is the cross-tab behaviour from round 1. If you test the expiry timer by hand, use one tab.

**Test account created (throwaway, left in local Postgres):** `ui-review-r2-1791217487280@example.test` (student). Round 1's account was not reused.

**UI review tier:** headless (Brave via CDP) - `/login`, `/register`, `/`, header menu, expiry timer; 15 screenshots; 0 critical / 0 major / 0 minor new.
