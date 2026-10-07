# TASK-004 — features/me: page, form, sections, save bar, leave guard

| Field | Value |
|---|---|
| REQ | REQ-010 |
| Tier | 1 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-001, TASK-002, TASK-003 |
| Blocks | TASK-005, TASK-006 |

## Goal

`MePage` renders the full S5 editor behind the lazy boundary with working save, discard, leave guard and toast.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/me/MePage.tsx` + `.module.css` | create |
| `packages/frontend/src/features/me/ProfileForm.tsx` + css | create |
| `packages/frontend/src/features/me/{PersonalSection,EducationSection,CareerSection,PasswordSection}.tsx` + shared `Section.module.css` | create |
| `packages/frontend/src/features/me/{SaveBar,LeavePrompt}.tsx` + css | create |
| `packages/frontend/src/features/me/{useUpdateProfile,useLeaveGuard}.ts` | create |
| `packages/frontend/src/features/me/README.md` | create |

## Approach

- `MePage`: `useCurrentUser`; skeleton, error + Retry, then `ProfileForm` keyed so a refetch does not clobber edits (initialise once, baseline from the saved profile). Tab title 'My Profile'; the heading takes focus on mount only when focus was lost (LESSON-REQ-008-2). Phone top bar and desktop h1 per architecture.
- `ProfileForm`: values, errors, touched, formError; role kind decides sections; error-on-blur, first-invalid focus via flushSync; Discard resets values and errors; Save disabled with loading label while pending; after success baseline = response, password fields cleared, toast shown 4 s.
- `useUpdateProfile`: one `useMutation` as in the architecture (profile call, optional password call, password failure returned not thrown), `onSuccess` setQueryData(['me']) + invalidate ['alumni'] and ['posts'].
- `useLeaveGuard(dirty)`: `useBlocker` + `beforeunload`; `LeavePrompt` Keep editing / Leave; allow navigation to /login when the session is gone.
- Phone layout (ADV-001): `AppShell` sets a CSS custom property `--tab-bar-height` (0 from 48rem); `SaveBar` uses `bottom: var(--tab-bar-height)` and the page bottom padding includes it; add a test or CSS assertion where the repo has a pattern for it.
- Save logic (ADV-003/004/008): use `planSave` (skip the profile PUT when only the password changed); key `ProfileForm` on `user_id` only; baseline in form state replaced from the mutation result; toast and password error owned by the component that owns the mutation; the leave guard also blocks while the save is in flight.
- `useLeaveGuard` (ADV-002): `shouldBlock` reads dirty from a ref and calls `getToken()` synchronously; no block when there is no live token or the target is `/login`.
- CSS Modules, tokens only, 680px column, two-column rows from 48rem, padding below content while the bar shows so it never hides the last field and clears the tab bar on phones. No inline styles.

## Acceptance

- [x] Alumni, student and no-profile accounts show the right sections and fields
- [x] Bar appears only when dirty; Discard restores; Save sends the right bodies; toast shows on success
- [x] Inline errors match the backend; wrong current password lands on that field
- [x] Leave prompt on in-app navigation and Back while dirty; beforeunload only while dirty
- [x] Section order Personal, Education, Career, Password; Mentorship absent by decision
- [x] Password-only change works for a student whose stored profile would fail validation
- [x] Profile saved but password rejected keeps typed password and its error; no remount
- [x] A 401 logout while dirty is not blocked
- [~] On a 390 px screen the save bar sits above the tab bar and neither covers the last field
- [x] README with import rules; typecheck and lint pass

## Notes

No other file may import this folder statically (ADR-08). Keep ARIA: section cards are labelled regions or fieldsets with headings; the toast is a status region; the bar is a labelled region.

**Implementation (2026-10-07, resumed after a rate-limit cut-off).** The first run wrote nearly everything; ProfileForm.tsx turned out complete. This run deleted the stray `zzscratch.test.tsx` (an ad-hoc page-flow check; it passed, and its flows are now in ProfileForm.test.tsx), added `ProfileForm.test.tsx` (18 tests: sections per kind and order, dirty/Discard, blur errors, first-invalid focus, request bodies, server field errors, student password-only, wrong current password, profile-saved-password-rejected with no remount, in-flight Saving..., leave prompt, 401 not blocked, in-flight block then auto-reset, beforeunload, toast timer and dismiss) and `useUpdateProfile.test.tsx` (5 tests: cache write and invalidations, profile skip, password failure returned, profile failure throws and skips password, no cache write once the token is gone), wrote README.md, and fixed two lint errors in `useLeaveGuard.test.tsx`.

**ADV-001 (390 px).** Not test-checked. A CSS-contract test was tried and dropped: under Vitest a `?raw` import of a `.css` file gives an empty module, and `src/` tests have no `fs`. The repo has no pattern for CSS checks, so this is left to TASK-007's screenshots. By hand: `--tab-bar-height` (1px + space-1 + 2*space-2 + 1.25rem + space-1 + caption line + space-2 + space-1/2, about 71px) is the shell's variable, BottomTabs' `min-block-size`, and the save bar's `bottom`. The bar's spacer and the controls' scroll margins use `--save-bar-height`. Risk: if a tab label wraps to two lines the tab bar grows past the variable and the save bar overlaps its top edge.

**Possible follow-up (not done).** `Toast` (TASK-002) mounts its `role="status"` with the text already inside, and ProfileForm remounts it per save (keyed). Some screen readers skip such regions; see CAND-012.

## Related

- Architecture: [[specs/2026-10/m/REQ-010-my-profile-page/architecture]]
- Lessons checked: [[LESSON-REQ-006-3-client-copies-of-api-limits]], [[LESSON-REQ-002-3-must-succeed-steps-inside-mutationfn]], [[LESSON-REQ-009-4-adding-a-lazy-feature-touches-six-lists]], [[LESSON-REQ-007-1-sticky-bottom-bar-needs-scroll-padding]], [[LESSON-REQ-004-2-check-design-colours-against-token-pairs]]
