
## CAND-001 [implement-task]
**Claim:** When you add a query param, grep the tests for it used as an "unknown key" example; that test flips from ignored to validated.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.test.ts:45`
**Context:** REQ-005's "ignores unknown keys" test used `sort: 'name'`; REQ-015 made sort real, so the example had to change to `orderBy`.

## CAND-002 [implement-task]
**Claim:** Normalize optional sort/order defaults in the validator, and keep the dal's ORDER BY a fixed lookup keyed by the typed pair.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts:219`, `packages/backend/src/dal/query/AlumniQuery.ts:11`
**Context:** "order without sort means name" lives in one place; the dal never sees a half-filled pair and no request text reaches SQL.

## CAND-003 [implement-task]
**Claim:** Rebuilding businessLogic dist while a parallel task edits the same package bakes that task's in-progress code into dist; rebuild again after the last task.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts:146`
**Context:** TASK-001 ran `tsc` (G32) while TASK-002 was adding `validateAdminAlumniFields` to the same file.

## CAND-004 [implement-task]
**Claim:** Mock a new Manager in its own route test file with a local fake factory; don't add it to routes.test.ts's fake list.
**Saw it in:** `packages/backend/src/api/routes/AdminRoutes.test.ts:10`
**Context:** routes.test.ts fakes only the four old Managers; its bad-token loop still covers new routes because auth runs before the controller.

## CAND-005 [implement-task]
**Claim:** A cascade delete must recount denormalised counters (posts.comment_count) on rows the cascade touches but does not delete.
**Saw it in:** `packages/backend/src/dal/query/AdminQuery.ts:27`
**Context:** Read the affected post ids before the DELETE (afterwards the comments are gone); skip the UPDATE when the list is empty.

## CAND-006 [implement-task]
**Claim:** Run the manual dev-DB check on a private API instance (`PORT=3999 npx tsx server.ts` in api/), not the user's running one.
**Saw it in:** `packages/backend/src/api/server.ts:4`
**Context:** dotenv never overrides a set variable, so PORT on the command line wins; the user's :3000 dev server may run a stale businessLogic dist (G32).

## CAND-007 [implement-task]
**Claim:** Don't assert aria-modal on a Base UI 1.8 Dialog/AlertDialog; it sets none and instead marks everything outside the portal aria-hidden + data-base-ui-inert.
**Saw it in:** `packages/frontend/src/components/ui/Drawer/Drawer.test.tsx:92`
**Context:** Test the hidden background (trigger inside an aria-hidden ancestor) instead.

## CAND-008 [implement-task]
**Claim:** Don't test a Base UI modal focus trap with user.tab() in jsdom; the focus-guard spans take focus and their redirect never runs.
**Saw it in:** `packages/frontend/src/components/ui/Drawer/Drawer.test.tsx:95`
**Context:** Tab past the last control lands on a data-base-ui-focus-guard span, then body; check the trap in a real browser (TASK-008).

## CAND-009 [implement-task]
**Claim:** Adding a colour token also means bumping the hard-coded count in scripts/generate-tokens.test.ts (toHaveLength(17)).
**Saw it in:** `packages/frontend/scripts/generate-tokens.test.ts:35`
**Context:** Not named by TASK-003, so the token change left that test red until it is updated to 19.

## CAND-010 [implement-task]
**Claim:** A token with alpha (8-digit hex, e.g. scrim) must never go in contrast.test.ts PAIRS; its luminance() reads only #rrggbb and ignores alpha.
**Saw it in:** `packages/frontend/src/styles/contrast.test.ts:20`
**Context:** The generator copies the value verbatim, so #rrggbbaa works in tokens.css; only the contrast helper would silently misjudge it.

## CAND-011 [implement-task]
**Claim:** Put a new hook exported from `features/auth` in its own file, not in `guards.tsx`; react-refresh/only-export-components fails lint on a hook beside components.
**Saw it in:** `packages/frontend/src/features/auth/useIsAdmin.ts:1`
**Context:** `useIsAdmin` first lived next to `RequireAdmin`; typecheck and tests passed, only `npm run lint` caught it.

## CAND-012 [implement-task]
**Claim:** Behind a nested role guard, test the inner guard's loading and error states on a route outside `RequireAuth`; inside it, the outer guard shows them first and the inner branches are unreachable.
**Saw it in:** `packages/frontend/src/features/auth/guards.test.tsx` (`bare-admin` route)
**Context:** `RequireAdmin` nests in `RequireAuth`, which already owns ['me'] pending and error.

## CAND-013 [implement-task]
**Claim:** Keep a list's loading and loaded branches at the same JSX position, or the table remounts when data arrives and focus plus held element refs are lost.
**Saw it in:** `packages/frontend/src/features/admin/AdminPage.tsx:44`
**Context:** A status span placed before the table in the loading branch shifted it; tests holding the found table then saw a detached node.

## CAND-014 [implement-task]
**Claim:** Don't call focus() on a button that is still disabled until the next render; queue the target and apply it in an effect.
**Saw it in:** `packages/frontend/src/features/admin/AdminPagination.tsx:33`
**Context:** Next to the last page: Prev is disabled until the URL change renders, so an immediate focus() silently does nothing.

## CAND-015 [implement-task]
**Claim:** With keepPreviousData, an empty page past the end shows as placeholder for the clamp target; treat "no items but total > 0" as loading, not as an empty state.
**Saw it in:** `packages/frontend/src/features/admin/AdminPage.tsx:39`
**Context:** Otherwise "No alumni yet" flashes while the page clamps back.

## CAND-016 [implement-task]
**Claim:** useDebouncedCallback and the search box own-write guard now exist twice (directory, admin); move them to a shared home before a third copy.
**Saw it in:** `packages/frontend/src/features/admin/AdminSearch.tsx:1`, `useDebouncedCallback.ts:1`
**Context:** L-REQ-008-6 predicted this; lazy features can't import each other, so the home must be outside features/.

## CAND-017 [implement-task]
**Claim:** A page that renders the desktop table and the phone list together (CSS switch) doubles every row button in jsdom; scope queries with within(table) or within(list).
**Saw it in:** `packages/frontend/src/features/admin/AdminPage.test.tsx:28`
**Context:** CSS Modules are not applied in Vitest, so both are "visible" and getByRole finds two.

## CAND-018 [implement-task]
**Claim:** To send focus back to "the opener if it still exists", give Base UI's finalFocus a ref whose `current` is a getter, so it is decided as the dialog closes, not when close() runs.
**Saw it in:** `packages/frontend/src/features/admin/AlumniDrawer.tsx:117`
**Context:** TanStack notifies observers on a setTimeout, so a refetch awaited in onSuccess can still render the removed row in the same commit as the close.

## CAND-019 [implement-task]
**Claim:** user-event does not submit on Enter when the submit button sits outside the form (`form="id"`), though browsers do; click the button in tests.
**Saw it in:** `packages/frontend/src/features/admin/AlumniDrawer.test.tsx:108`
**Context:** Drawer footers render outside the body's <form>, so the submit button uses the form attribute.

## CAND-020 [implement-task]
**Claim:** Guard a create against double submit with a ref set before mutate(), not only the button's disabled state; a duplicate POST turns into a false 409.
**Saw it in:** `packages/frontend/src/features/admin/AlumniDrawer.tsx:91`
**Context:** ADV-004; the second click can land before React re-renders the disabled button.

## CAND-021 [implement-task]
**Claim:** Behind an open Base UI modal, query the page with `getAllByText`, not `getByRole`: the rest of the page is aria-hidden.
**Saw it in:** `packages/frontend/src/features/admin/DeleteAlumniDialog.test.tsx:148`
**Context:** `getByRole('table', { name: 'Alumni' })` failed while the delete dialog was open, though the table was on screen.

## CAND-022 [implement-task]
**Claim:** To pick a dialog's return-focus target by outcome, key a ref on the open's target object instead of resetting a boolean ref during render.
**Saw it in:** `packages/frontend/src/features/admin/DeleteAlumniDialog.tsx:75`
**Context:** `react-hooks/refs` fails on a ref write in the "new target" render branch; comparing `goneRef.current !== target` needs no reset.

## CAND-023 [implement-task]
**Claim:** A disabled query still returns data you seed with `setQueryData`, so tests can set `['me']` without a token.
**Saw it in:** `packages/frontend/src/features/admin/DeleteAlumniDialog.test.tsx` (hides Delete test)
**Context:** `useCurrentUser` is off without a live token; seeding the cache was enough to test the own-row hide.

## CAND-024 [implement-task]
**Claim:** When a lazy feature is added, also update the "may not import" line in every other lazy feature's README; they drift silently (feed's had already missed `about`).
**Saw it in:** `packages/frontend/src/features/feed/README.md:17`
**Context:** L-REQ-010-5 names this, but REQ-014 still left feed/me/profile READMEs without `about`; nothing tests README lists.

## CAND-025 [review-arch]
**Claim:** Give cross-feature query-key roots one shared home (config/) or a test; string literals with a "keep in step" comment drift silently.
**Saw it in:** `packages/frontend/src/features/admin/mutations.ts:12`
**Context:** Admin writes invalidate ['alumni'], ['posts'], ['feed'] owned by lazy features it cannot import.

## CAND-026 [review-arch]
**Claim:** Extending a shared list endpoint (new sort/order params) needs a conventions-api.md entry in the same REQ.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts:195`
**Context:** CLAUDE.md was updated but the vault API conventions were not.

## CAND-027 [review-arch]
**Claim:** Don't export a constant from one Manager just so another Manager can import it; move it to a shared leaf module.
**Saw it in:** `packages/backend/src/businessLogic/src/AdminManager.ts:5`
**Context:** BCRYPT_ROUNDS was made exported from UserManager for AdminManager.

## CAND-028 [review-qual]
**Claim:** Put a helper used by a second feature in a shared layer (services/ or a hooks folder) instead of copying it with a "move it when a third needs it" comment.
**Saw it in:** `packages/frontend/src/features/admin/useDebouncedCallback.ts:3`
**Context:** Copies made for ADR-08 (lazy features cannot import each other) hit three or more copies for serverMessage, focusIsLost, toast.

## CAND-029 [review-qual]
**Claim:** Pure error-body helpers like serverMessage belong in services/httpErrors.ts, which every feature may import.
**Saw it in:** `packages/frontend/src/features/admin/adminErrors.ts:30` (also deleteErrors.ts:12, authErrors.ts:32, feedErrors.ts:4, profileErrors.ts:43)
**Context:** Five identical copies; the lazy-feature rule does not block importing from services/.

## CAND-030 [review-qual]
**Claim:** The CLAUDE.md "Conventions (redesign)" backend rules (controller classes, one error middleware) are not true of any controller; mark them aspirational or apply them.
**Saw it in:** `packages/backend/src/api/controllers/AdminController.ts:9`
**Context:** New controller follows the old function + try/catch + sendError style, as every other does.

## CAND-031 [review-qual]
**Claim:** Name every length limit in backend validators; the client mirrors them by name, so an inline 100 has nothing to point to.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts:152`
**Context:** Job title and Company use the literal 100 while the frontend copy has JOB_TITLE_MAX.

## CAND-025 [review-corr]
**Claim:** When a transaction collects ids to fix up and then deletes by cascade, lock the parent row first or derive the ids from the delete itself.
**Saw it in:** `packages/backend/src/dal/query/AdminQuery.ts:94`
**Context:** Select-then-delete under READ COMMITTED can miss rows added in between, leaving stale comment_count.

## CAND-026 [review-corr]
**Claim:** Deleting accounts needs an answer for live JWTs: authMiddleware trusts the token alone, so deleted or demoted users keep access until expiry.
**Saw it in:** `packages/backend/src/api/Middleware/authMIddleware.ts:5`
**Context:** REQ-015 added admin delete of accounts; role and existence are never re-checked.

## CAND-032 [review-reflect]
**Claim:** Resolve a destructive admin route's row id to the user id in the Manager and compare user ids for the self-delete check; the route id (alumni id) and the token id (user id) are different id spaces.
**Saw it in:** `packages/backend/src/businessLogic/src/AdminManager.ts:80`
**Context:** `/api/admin/alumni/:id` takes alumni.id; `req.user.sub` is users.id. Same trap as L-REQ-009-1, on a write.

## CAND-033 [review-reflect]
**Claim:** Put `router.use(authMiddleware, requireRole("admin"))` at the top of an admin-only router so every later route is admin-only by construction (extends L-REQ-003-2 to roles).
**Saw it in:** `packages/backend/src/api/routes/AdminRoutes.ts:9`
**Context:** conventions-api still lists per-route role gates; a namespace gate is a stronger pattern worth a concept line.

## CAND-034 [review-reflect]
**Claim:** A role gate nested inside RequireAuth shows cached ['me'] data first and the error box only when there is no data; a 403 renders in the shell and never logs out.
**Saw it in:** `packages/frontend/src/features/auth/guards.tsx:92`
**Context:** Applies L-REQ-010-2 and ADR-03 to roles; the next role-gated page (e.g. student-only) should reuse RequireAdmin's shape.

## CAND-035 [review-reflect]
**Claim:** A write route that changes only some columns (admin PUT) must say so in conventions-api, because every other PUT is a full replace (L-REQ-011-3).
**Saw it in:** `packages/backend/src/dal/query/AdminQuery.ts:42`
**Context:** Admin edit writes six columns and keeps headline, bio, mentorship; omitted optional ones among the six are cleared.

## CAND-UI-001 [ui-review]
**Claim:** An edit form's Save must be disabled until values differ from the loaded record, or a no-op save toasts "saved" falsely.
**Saw it in:** `packages/frontend/src/features/admin/AlumniDrawer.tsx`
**Context:** Edit drawer Save is live on open and sends a PUT with unchanged values.

## CAND-036 [implement-task]
**Claim:** Pin a list in eslint.config.js from a test with `eslint.calculateConfigForFile(...)`, not by importing the config (scripts/ has no allowJs).
**Saw it in:** `packages/frontend/scripts/enforcement.test.ts` (test "bans exactly the features the router lazy-loads")
**Context:** m9; the effective rule options are compared with router.tsx's lazy imports, so the router is the one list.

- **[ui-review]** A post with a null caption crashes the whole feed: the type says `caption?: string` but `PostCard.tsx:155` calls `.trim()` on it unguarded, and the API accepts the post. Optional in the type means null-safe at every read.


## Candidate verdicts

| Candidate | Verdict | Target / Reason |
|---|---|---|
| CAND-001 | demote-to-gotcha | ^g46 |
| CAND-002 | discard | captured in conventions-api (sort/order) and ADR-08 note |
| CAND-003 | demote-to-gotcha | ^g46 |
| CAND-004 | demote-to-gotcha | ^g46 |
| CAND-005 | promote | LESSON-REQ-015-1 |
| CAND-006 | demote-to-gotcha | ^g46 |
| CAND-007 | demote-to-gotcha | ^g43 |
| CAND-008 | demote-to-gotcha | ^g43 |
| CAND-009 | demote-to-gotcha | ^g45 |
| CAND-010 | demote-to-gotcha | ^g45 |
| CAND-011 | demote-to-gotcha | ^g44 |
| CAND-012 | demote-to-gotcha | ^g44 |
| CAND-013 | demote-to-gotcha | ^g44 |
| CAND-014 | demote-to-gotcha | ^g44 |
| CAND-015 | demote-to-gotcha | ^g44 |
| CAND-016 | discard | duplicate of LESSON-REQ-008-6 (recurrence noted there); follow-up m4 |
| CAND-017 | demote-to-gotcha | ^g44 |
| CAND-018 | demote-to-gotcha | ^g43 |
| CAND-019 | demote-to-gotcha | ^g44 |
| CAND-020 | discard | covered by ADV-004 tests; one-off |
| CAND-021 | demote-to-gotcha | ^g43 |
| CAND-022 | discard | lint-specific one-off; code comment suffices |
| CAND-023 | demote-to-gotcha | ^g44 |
| CAND-024 | discard | duplicate of LESSON-REQ-010-5 (recurrence noted there) |
| CAND-025 (arch) | discard | fixed in review (config/queryKeys.ts); recurrence noted on LESSON-REQ-008-6 |
| CAND-026 (arch) | promote | LESSON-REQ-015-3 |
| CAND-027 | discard | fixed in review (m5); BCRYPT_ROUNDS private again |
| CAND-028 | discard | duplicate of LESSON-REQ-008-6 |
| CAND-029 | discard | fixed (m3); conventions-frontend names serverMessage |
| CAND-030 | discard | follow-up m12 (redesign rules not applied); recorded in components/backend.md |
| CAND-031 | discard | fixed (m6, n2) |
| CAND-025 (corr) | promote | LESSON-REQ-015-1 (lock half) |
| CAND-026 (corr) | demote-to-gotcha | ^g47 |
| CAND-032 | promote | LESSON-REQ-015-2 |
| CAND-033 | discard | captured in conventions-api Admin API entry |
| CAND-034 | discard | captured in conventions-frontend (role gates) and ADR-08 note |
| CAND-035 | promote | LESSON-REQ-015-3 (partial update half) |
| CAND-UI-001 | promote | LESSON-REQ-015-5 |
| CAND-036 | discard | recorded as LESSON-REQ-014-1 "Resolved in REQ-015" note |
| ui-review null caption | promote | LESSON-REQ-015-4 |
