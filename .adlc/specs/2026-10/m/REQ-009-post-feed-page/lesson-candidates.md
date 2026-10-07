
## CAND-001 [implement-task]
**Claim:** Check a new text colour against the Menu highlight (--accent-soft) too; --error on it is 4.48:1 light, 4.25:1 dark.
**Saw it in:** `packages/frontend/src/components/ui/Menu/Menu.module.css` (danger item rules)
**Context:** A danger tone looked token-safe but failed WCAG only on the highlighted state; fixed by a --surface-sunken highlight.

## CAND-002 [implement-task]
**Claim:** Move a shared helper with plain mv and no edits so git sees a rename; fix importers in separate files.
**Saw it in:** `packages/frontend/src/config/relativeTime.ts:1`
**Context:** Task asked for history-friendly moves without git mv; byte-identical content keeps rename detection at 100%.

## CAND-003 [implement-task]
**Claim:** Rebuild businessLogic dist before running typecheck:backend after adding a Manager method; the api step type-checks against dist/*.d.ts.
**Saw it in:** `packages/backend/package.json` (typecheck script, `tsc --noEmit -p src/api`)
**Context:** Tests and tsconfig.test.json use the source, but `tsc -p src/api` failed with "updateComment does not exist" until `tsc` ran in businessLogic.

## CAND-004 [implement-task]
**Claim:** If typecheck:backend fails with TS1261 on baseDTO.ts, check the on-disk file name against `git ls-files`; git tracks `baseDTO.ts`.
**Saw it in:** `packages/backend/src/dal/dto/PostDTO.ts:1`
**Context:** This checkout has `BaseDTO.ts` on disk; core.ignorecase=true hides it from git status, but tsc's include glob and the imports disagree.

## CAND-005 [implement-task]
**Claim:** For an edit that must 404 on a concurrent delete, do UPDATE … RETURNING and the author join in one CTE and let the Manager map zero rows to 404.
**Saw it in:** `packages/backend/src/dal/query/CommentQuery.ts` (updateComment)
**Context:** AppError lives in businessLogic, so the dal returns undefined and the Manager throws; dal cannot import AppError.

## CAND-006 [implement-task]
**Claim:** To check a request body in a fake-adapter test, JSON.parse `config.data`; axios has already serialized it to a string before the adapter runs.
**Saw it in:** `packages/frontend/src/services/postsApi.test.ts:50`
**Context:** Comparing `config.data` to the input object fails; a table of cases plus one parse helper covers all eight calls.

## CAND-007 [implement-task]
**Claim:** Store the server's page length beside each infinite-query page and compute offset and "has more" from it, never from the edited list.
**Saw it in:** `packages/frontend/src/features/feed/cacheEdits.ts:20` (`PostsPage.fetched`)
**Context:** Optimistic adds and removes change `posts.length`, which would shift the next offset and flip `hasNextPage`.

## CAND-008 [implement-task]
**Claim:** In TanStack Query v5 a mutation still counts in `isMutating` during its own `onSettled`, so "last one running" is `=== 1`, not `=== 0`.
**Saw it in:** `packages/frontend/src/features/feed/useFeedMutations.ts` (`settlePosts`); `node_modules/@tanstack/query-core/src/mutation.ts:374-382`
**Context:** The success/error dispatch happens after the option callbacks run.

## CAND-009 [implement-task]
**Claim:** After `fetchNextPage()` inside `act`, wait for the hook's rendered `data` with `waitFor`; `result.current` can still hold the old pages.
**Saw it in:** `packages/frontend/src/features/feed/usePosts.test.tsx:70`
**Context:** The request had gone out and resolved, but the assertion saw only page 1.

## CAND-010 [implement-task]
**Claim:** A count clamped at 0 must remember the delta it really applied, so its rollback adds back only that.
**Saw it in:** `packages/frontend/src/features/feed/useFeedMutations.ts` (`useDeleteComment` onMutate)
**Context:** Deleting 3 from a stale count of 1 then rolling back +3 would show 3.

## CAND-011 [implement-task]
**Claim:** Link a person to their profile with alumni.id, never users.id: `/alumni/:id` (and GET /api/alumni/:id) take the alumni row id.
**Saw it in:** `packages/backend/src/dal/query/PostQuery.ts:11` (author_alumni_id), `packages/frontend/src/config/directoryReturn.ts`
**Context:** REQ-009 planned `/alumni/:user_id`; spec, architecture and adversary all missed it, found only at implement time (TASK-005), fixed by TASK-009.

## CAND-012 [implement-task]
**Claim:** Pull a 0-or-1 child id with a scalar subquery (`SELECT MIN(id) ...`), not a LEFT JOIN, when uniqueness is not guaranteed by the live schema.
**Saw it in:** `packages/backend/src/dal/query/CommentQuery.ts:7`
**Context:** findAlumniByUserId uses ORDER BY id LIMIT 1, so code may not assume one alumni row per user; a join would duplicate feed rows.

## CAND-013 [implement-task]
**Claim:** `npm run typecheck:backend` stops at the dal step on the local TS1261 baseDTO casing error, so tsconfig.test.json is never checked; run `npx tsc -p tsconfig.test.json` by hand.
**Saw it in:** `packages/backend/package.json` (typecheck script chained with &&)
**Context:** A real TS2493 in a new test file was hidden until the steps were run one by one.

## CAND-014 [implement-task]
**Claim:** After a Base UI MenuItem's onSelect, move focus one animation frame later; the closing menu puts focus back on its trigger after the callback.
**Saw it in:** `packages/frontend/src/features/feed/EditBox.tsx` (focus effect), `PostCard.tsx` (confirm focus)
**Context:** Edit post and the delete confirm open from the menu and must take focus.

## CAND-015 [implement-task]
**Claim:** Keep a delete's mutation hook and error in a parent that stays mounted, not in the item being deleted.
**Saw it in:** `packages/frontend/src/features/feed/FeedPage.tsx` (useDeletePost), `CommentThread.tsx`
**Context:** The optimistic remove unmounts the card, so a hook inside it loses the rollback error.

## CAND-016 [implement-task]
**Claim:** A test helper with a default parameter (`me = ME`) cannot be called with "no user" via undefined; use null for "none".
**Saw it in:** `packages/frontend/src/features/feed/testKit.ts` (`testClient`), `PostCard.test.tsx` (renderCards)
**Context:** The "nobody signed in" menu case passed vacuously with ME until the parameter took null.

## CAND-017 [implement-task]
**Claim:** invalidateQueries refetches only active queries; to test it without an observer, assert `getQueryState(key).isInvalidated`.
**Saw it in:** `packages/frontend/src/features/feed/CommentThread.test.tsx` (404 case)
**Context:** The thread alone mounts no posts observer, so no GET /posts happened.

## CAND-018 [implement-task]
**Claim:** Use ink-secondary, not the design's ink-muted, for timestamps and meta text on cards; ink-muted is under 4.5:1 on surface-raised.
**Saw it in:** `packages/frontend/src/features/feed/PostCard.module.css` (.time), `CommentThread.module.css` (.meta)
**Context:** S4 uses ink-muted for times; contrast.test.ts has no ink-muted text pair.

## CAND-019 [implement-task]
**Claim:** When adding a lazy feature, grep every README for the old count ("two lazy", "either feature"); app/README.md repeats the list too.
**Saw it in:** `packages/frontend/src/app/README.md:8`
**Context:** The TASK-007 file list omitted app/README.md and components/ui/README.md, both of which had stale lists.

## CAND-020 [implement-task]
**Claim:** Adding a lazy page means editing three lists: LAZY_FEATURES in eslint.config.js, LAZY_FEATURES in lazyRoutes.test.ts, and the fixtures in scripts/enforcement.test.ts.
**Saw it in:** `packages/frontend/eslint.config.js:77`, `packages/frontend/src/app/lazyRoutes.test.ts:20`
**Context:** Nothing fails if you add the route but forget a list; the new feature is just unguarded.

## CAND-021 [implement-task]
**Claim:** The nav and tab tests live in AppShell.test.tsx; there is no MainNav.test.tsx or BottomTabs.test.tsx, so task files naming those mean that file.
**Saw it in:** `packages/frontend/src/app/AppShell/AppShell.test.tsx` ('Header main nav', 'Bottom tab bar')
**Context:** TASK-006 listed the per-component test files "if present"; none are.
