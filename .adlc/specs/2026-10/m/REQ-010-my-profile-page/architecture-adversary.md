# Architecture adversary — REQ-010-my-profile-page

Written by: architecture-adversary (tier: balanced), dispatched sub-agent

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| Trigger | ui-surface |
| Verdict | found problems |

## Summary

Read the spec (14 ACs), architecture, 8 tasks, and checked `UserQuery.updateMyProfile`, `validation.ts`, `UserManager.updateMe`, `SessionBridge`, `HeaderAuth`, `Menu`, and `eslint.config.js`. 8 findings: 0 critical, 3 major, 5 minor. Biggest: a profile-validation failure (for example an expired student year) blocks a password-only change, because Save always runs the full-replace `PUT /api/me` first. Checked, nothing: PUT /me omitted-field clearing (the plan sends every shown field plus `photo_url`, which matches the DAL), numeric/Date shapes (`MyProfile` years are strings; `toValues` only needs `String()`), menu name flicker (`setQueryData(['me'])` updates the menu in the same tick), alumni with null graduation_year (optional in the backend).

## Findings

### ADV-001: Save bar and phone BottomTabs have no agreed offset

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | omission / ux-consistency |
| Where | `architecture.md` §Save bar and leave warning; TASK-004 CSS bullet |

**What:** Both the bar and `BottomTabs` are `position: sticky; bottom: 0` (`BottomTabs.module.css:10`). The architecture says the bar "sits above the phone BottomTabs" but names no mechanism. The tab height is not a token or CSS variable, and `features/` cannot import `app/`.
**Why it matters:** The bar sits in `main`, so its `bottom: 0` is the viewport bottom, the same place as the tabs. On a phone the bar and tabs overlap and Save/Discard are covered or untappable. Refutation tried: the bar could simply stack above the tabs. A sticky element in `main` does not know the tabs exist, so that only holds with an explicit offset.
**Recommendation:** Have `AppShell` expose the tab height as a CSS custom property (for example `--bottom-tabs-height`, 0 from 48rem). The bar uses `bottom: var(--bottom-tabs-height, 0)`, and the page padding uses the same value. Name this in the architecture and TASK-003/004, and add the property to the AppShell files list.

### ADV-002: Leave guard versus 401 logout is a one-line rule that is easy to get wrong

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | failure-mode |
| Where | `architecture.md` §Risks (useBlocker and 401); TASK-004 `useLeaveGuard` |

**What:** `expireSession()` calls `clearToken()` and then `navigate('/login', { replace, flushSync })` in the same tick. If the blocker's decision reads React state (`useHasSession`, `useLiveToken`), that state has not re-rendered yet. The logout is then blocked: the user sees "Leave without saving?" with no token and an empty cache. Worse, `SessionBridge` runs `queryClient.clear()` on the token change, so `['me']` vanishes and `MePage` flips to skeleton or error underneath the prompt.
**Why it matters:** The session-expiry timer takes the same path, so the user is stuck on a dead page with a misleading prompt.
**Refutation tried:** "The guard allows /login when no token remains" is in the plan. It does not say how the token is read, and state-based reading fails at exactly this moment.
**Recommendation:** In `shouldBlock`, call `getToken()` from `services/authToken` synchronously and return false when it is null or the target is `/login`. Say so in TASK-004, and add a test: dirty form, 401 or expiry, lands on `/login`, no prompt. Also state that edits are intentionally lost on forced logout.

### ADV-003: Save always runs PUT /api/me first, so unrelated profile problems block a password-only change

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | omission / failure-mode |
| Where | `architecture.md` §Save = one mutation; `validation.ts` rules; spec AC "Save sends PUT /api/me ... then" |

**What:** The plan validates the whole form and PUTs the full profile even when only the password fields changed. `validateStudentFields` requires department and an expected year from this year to this year + 8. A student whose stored year is now in the past (for example 2026 after 1 Jan 2027), or whose department is null (legacy row), cannot save anything, including a password change. The same applies if the stored `photo_url` (re-sent by `toInput`) fails `optionalWebUrl`: the error lands on the form-level Alert with no field to fix, and the form is stuck.
**Refutation tried:** The client mirrors the backend, so the rejection is "correct". But the user's goal (change the password) needs none of those fields, and the plan itself created the coupling by always sending the profile.
**Recommendation:** If no profile field differs from the baseline, skip `PUT /api/me` and call only `changePassword`, and validate only the password fields in that case. Pin it with a test. Map "Photo URL ..." errors to the form-level Alert with plain wording. State in the architecture that a student with an out-of-range stored year must fix it to save profile edits.

### ADV-004: Where the baseline lives, and what "keyed" means, is undecided; a remount would wipe the partial-failure state

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | omission |
| Where | TASK-004 `MePage` ("keyed so a refetch does not clobber edits") vs architecture §Partial save |

**What:** After the profile PUT succeeds, `setQueryData(['me'], profile)` changes the data `MePage` reads. If the form is keyed on anything derived from that data (`updated_at`, the object), it remounts. The typed password fields, the password-section error, and any toast state held in the form are lost. The partial-failure AC ("error shows on the password section", "password fields stay") then fails. If instead the baseline is derived live from `['me']`, a window-focus refetch silently resets dirty state mid-edit.
**Refutation tried:** TASK-004 says "initialise once, baseline from the saved profile" and "after success baseline = response", which implies baseline in form state. But the key is not stated, and the toast is placed "in the page" (architecture) while the baseline resets in the form.
**Recommendation:** State: `ProfileForm` is keyed on `user_id` only; baseline is form state set from the first load and from each save response; refetches of `['me']` do not touch it. Put the toast state and the password error in the same component that owns the mutation result. Add a TASK-006 test: profile OK, password 400, then fields, error and bar all still present.

### ADV-005: Server-error field mapping by "label prefix" does not match the UI labels

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | contradiction |
| Where | `architecture.md` §Server errors; TASK-001 |

**What:** Backend messages start with "Bio", "Company", "Job title", "Photo URL". The UI labels are "About" and (per S5) "Current role". Prefix-by-label misses them, and TASK-001 also copies "Bio must be at most 2000 characters" into the client message under an "About" field.
**Recommendation:** Use an explicit table (Name→name, University→university, Department→department, Graduation year→graduation_year, Expected graduation year→expected_graduation_year, Bio→bio, Company→current_company, Job title→job_title, Experience→experience, LinkedIn URL→linkedin_url, Current password→current_password). Decide the client wording for About/Company/Current role and test the mapper against every backend message.

### ADV-006: Task text contradicts the code on two integration points

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | contradiction / testability |
| Where | TASK-001 Notes; TASK-003 Approach |

**What:** (a) TASK-001 says features/me "may not import features/auth", but the architecture imports `useCurrentUser` from it, and `eslint.config.js` only bans the three lazy features. `auth` is not lazy, so the import is legal; the note will make the implementer copy code needlessly or doubt the architecture. (b) TASK-003 says "reuse however MenuItem navigates today", but `MenuItem` has only `onSelect: () => void` (`Menu.tsx:43`), with no link support. `HeaderAuth` needs `useNavigate()`.
**Recommendation:** Rewrite both notes. Say which auth helpers are exported (`index.ts` exports `UNREACHABLE_MESSAGE`; the password-byte helper is not exported, so copy that one rule or export it).

### ADV-007: Spec criteria without a verifying step

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | omission |
| Where | AC "Works from 360px and at 200% zoom, in light, dark and system"; AC "Home quick-links gain a My Profile entry" |

**What:** TASK-007 shoots 1440 and 390 only, light and dark only. 360px, 200% zoom and system theme have no task. The Home card is titled "Update your profile", while the AC asks for a "My Profile" entry (the card link text/name should match, or the AC be amended).
**Recommendation:** Add 360px, 200% zoom and a system-theme check to TASK-007 acceptance; settle the Home card title at the gate.

### ADV-008: Leaving during an in-flight save loses the outcome

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | failure-mode |
| Where | `architecture.md` §Save bar ("not while a save is in flight") |

**What:** The guard is off while saving, so the user can navigate away mid-save. The page unmounts; the hook's `onSuccess` cache update still runs, but the toast and any password-step error are in unmounted state. A rejected password change then disappears silently.
**Recommendation:** Keep the guard on while saving (prompt text can say "Saving…"), or disable in-app navigation during the save. Pick one and test it.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback (frontend only, no schema: nothing to roll back beyond a revert), contradiction/testability, UX and design consistency.
- **Lenses skipped:** cross-repo (single repo).
- **Acceptance-criteria coverage (spec has 14 bullets, in order):** route/lazy checked; query/skeleton/Retry checked; sections checked; role fields checked (ADV-003); validation checked (ADV-005); save bar checked (ADV-001); leave guard checked (ADV-002, ADV-008); save sequence and partial failure checked (ADV-003, ADV-004); server errors checked (ADV-005); cache refresh checked, nothing; menu/nav/Home checked (ADV-006, ADV-007); layout checked; tokens/360px/zoom checked (ADV-007); tests checked; screenshots checked (ADV-007).
