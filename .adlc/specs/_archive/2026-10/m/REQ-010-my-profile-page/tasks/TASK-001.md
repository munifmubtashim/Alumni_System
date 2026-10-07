# TASK-001 — Validation, mapping, error mapper and API functions

| Field | Value |
|---|---|
| REQ | REQ-010 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system |
| Depends on | none |
| Blocks | TASK-004 |

## Goal

The pure logic behind the form exists and is tested: values, validation matching the backend, dirty check, request body, server error mapping, and the two API functions.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/me/validation.ts` | create |
| `packages/frontend/src/features/me/validation.test.ts` | create |
| `packages/frontend/src/features/me/profileErrors.ts` | create |
| `packages/frontend/src/features/me/profileErrors.test.ts` | create |
| `packages/frontend/src/services/authApi.ts` | edit (add `updateMyProfile`, `changePassword`) |
| `packages/frontend/src/services/authApi.test.ts` | edit or create |

## Approach

- `profileKind(profile)` → 'alumni' | 'student' | 'none' (alumni wins, as in UserManager.updateMe). `toValues(profile)` (strings, null/undefined → ''). `validateProfile(values, kind, now?)` returning field errors in form order with the backend messages (name required ≤100, university ≤150, department ≤100 and required for students, year 4 digits 1900 to now+10, expected year now to now+8 required for students, company/job title ≤100, bio ≤2000, experience ≤5000, LinkedIn http(s):// ≤255, NUL character rejected). Limits as exported constants.
- `validatePasswordChange(values)`: checks only when any of current/new/confirm is filled; new 8 chars min and 72 UTF-8 bytes max (reuse the wording from auth/validation; do not import across features: copy the two helper rules or move shared ones to `config/` only if two places need them and note it), different from current, confirm matches.
- `isDirty(values, baseline, passwordTouched)`, `toUpdateInput(values, kind, photoUrl)` (trim, send every shown field and the stored `photo_url`, never `email`), `toPasswordInput`.
- `planSave(values, baseline, kind)` → whether the profile call is needed (any profile field differs) and whether the password call is needed; when no profile field changed, only password fields are validated (ADV-003).
- `mapProfileError(error)` uses an explicit prefix table: Name, University, Department, Graduation year, Expected graduation year, Company, Job title, LinkedIn URL, Experience, Bio, Photo URL, Current password, New password (ADV-005); → `{ form?, fields? }` with field keys by message prefix, 'Current password is incorrect' → `current_password`, network/5xx → shared unreachable text, 401 ignored (ADR-03).
- `authApi.ts`: `updateMyProfile(input): Promise<MyProfile>` (PUT /me), `changePassword(input): Promise<void>` (PUT /me/password).

## Acceptance

- [ ] Each rule and message has a test, with `now` injected for year ranges
- [ ] `toUpdateInput` always includes the stored `photo_url`, never `email`; hidden role fields are never sent
- [ ] `isDirty` is false for untouched values including null-vs-empty, true for a changed field or any typed password field
- [ ] `planSave` tests: password-only change skips the profile call and ignores invalid unchanged profile fields
- [ ] Error mapper tests cover field, form, network, 5xx and 401
- [ ] Typecheck, lint and tests pass

## Notes

features/me MAY import features/auth (only directory, profile, feed are banned from importing each other; confirm in eslint.config.js) so reuse its password rule instead of copying. Error text strings must equal the backend's.

**Implementation notes (2026-10-07, task-implementer):**

- Confirmed in `eslint.config.js`: `LAZY_FEATURES` is directory, profile, feed only, so `features/me` may import `features/auth`. `profileErrors.ts` imports `UNREACHABLE_MESSAGE` and `UNEXPECTED_MESSAGE` from `@/features/auth`.
- Deviation: the password rule and the limits are copied, not imported. `features/auth/validation.ts` exports its constants but `auth/index.ts` does not, nothing in `src/` deep-imports another feature's file, and `newPasswordError` is private with "Password ..." wording, while the backend says "New password ..." here. Widening `auth/index.ts` was outside this task's files.
- Deviation: `isDirty(values, baseline, kind, password)` takes `kind` (only shown fields count) and the password values (any non-empty field counts) instead of a `passwordTouched` flag. `planSave(values, baseline, kind, password, now?)` returns `{ saveProfile, savePassword, errors }`, profile errors only when a profile field changed (ADV-003), errors in form order.
- Extra exports for TASK-004: `profileFields(kind)` (shown fields in form order: name, bio, university, department, graduation_year or expected_graduation_year, job_title, current_company, linkedin_url, experience; `none` = name, university), `hasPasswordInput`, `isProfileChanged`, `EMPTY_PASSWORD_VALUES`, `PASSWORD_FIELDS`, types `ProfileValues`, `PasswordValues`, `MeField`, `MeErrors`, `SavePlan`.
- `toUpdateInput` sends empty shown fields as `''` (the server clears them; same as omitting). `photo_url` is sent only when the stored value is a string.
- `mapProfileError(error, visible?)`: a field message whose field is not in `visible` goes to the form. "Photo URL ..." gets `PHOTO_URL_MESSAGE` (plain wording, draft; review at the verify gate). Confirmation mismatch is client-only: "Passwords don't match" (draft wording).
- Client-side the confirmation is checked whenever any password field is filled; the backend never sees it.

## Related

- Architecture: [[specs/2026-10/m/REQ-010-my-profile-page/architecture]]
- Lessons checked: [[LESSON-REQ-006-3-client-copies-of-api-limits]], [[LESSON-REQ-002-3-must-succeed-steps-inside-mutationfn]], [[LESSON-REQ-009-4-adding-a-lazy-feature-touches-six-lists]], [[LESSON-REQ-007-1-sticky-bottom-bar-needs-scroll-padding]], [[LESSON-REQ-004-2-check-design-colours-against-token-pairs]]
