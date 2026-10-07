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
