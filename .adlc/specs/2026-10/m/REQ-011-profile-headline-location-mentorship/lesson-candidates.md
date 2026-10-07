## CAND-001 [implement-task]
**Claim:** Don't rely on ADD COLUMN IF NOT EXISTS to fix a column that already exists with a different type or default; it is skipped silently.
**Saw it in:** `db/migrations/004_alumni_profile_fields.sql:10`
**Context:** Idempotency hides drift; TASK-005's real-DB run should check types/defaults in information_schema, not just presence.


## CAND-002 [implement-task]
**Claim:** G-entry workaround is wrong: `npx tsc -p tsconfig.test.json` also fails TS1261 on this checkout; extend it with `forceConsistentCasingInFileNames: false` in a scratch tsconfig instead.
**Saw it in:** `.adlc/knowledge/gotchas.md:723`, `packages/backend/src/dal/dto/PostDTO.ts:1`
**Context:** Disk has `BaseDTO.ts`, git tracks `baseDTO.ts`; the test config includes dal too, so the by-hand run hits the same error. Real fix: two-step `git mv` or re-checkout the file.

## CAND-003 [implement-task]
**Claim:** Render Base UI Switch with `nativeButton render={<button type="button" />}` so `id` lands on the focusable switch and a plain `<label htmlFor>` names and toggles it.
**Saw it in:** `packages/frontend/src/components/ui/Switch/Switch.tsx:47`
**Context:** By default Switch.Root is a span and `id` goes to the hidden checkbox, so `htmlFor` would point at an aria-hidden input.

## CAND-004 [implement-task]
**Claim:** When a design shows only one state of a control, pick the other state's colours from token pairs and add them to contrast.test.ts.
**Saw it in:** `packages/frontend/src/components/ui/Switch/Switch.module.css:1`
**Context:** S5 shows the switch only on; off uses ink-muted track (3.31:1 light) with a surface-raised thumb, chosen by computing ratios first.

## CAND-005 [implement-task]
**Claim:** Don't build the student validator by spreading the alumni one and deleting keys; every new alumni-only field then gets validated (and can 400) for students too.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts` (`validateStudentFields`)
**Context:** The old destructure-and-drop only stripped department/graduation_year; split into a shared-details helper instead.

## CAND-006 [implement-task]
**Claim:** A scratch tsconfig outside the repo that extends `tsconfig.test.json` needs `typeRoots` set to the root `node_modules/@types`, or it fails TS2688 "Cannot find type definition file for 'node'".
**Saw it in:** `packages/backend/tsconfig.test.json:8`
**Context:** Type lookup starts from the config's own folder; the G32 casing workaround in the scratchpad hit this.

## CAND-007 [implement-task]
**Claim:** When a phone design reorders items that the desktop groups in a row, wrap the row in a div that is `display: contents` on phone and use `order`; keep the DOM in desktop order.
**Saw it in:** `packages/frontend/src/features/profile/ProfileHeader.module.css` (`.nameRow`, `.badge`, `.links`)
**Context:** S3 puts the mentorship badge beside the name on desktop but under the headline on phone; duplicating the badge would double it for screen readers.

## CAND-008 [implement-task]
**Claim:** Check a design's badge or chip colours against Tag's tones and the token list before planning to "reuse Tag"; S3's green pill has no tone or token.
**Saw it in:** `packages/frontend/src/features/profile/ProfileHeader.tsx` (badge), `components/ui/Tag/Tag.module.css`
**Context:** The architecture said "reusing Tag" for the badge; only the implementer found the mismatch, leaving a visible design difference.

## CAND-009 [implement-task]
**Claim:** Run the full frontend `npm test` knowing parallel tasks edit sibling features; attribute failures by file before blaming your change.
**Saw it in:** `packages/frontend/src/features/me/ProfileForm.test.tsx` (failed mid TASK-006)
**Context:** typecheck and one test failed on TASK-006's half-written files while TASK-007 was green on its own folders.

## CAND-010 [implement-task]
**Claim:** Keep a boolean form field out of the string-keyed field type: split `ProfileTextValues` (binder, errors, checks) from `ProfileValues` (adds the boolean).
**Saw it in:** `packages/frontend/src/features/me/validation.ts:55`
**Context:** `MeField = keyof ProfileValues` drives `bind`, `errors` and `FIELDS`; a boolean in it breaks every `values[field].trim()`.

## CAND-011 [implement-task]
**Claim:** A field hidden by CSS at some widths needs its errors routed elsewhere; detect it with a `getComputedStyle(...).display` walk, test by setting `style.display` by hand.
**Saw it in:** `packages/frontend/src/features/me/ProfileForm.tsx:51`
**Context:** jsdom applies no CSS Module styles and returns no client rects, so `getClientRects()` would call every field hidden in tests.

## CAND-012 [implement-task]
**Claim:** In ProfileForm tests, `closest('div[class]')` from an Input's `<input>` finds Input's own `.control` div; target a wrapper by its non-scoped class (`.wideOnly`).
**Saw it in:** `packages/frontend/src/features/me/ProfileForm.test.tsx` (hideStartYear)
**Context:** Tests use `classNameStrategy: 'non-scoped'`, so a module class name is a stable selector.

## CAND-013 [implement-task]
**Claim:** To route-test real validation and owner checks, delegate the faked manager method to a real manager from `vi.importActual` and `vi.spyOn` its `alumniQuery`/`userQuery`.
**Saw it in:** `packages/backend/src/api/routes/routes.test.ts` (REQ-011 block)
**Context:** routes.test.ts fakes every async manager method, so a 400 from a validator or a 403 from the owner check never runs there otherwise.

## CAND-014 [implement-task]
**Claim:** Strip `SET transaction_timeout` (and COPY data blocks) from `db/backups/*.sql` before loading it into the local Postgres 15; the dump came from Postgres 17+.
**Saw it in:** `db/backups/pre_bolt20_20261003_220745.sql:13`
**Context:** psql stops at line 13 with "unrecognized configuration parameter", so nothing after it loads.

## CAND-015 [implement-task]
**Claim:** pg returns INTEGER columns as numbers, so `/api/me` sends `start_year`/`graduation_year` as numbers though `MyProfile` types them as strings; client code must accept both.
**Saw it in:** `packages/shared/src/types/alumni.types.ts:65`
**Context:** Real-DB run of TASK-005 showed `start_year: 2013`; the My Profile `text()` helper already converts numbers.

## CAND-016 [implement-task]
**Claim:** When a form gains fields, grep docs for its field count ("up to 12 fields") as well as the field names.
**Saw it in:** `CLAUDE.md:90` (also `packages/frontend/README.md` Forms, ADR-04 consequences table)
**Context:** The REQ-010 count sat in three docs; only a grep for the number found them.

- (TASK-009a) Adding a colour token touches four places, not two: tokens.json, regenerated tokens.css, the design-system README table, and `scripts/generate-tokens.test.ts`, which pins the token count (15 -> 17). A REQ that adds tokens should list the generator test in its blast radius up front.

## CAND-017 [review-qual]
**Claim:** When a component is described as "reusing X" in architecture, the README written at wrapup must be checked against the code, not the plan.
**Saw it in:** `packages/frontend/src/features/profile/README.md:9` ("a `Tag`") vs `ProfileHeader.tsx` (own `.badge` span)
**Context:** Architecture said the badge would reuse Tag; the build used a custom pill and the README kept the plan's wording.

## CAND-018 [review-qual]
**Claim:** A CSS class reused for a second element (e.g. `.icon` on the location pin) inherits every rule on it, including breakpoint `display: none`.
**Saw it in:** `packages/frontend/src/features/profile/ProfileHeader.tsx` (pin uses `styles.icon`), `ProfileHeader.module.css` (`.icon` hidden below 48rem)
**Context:** The rule was written for the LinkedIn icon only; the pin vanishes on phones.

## CAND-A01 [review-arch]
**Claim:** Build a DTO one way only: constructor args or a typed object, never `Object.assign` over a constructor that lacks the new fields.
**Saw it in:** `packages/backend/src/businessLogic/src/AlumniManager.ts:36`
**Context:** Five fields were added to the class body but not the constructor, so create used a spread that the compiler cannot check.

## CAND-A02 [review-arch]
**Claim:** When a form field is hidden by a CSS breakpoint, name the CSS rule in the JS that handles its errors, and prefer a `matchMedia` hook if a second one appears.
**Saw it in:** `packages/frontend/src/features/me/ProfileForm.tsx:+60`
**Context:** `getComputedStyle` is used to detect a width-hidden field, which jsdom tests cannot reproduce.

- (ui-review) A rule whose error lands on a visible field but names a CSS-hidden one (year order, `ProfileForm.tsx:53`) gives phone users no way to act; run the hidden-field hint check on the field that carries the message, not just the field that is hidden.

## CAND-019 [review-reflect]
**Claim:** On a full-replace endpoint, a NOT NULL boolean must be sent every time; the validator treats "omitted" as false, so a partial client silently turns it off.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts:314` (`optionalBoolean`), `features/me/validation.ts` `toUpdateInput`
**Context:** PUT /api/alumni/:id and PUT /api/me now reset mentorship_available when the key is absent; documented only in conventions-api.md.

## CAND-020 [review-reflect]
**Claim:** A cross-field backend error message must start with the label of a field visible at every width, because the client maps messages to fields by prefix (extends G38).
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts:426`, `features/me/profileErrors.ts:2124`
**Context:** The start/graduation order rule says "Graduation year can't be before..." so it lands on the field phones still show.

## CAND-021 [review-reflect]
**Claim:** A migration with no runner needs a deploy-order line: apply it before the API that reads its columns, or the old-schema API answers 500.
**Saw it in:** `db/migrations/004_alumni_profile_fields.sql:4`, CLAUDE.md Environment section
**Context:** Written down for 004 only; no gotcha or ADR makes it a standing rule for the next migration (G15 covers schema location, not order).

## CAND-024 [review-corr]
**Claim:** Do not hide an editable field with CSS at a width breakpoint when browser zoom can reach it; zoomed desktop users lose the field.
**Saw it in:** `packages/frontend/src/features/me/Section.module.css:2070`
**Context:** Start year is `display: none` below 48rem, which 200% zoom on a 1280px window also triggers.

## Candidate verdicts

Dedup basis: origin/redesign as of 6 hours ago (45 lessons on it, none from REQ-011); no duplicate found. REQ-012's lessons (on its own branch) do not overlap.

| Candidate | Verdict | Target / Reason |
|---|---|---|
| CAND-001 | demote-to-gotcha | ^g39 |
| CAND-002 | demote-to-gotcha | ^g32 (updated in place: the workaround was wrong) |
| CAND-003 | demote-to-gotcha | ^g40 |
| CAND-004 | discard | duplicate of LESSON-REQ-004-2 (check design colours against token pairs) |
| CAND-005 | promote | LESSON-REQ-011-1 |
| CAND-006 | demote-to-gotcha | ^g32 (typeRoots note) |
| CAND-007 | discard | one-off layout trick, documented in the CSS |
| CAND-008 | discard | duplicate of LESSON-REQ-004-2 |
| CAND-009 | demote-to-gotcha | ^g40 (last bullet) |
| CAND-010 | demote-to-gotcha | ^g40 |
| CAND-011 | promote | LESSON-REQ-011-2 |
| CAND-012 | discard | test selector detail |
| CAND-013 | demote-to-gotcha | ^g41 |
| CAND-014 | demote-to-gotcha | ^g39 |
| CAND-015 | demote-to-gotcha | ^g40 |
| CAND-016 | discard | duplicate of LESSON-REQ-010-5 (grep every doc list) |
| (TASK-009a token note) | demote-to-gotcha | ^g40 |
| CAND-017 | discard | duplicate of LESSON-REQ-010-5 / LESSON-REQ-012-2 (on the REQ-012 branch) |
| CAND-018 | promote | folded into LESSON-REQ-011-2 |
| CAND-A01 | discard | fixed in code (typed DTO init), no recurring pattern |
| CAND-A02 | promote | folded into LESSON-REQ-011-2 |
| (ui-review note) | promote | folded into LESSON-REQ-011-2 |
| CAND-019 | promote | LESSON-REQ-011-3 |
| CAND-020 | demote-to-gotcha | ^g38 (updated in place) |
| CAND-021 | demote-to-gotcha | ^g39 |
| CAND-024 | promote | folded into LESSON-REQ-011-2 |
