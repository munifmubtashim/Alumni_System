# REQ-013-casing-fix-start-year-all-widths — Review log

## Correctness findings

**Summary:** No blocking findings. Checked: BaseDTO rename (git index tracks only `BaseDTO.ts`; all four imports and the rename match; no lowercase reference left in src, tsconfig, package.json, CI, docs outside archives and the stale-by-design hot.md history line), ProfileForm save/blur/server-error/focus paths, and the CSS/layout. Frontend `tsc -p tsconfig.app.json` and `eslint src/features/me` ran clean.

### COR-001 (nit): leftover `.wideOnly` string in a test
`ProfileForm.test.tsx:522` asserts `closest('.wideOnly')` is null. It is a guard for a class that no longer exists, so it can never fail for a real reason. Harmless; the `display: none` check on the next line is the useful one. Optional: drop the first assertion.

### COR-002 (nit): comment says phones stack "Degree, Start year, Graduation year"
`EducationSection.tsx:16` and the me README. On phones the DOM and tab order is University, Degree, Department, Start year, Graduation year (Department sits between). Matches `FIELDS` order in `validation.ts`, so focus-on-first-invalid is correct; only the wording skips Department.

**Verified, nothing to fix:** the year-order error clears on typing in start_year (`prev.graduation_year === YEAR_ORDER_MESSAGE`) and in graduation_year (own field clear); blur still copies the order error onto Graduation year; the server "Graduation year ..." message maps via `FIELD_PREFIXES` to graduation_year; the `fieldMessage` removal in onError is safe (`field` found implies the entry is defined); `showFormError` and `formErrorRef` are still used (form-level server errors); no unused imports or dead exports (`YEAR_ORDER_MESSAGE` still used); `.row` is 1 column below 48rem and 2 columns from 48rem, so Start year/Graduation year pair on desktop and stack on phones with no leftover display rule. Case-only rename: the stale `packages/backend/dist/*.d.ts` already say `./BaseDTO`, so they are not a concern; the rename is staged but the import edits are not, so the user should `git add` all five files in one commit, or a partial commit would break typecheck on Linux.

## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 55 lessons (0 superseded), gotchas G22/G26/G32/G37-G41 plus a grep of all, ADR-04, backend/frontend component pages, route-layout concept. 3 findings: 0 critical, 0 major, 1 minor vault-stale (lesson), 2 trivial. Repo-doc sweep: CLAUDE.md, both READMEs, me/README, G22, G32, G38/G40, route-layout, conventions-api are already updated and consistent; no stale `wideOnly`, `isHidden`, `HIDDEN_FIELD_HINT` or lowercase-`baseDTO` claim remains outside history notes. No ADR conflict; no diagram.

### REFL-001: LESSON-REQ-011-2 half-describes a design that no longer exists

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/lessons/LESSON-REQ-011-2-css-hidden-fields.md:15-18` |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-011-2-css-hidden-fields]] |

**What:** The lesson's "Saw it in" points at `.wideOnly` and the error routing, both deleted here. Points (2) zoom, (3) do not reuse a class carrying a breakpoint rule, (4) jsdom has no CSS Modules still hold. Point (1) (route errors to the form with a hint) is the machinery this REQ removed.
**Recommendation:** At wrapup do not supersede (the trap is real). Add a dated note: "REQ-013 removed the hidden field; routing was deleted (~60 lines, 5 tests). Prefer showing the field; see CAND-001." Mark point (1) as "only if you must hide". Same note in `adr-04-forms-without-a-library.md:44` (the "errors for a CSS-hidden field routed to the form alert" cost is now history). Fold CAND-001 into this lesson, not a new one.

### REFL-002: LESSON-REQ-012-1 example cites a deleted constant

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `.adlc/knowledge/lessons/LESSON-REQ-012-1-sibling-branch-constants.md:18` |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-012-1-sibling-branch-constants]] |

**What:** The evidence says `HIDDEN_FIELD_HINT` "will be stale after both merge". It is now deleted, not stale. The rule stays valid.
**Recommendation:** Append "(resolved: REQ-013 deleted the constant)" to that bullet. No supersession.

### REFL-003: Test asserts on a class that no longer exists

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/features/me/ProfileForm.test.tsx:522` |
| Category | concept-drift |
| Vault reference | [[knowledge/gotchas#^g37|G37]] (jsdom has no scoped CSS) |

**What:** `closest('.wideOnly')` can never match now that the class is gone, so that line guards nothing; the `display: none` line is the real check and also only covers inline style. The comment justifies it as a regression guard, which jsdom cannot give. A reintroduced `.wideOnly` wrapper would still be caught only by the missing-CSS-in-jsdom blind spot (no).
**Recommendation:** Keep as a cheap tripwire or drop the line; real proof of "visible below 48rem" is a browser check at 360px (not shown in the packet; confirm it was done).

(G22/G32 history rewrite verified accurate: BaseDTO.ts is now the git and disk name; the stale-rule risk in CAND-002 is already fixed in the vault.)

## UI/UX findings

Written by: ui-reviewer (tier: balanced). UI review tier: static-only.

**Summary:** Read the diff of EducationSection, ProfileForm, Section.module.css, validation, profileErrors, Input and the form tests against AC2/AC3. 0 critical, 0 major, 1 trivial. The change is a clean removal: Start year is now a plain grid child, and all width-hidden logic (`wideOnly`, `isHidden`, `withOrderHint`, `HIDDEN_FIELD_HINT`, `YEAR_ORDER_HIDDEN_MESSAGE`) is gone; a grep of `features/me`, both READMEs and CLAUDE.md finds no stale mention.
- Phone order (single column below 48rem): University, Degree, Department, Start year, Graduation year. Matches the request; Department sits between Degree and Start year because it is a full-width row in both widths (unchanged). Checked, nothing.
- Desktop: `.row` is still two columns from 48rem; University|Degree and Start year|Graduation year pairs are unchanged. Start year's old wrapper div is gone, so the grid item is now Input's own `.field` div, same as its neighbour. Checked, nothing.
- Tab and DOM order follow the visual order at all widths (University, Degree, Department, Start, Graduation); the Save focus order (`profileFields` in validation.ts) matches DOM order. Labels use `htmlFor` plus `useId` in Input, and the error is in `aria-describedby` with `aria-invalid`. Checked, nothing.
- Start > graduation: error lands on Graduation year, focus goes to it on Save (first invalid in DOM order), and editing Start year clears it. A server 400 ("Start year ..." or "Graduation year ...") maps to a now-visible field and focuses it; the old form-level fallback only remains for non-field messages. Checked, nothing.
- 200% zoom: the 48rem breakpoint already collapses to one column and Start year is now reachable there. Checked, nothing.

### UI-001: Leftover `.wideOnly` assertion cannot fail

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | `/me` Education, alumni |
| Lens | interaction-state |
| Evidence | `ProfileForm.test.tsx:522` |

**What:** The test asserts `start.closest('.wideOnly')` is null. jsdom loads no CSS Modules, so the class name would never appear, even if someone re-added the wrapper.
**Why it matters:** It reads like a regression guard but guards nothing.
**Recommendation:** Delete that line (the label and focus-on-error tests below it already cover AC3), or assert the real thing in a browser test.

**UI review tier:** static-only; `/me` Education (alumni, phone and desktop widths) read from source; 0 screenshots; 0 critical / 0 major / 0 minor, 1 trivial.

## UI manual-verification checklist

Use an alumni account; run `npm run dev`; open `/me`.
1. At 360px wide: Education shows University, Degree, Department, Start year, Graduation year in one column, none cut off, no horizontal scroll.
2. At 1280px wide: University|Degree, then Department full width, then Start year|Graduation year side by side; same look as before.
3. Tab through Education at both widths: order is University, Degree, Department, Start year, Graduation year; each label click focuses its input.
4. Type Start 2020 and Graduation 2015, tab out of Start year: "Graduation year can't be before the start year" appears under Graduation year. Press Save: focus lands on Graduation year, no form-level alert, no "wider screen" hint. Change Start year to 2010: the message clears.
5. Type "20x7" in Start year and press Save: "Start year is not valid" under Start year, focus on it.
6. Force a server 400 on Start year (for example by disabling client checks in devtools): message shows on Start year and it is focused.
7. Set browser zoom to 200% on a desktop window: one column, Start year reachable, nothing overlapping.
8. Reload with an account that already has a Start year saved: the value shows and Save stays hidden until you change something.
9. Compare against `docs/design/screens/app/S5-Phone-Light.dc.html`: only difference should be the extra Start year field (recorded deviation).
