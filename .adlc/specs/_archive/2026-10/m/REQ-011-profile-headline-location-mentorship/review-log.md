# REQ-011-profile-headline-location-mentorship — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Read the full source diff plus UserManager.updateMe, the dist build state and the spec/architecture decisions. 0 critical, 0 major, 1 minor. Counted SQL placeholders against parameter arrays in all four statements (INSERT 13/13, both alumni UPDATEs 13/13): in order, nothing. Biggest: Start year disappears at 200% browser zoom on a desktop window (a decided trade-off, flagged for awareness).
- Year order rule (frontend vs backend): checked, nothing. Same strict `>` (equal years allowed), same "Graduation year" message prefix, only runs after each year passes its own check.
- optionalBoolean: checked, nothing. Omitted is false; null, "true" and 1 are 400; the frontend always sends a boolean for alumni.
- Student path: checked, nothing. `validateStudentFields` ignores alumni-only keys, so bad `start_year` or `mentorship_available` in a student body cannot 400. (A student's bad `graduation_year` used to 400 and is now ignored, which is harmless.)
- SQL / COALESCE / start_year number-vs-string: checked, nothing. `COALESCE(a.mentorship_available,false)` keeps it non-null for students and no-profile accounts; pg returns int4 as a number, and `text()` in the form and `Number()` in AlumniManager cover both ends.
- Owner-only and full-replace PUT: checked, nothing. `updateOwnAlumni` still gates on `user_id`; `updateMe` only touches the caller's row. Omitted fields clear and the switch resets (documented, our client always sends it).
- Form state / dirty / payload / server-error mapping: checked, nothing. A toggle during an in-flight save survives (`current === submittedValues`); `FIELD_PREFIXES` order is safe; a hidden-field error falls back to the form message. `businessLogic/dist` is git-ignored and was already rebuilt (newer than src).

### CORR-001: Start year cannot be edited at 200% zoom on a normal desktop window

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/me/Section.module.css:2070` |
| Category | logic |

**What:** `.wideOnly` is `display: none` below 48rem of CSS pixels, so a 1280px window at 200% zoom (640 CSS px) also loses the Start year input, not only phones.
**Why it matters:** The project rule is "no layout breaks at 200% zoom"; a zoomed desktop user (the people most likely to zoom) cannot change Start year, and a server error on it only says to use a wider screen. Value is kept and sent unchanged, so nothing is lost.
**Recommendation:** Accepted by spec (open question 2, "desktop only"). If you want it closed, show Start year at every width (drop the `@media` rule) and delete `HIDDEN_FIELD_HINT` handling; otherwise leave it.

**References:** requirement.md AC8 and open question 2; architecture risk table row on hidden Start year.

## Quality findings

Written by: quality-reviewer (tier: balanced)

**Summary:** Read the full source diff (51 files), plus the CLAUDE.md, conventions-api, README and test diffs (routes, ProfileForm, AlumniCard, ProfileHeader). 0 critical, 0 major, 2 minor, 1 trivial. Duplicated limits (frontend copies of HEADLINE/LOCATION/DEGREE_MAX): checked, nothing, they are the documented hand copies (L-REQ-006-3) and the file header names them. Tokens-only CSS: checked, nothing (rem sizes follow Avatar's precedent). Test quality: checked, nothing; the route tests run the real managers and assert what reaches the query. Biggest: the profile README says the badge is a `Tag`, but the code builds its own pill.

### QUAL-001: Profile README says the badge is a `Tag`; it is a custom span

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/profile/README.md:9`, `ProfileHeader.tsx` badge span |
| Category | documentation |
| Rule | CLAUDE.md / L-REQ-010-5 (docs match the code) |

**What:** README line 9 calls the badge "a `Tag`"; `ProfileHeader.tsx` renders its own `<span className={styles.badge}>` with a dot svg and success tokens, no `Tag`.
**Why it matters:** A reader will look for the `Tag` primitive and the success tone that does not exist there.
**Recommendation:** Change README:9 to "a sage pill (`.badge`, success-soft)". Architecture also said "reusing Tag"; no code change needed if the custom pill is intended.

### QUAL-002: Location pin inherits the phone-hidden `.icon` rule

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/profile/ProfileHeader.tsx` (pin svg, `cx(styles.icon, styles.pin)`), `ProfileHeader.module.css` (`.icon` in `@media (width < 48rem)`) |
| Category | convention |
| Rule | n/a (CSS reuse) |

**What:** The pin reuses `.icon`, whose rule hides it below 48rem with a comment saying it is the LinkedIn icon. The pin vanishes on phones, and the CSS comment (pin is "decorative ink-muted") does not say so.
**Why it matters:** If S3 phone shows the pin, this is a design miss; if it does not, it is an accident hidden by a shared class. No test covers it (jsdom has no CSS).
**Recommendation:** Give the pin its own size class (no `.icon`), or extend the media-query comment to say the pin is hidden on phone by design and check against S3-Phone.

### QUAL-003: Redundant wrapper around `onCheckedChange` in Switch

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/components/ui/Switch/Switch.tsx:1170` (packet line) |
| Category | dead-code |
| Rule | n/a |

**What:** `onCheckedChange={(next) => { onCheckedChange(next); }}` only forwards its argument (it drops Base UI's second `eventDetails` arg, which may be the intent for lint).
**Why it matters:** Reads like an oversight.
**Recommendation:** Pass `onCheckedChange` directly, or add a one-line comment saying why the wrapper drops the second argument.

(No convention-gap findings.)

### Round 2

**Summary:** QUAL-001 resolved (README now says own sage pill, not a `Tag`, pin from 48rem). QUAL-002 resolved (`.locationPin` own class, hidden under 48rem on purpose, CSS and TSX comments say so). QUAL-003 resolved by keeping the wrapper and documenting why (forwards only the boolean). Fix diff reviewed (ProfileForm hidden-field handling, AlumniDTO init object, tests): 0 new findings. Checked: message joins read cleanly ("... start year. Open My Profile ..."), no stray `cx` import left, blur and server-error paths both go through `withOrderHint`.

## Architecture findings

Written by: architecture-reviewer (tier: balanced)

**Summary:** Checked all 22 non-test source files plus the 004 migration, the token change (`npm run tokens:check` passes) and the shared types. 0 critical, 0 major, 3 minor. Layering holds (SQL only in `dal/query`, validation in the Manager layer, `Switch` imports only Base UI, lazy features do not import each other). The biggest point is two DTO-building styles in `AlumniManager.createAlumni`.
Dispatch hints: layering and import boundaries, checked, nothing. Token addition, checked, nothing (in `tokens.json`, `tokens.css` is current, pairs are in `contrast.test.ts`). API contract and optional-in-types, ARCH-002. Migration order, checked, nothing (documented in the 004 header, conventions-api.md and the risk table; additive and idempotent). Followed architecture.md, checked, no deviations found.

### ARCH-001: Two ways of building an AlumniDTO

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/AlumniManager.ts:36-40`, `packages/backend/src/dal/dto/AlumniDTO.ts:21-30` |
| Category | pattern |
| Rule broken | DTO convention in CLAUDE.md (plain classes, constructor-based) |

**What:** `createAlumni` now builds the DTO with `Object.assign(new AlumniDTO(userId), {...f, ...})`. The constructor still takes eight positional fields and knows none of the five new ones, so the class has two construction paths.
**Why it matters:** The next field has to be added in the class body and in the spread, and a typo in `f` is not caught, because `Object.assign` accepts any key. The type check no longer covers the DTO's shape here.
**Recommendation:** Either pass the fields as one typed object to the constructor, or have `AlumniQuery.createAlumni` take `AlumniEditableFields` plus `user_id`, as `updateAlumni` already does. Pick one; do not keep both.
**References:** `packages/backend/src/dal/query/AlumniQuery.ts` (`updateAlumni` takes `AlumniEditableFields`)

### ARCH-002: Shared types are looser than the API they describe

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/shared/src/types/alumni.types.ts:+17,+46`, `packages/backend/src/dal/dto/RegisterDTO.ts:+63` |
| Category | contract |
| Rule broken | CLAUDE.md "Shared types": keep the shared and backend shapes in sync by hand |

**What:** `mentorship_available?` is optional in `Alumni` and `MyProfile` although the API always sends it. `start_year` is a number on `Alumni` but a string on `MyProfile`. `MyProfileRow` types `headline`/`location`/`degree` as `string` while its comment says they are null for students.
**Why it matters:** Each reader must repeat `=== true` (three sites: `AlumniCard`, `ProfileHeader`, `toValues`). The number/string split copies the existing `graduation_year` split, so a future field will copy it again. The reason (old fixtures) is stated and accepted in architecture.md, so this is low.
**Recommendation:** Make `mentorship_available` required on the response types once fixtures are updated (follow-up, not this REQ). Change the three `MyProfileRow` fields to `string | null`.
**References:** `.adlc/specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture.md` (types decision)

### ARCH-003: Form error placement reads computed CSS

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/frontend/src/features/me/ProfileForm.tsx:+60-66,+115-118` |
| Category | separation |
| Rule broken | ADR-04 (controlled state, pure validators); architecture.md "CSS for width, no media-query hook" |

**What:** `showFieldError` calls `getComputedStyle` up the DOM tree to decide whether the Start year field is hidden by the 48rem CSS rule. A JS behaviour now depends on a CSS Module breakpoint it cannot name.
**Why it matters:** jsdom does not load CSS Modules, so the test cannot exercise the real path. If the `.wideOnly` rule changes or moves, the form silently goes back to focusing a hidden input. It is guarded by the order message sitting on Graduation year, so the live risk is small.
**Recommendation:** Keep it, but add a one-line comment naming `Section.module.css` `.wideOnly` as the other half, and confirm the width check was done in the TASK-009 screenshots. If a second hidden-by-width field ever appears, switch to a `matchMedia` hook instead.
**References:** architecture.md risk table row on hidden Start year

(No other findings; 0 trivials not listed.)

### Round 2

**Summary:** ARCH-001 and ARCH-003 are resolved; ARCH-002 stays open by design (accepted in architecture.md). 0 new findings.
- ARCH-001 resolved: `AlumniDTO` takes one typed `AlumniDTOInit` (user_id plus the 12 stored columns), so a misspelt key is a compile error. The only real caller is `AlumniManager.createAlumni`; the two test callers use the new form; `TestManager.ts:43` is commented-out code; `dal/index.ts` export unchanged; `UserQuery` does not construct it. The manager test asserts `instanceof AlumniDTO`. SQL and layering unchanged.
- ARCH-003 resolved: `.wideOnly` is now named in `ProfileForm.tsx` and `Section.module.css`, each pointing at the other, with the matchMedia fallback noted.
- New fix diff checked, nothing: hint wiring (`withOrderHint`, hidden errors on the form) and the `.locationPin` split stay inside `features/`; `Switch` change is a comment only.

## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 45 lessons (0 superseded), 38 gotchas, 9 accepted ADRs, 5 concept pages and the frontend component page against the diff. 0 critical, 1 major, 1 minor (both vault-stale, both for /wrapup). Biggest: ADR-04 still records My Profile as "up to 12 fields" with no REQ-011 outcome, although the form is now about 17 controls. Dispatch: ADR-04/features README in scope? ADR-04 yes (REFL-001), features/README no (REFL-002). Re-derivation, repeated mistakes, gotcha breaches (G18, G33, G38 all respected; L-REQ-006-3 comments present; L-REQ-010-1 cache key `['alumni']` still covers directory and profile): checked, nothing. Docs likely affected: none beyond the two below.

### REFL-001: ADR-04 not updated for the 17-control My Profile form

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `.adlc/architecture/adr-04-forms-without-a-library.md` (Consequences table) |
| Category | vault-stale |
| Vault reference | [[architecture/adr-04-forms-without-a-library]], [[knowledge/lessons/LESSON-REQ-010-4-adr-revisit-trigger-is-decided-at-the-architect-gate]] |

**What:** ADR-04's revisit trigger is "a form passes ~8 fields"; its REQ-010 row says "up to 12 fields". REQ-011 took the form to about 17 controls and stayed with controlled state, but only CLAUDE.md records that (line 90). The ADR does not.
**Why it matters:** L-REQ-010-4 exists because this exact decision was made silently once. The ADR is the page the next architect reads.
**Recommendation:** Needs-decision at /wrapup step 3: add a row to ADR-04 Consequences: "REQ-011: ~17 controls, stay; ProfileForm grew again (hidden-field error routing); revisit on dynamic field arrays or shared rules in `@alumni/shared`." The code is right; the vault is stale.

### REFL-002: features/README.md Home line omits My Profile (not this REQ's doing)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | trivial |
| File | `packages/frontend/src/features/README.md:9` |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]] |

**What:** Says Home has quick links for "the directory and the feed"; CLAUDE.md lists three, including My Profile. The line was last touched in REQ-009, so REQ-010 missed it.
**Why it matters:** REQ-011 did not change Home, so it is out of scope for fix rounds. Fix in the same /wrapup doc pass, one-word change, no code.
**Recommendation:** Change to "the directory, the feed and My Profile". Optionally widen L-REQ-010-5's saw-it-in list.

## UI/UX findings

Written by: ui-reviewer (tier: balanced)

**Summary:** No browser tool (no Chrome MCP, no Playwright or Chrome binary) was available, so this ran static-only plus API health checks; no account was created and no data touched. I read the Switch, MentorshipSection, Personal/Education sections, ProfileForm, validation, profileErrors, useUpdateProfile, ProfileHeader, format and AlumniCard against AC8-AC12, AC15. 0 critical / 0 major / 2 minor. Dirty state, validation mirroring, server-400 field mapping, cache refresh after save, kind-gating (student/no-profile never see the new fields) and empty hiding all read correct. Biggest: the year-order error on phones points at a field the user cannot see.

### UI-001: Year-order error on phones names a hidden Start year

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/me` at under 48rem, change Graduation year |
| Lens | interaction-state |
| Evidence | static: `features/me/Section.module.css:43`, `features/me/validation.ts:48`, `features/me/ProfileForm.tsx:53-58` |

**What:** The rule lands on Graduation year (visible), so `showFieldError` never adds `HIDDEN_FIELD_HINT`. The user reads "Graduation year can't be before the start year" with no Start year on screen and no way to see or change it.
**Recommendation:** When this message is shown and Start year is hidden, append the same hint ("Open My Profile on a wider screen...") or show the stored start year read-only on phones. Needs a browser to confirm wording.

### UI-002: Hidden Start year can hold an error nobody sees

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/me` phone, Save |
| Lens | interaction-state |
| Evidence | static: `ProfileForm.tsx:228-238`, `:268` (`setErrors(plan.errors)` stores every field's error) |

**What:** Save stores errors for all fields, including the display:none Start year, but only the first invalid field is surfaced. If an earlier visible field is also invalid, the hidden one is silent until the next Save. Stored values come from the API so this is rare.
**Recommendation:** Low priority; filter `plan.errors` to fields not hidden, or surface hidden ones on the form alert.

### Dispatch questions (one line each)
- Switch by keyboard / screen reader (AC10): checked statically, nothing. Base UI native button with role=switch, `<label htmlFor>` name, `aria-describedby` help text, focus-visible ring; Space/Enter toggle. Not run with a real screen reader.
- Dirty state: checked, nothing. Switch counts via `isProfileChanged`, toggling back clears it; payload always sends `mentorship_available` for alumni.
- Server 400 on the right field: checked, nothing. Headline, Location, Degree, Start year, Graduation year prefixes map in `profileErrors.ts`; the Mentorship message falls to the form alert, which cannot occur from the switch.
- Unsaved prompt: unchanged from REQ-010 (`useLeaveGuard`), switch is part of `dirty`.
- Student / no-profile: checked, nothing. `FIELDS` and `hasMentorship` gate the new fields and the card, and the PUT body omits them.
- Empty states and directory Mentor tag: checked, nothing. Header, `educationLine` and `AlumniCard` hide each part when empty; tag only on `=== true`.
- AC9 refresh: checked, nothing. `useUpdateProfile` invalidates `['alumni']`, `['posts']`, `['feed']`.

**UI review tier:** static-only (no browser available) - /me, /alumni/:id, /directory read from source, API health 200 and Vite 200; 0 screenshots; 0 critical / 0 major / 2 minor.

### Round 2

Written by: ui-reviewer (tier: balanced). Static tier, read the fix diff and its three new tests.
UI-001 and UI-002 are resolved; the `.locationPin` change is correct. 0 new critical/major/minor, 1 trivial.

- UI-001 resolved: `withOrderHint` (ProfileForm.tsx:~176) swaps in `YEAR_ORDER_HIDDEN_MESSAGE` on save, blur and server-error paths; the Start-year clear path matches both texts. Message reads "...start year. Open My Profile on a wider screen to change it." (tested).
- UI-002 resolved: ProfileForm.tsx:~310-330 puts every hidden-field error on the role=alert with the hint, and focuses the first shown invalid field. Alert is announced by its role, focus is on the field, so no double announcement; focus goes to the alert only when all errors are hidden.
- Pin: `.locationPin` hidden below 48rem, aria-hidden, sized and `flex:none`; matches S3 phone. Nothing wrong.
- Trivial (not blocking): the form alert keeps its "wider screen" text if the window is widened after Save; it clears on the next Save or Discard.

**UI review tier (round 2):** static-only; ProfileForm, Section.module.css, ProfileHeader; 0 screenshots; 0 critical / 0 major / 0 minor.


## UI manual-verification checklist
1. `/me` as an alumni, 1280px: Headline beside name, Location, Degree beside University, Start year beside Graduation year, Mentorship card; Tab to the switch, press Space, see "Unsaved changes", Space again, bar disappears.
2. Same at 375px: Start year absent; set Graduation year below the stored start year, Save, check the message makes sense (UI-001).
3. VoiceOver on the switch: announces "Available for mentorship, switch, off/on" plus the help text.
4. Enter 121 characters in Headline, tab out: inline error; Save is blocked.
5. Toggle mentorship, Save, open `/alumni/<id>` and `/directory` without reload: badge and "Mentor" tag appear; toggle off, both go.
6. Log in as a student and as an admin: no Headline, Location, Degree, Start year, or Mentorship card.
7. A profile with none of the new values looks as before.
