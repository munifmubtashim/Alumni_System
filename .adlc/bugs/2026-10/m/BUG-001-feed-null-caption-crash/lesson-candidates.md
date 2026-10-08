## CAND-001 [bugfix-investigate]
**Claim:** A nullable DB column must be typed `T | null` in `@alumni/shared`, not `T?`; pg sends SQL NULL as JSON null, which passes `!== undefined` guards.
**Saw it in:** `packages/shared/src/types/post.types.ts:4`, `packages/frontend/src/features/feed/PostCard.tsx:154`
**Context:** BUG-001: one null-caption post crashed /feed for everyone; `caption?: string` let an incomplete guard type-check.

## CAND-002 [bugfix-investigate]
**Claim:** Validate create bodies the same way as update bodies in a Manager; a cast (`body.caption as string`) on create stores anything.
**Saw it in:** `packages/backend/src/businessLogic/src/PostManager.ts:17`
**Context:** updatePost validated text-or-null; createNewPost cast without checking, so POST /api/posts {} answered 201.

## CAND-003 [implement-task]
**Claim:** Never assert "no element" with a selector built from a CSS-module class unless another test proves that selector matches; `p.${styles.x}` with an undefined class is always empty.
**Saw it in:** `packages/frontend/src/features/feed/PostCard.test.tsx:27`
**Context:** BUG-001: `querySelector('p')` also hit the Byline's time paragraph, so the test needed the caption class, plus a positive control.

## CAND-004 [implement-task]
**Claim:** jest-dom `toHaveTextContent` trims and collapses whitespace; assert `textContent` with `toBe` when trimming is the behaviour under test.
**Saw it in:** `packages/frontend/src/features/feed/PostCard.test.tsx:75`
**Context:** The "caption is trimmed" check passed against untrimmed output until switched to `textContent`.

## CAND-005 [implement-task]
**Claim:** A new Manager rule that cross-checks the stored row (patch merged onto existing) breaks old tests whose fixture row was minimal; review fixtures like `STORED_POST` when adding one.
**Saw it in:** `packages/backend/src/businessLogic/src/PostManager.test.ts` ("clears a field sent as null")
**Context:** STORED_POST had `media_url: null`, so clearing the caption now leaves neither and answers 400; the test had to give the row media.

## CAND-006 [review-reflect]
**Claim:** When a shared-type field is widened to `| null` after a crash, widen its siblings that come from nullable columns in the same sweep.
**Saw it in:** `packages/shared/src/types/post.types.ts:11` (`author_photo`) vs line 5-6
**Context:** Only caption and media_url were widened; author_photo has the same nullable source.

## CAND-007 [review-reflect]
**Claim:** Tighten a create endpoint and its edit endpoint together: a rule enforced on one path only leaves the other as a way back in.
**Saw it in:** `packages/backend/src/businessLogic/src/PostManager.ts` (requireContent in create and update)
**Context:** `updatePost` already accepted `{caption: null}`, so closing only POST would have left the hole open.

## CAND-008 [review-reflect]
**Claim:** Before allowing a new kind of content on the API (media-only post), check a screen can render it.
**Saw it in:** `packages/frontend/src/features/feed/PostCard.tsx:157`
**Context:** No frontend file reads `media_url`; media-only posts show as a bare header.

## CAND-006 [review-corr]
**Claim:** When create and update validate the same field, share one normalizer; otherwise the two paths store different shapes (trimmed/null vs raw/'').
**Saw it in:** `packages/backend/src/businessLogic/src/PostManager.ts` (`createNewPost` vs `updatePost`)
**Context:** create trims and nulls blanks, update stores as sent.

## CAND-007 [review-corr]
**Claim:** A "merge patch onto stored row, then validate" rule is a read-then-write; concurrent edits can each pass and jointly break the invariant, so back it with a DB constraint if it matters.
**Saw it in:** `packages/backend/src/businessLogic/src/PostManager.ts` (`updatePost` merged check)
**Context:** two edits clearing caption and media separately can both pass.


## Candidate verdicts

| Candidate | Verdict | Target / Reason |
|---|---|---|
| CAND-001 | promote | LESSON-BUG-001-1 |
| CAND-002 | promote | LESSON-BUG-001-2 |
| CAND-003 | demote-to-gotcha | ^g48 |
| CAND-004 | demote-to-gotcha | ^g48 |
| CAND-005 | demote-to-gotcha | ^g48 |
| CAND-006 (refl) | promote | LESSON-BUG-001-1 (siblings sentence) |
| CAND-007 (refl) | promote | LESSON-BUG-001-2 (tighten both) |
| CAND-008 | discard | resolved by the caption-required decision (m2) |
| CAND-006 (corr) | promote | LESSON-BUG-001-2 |
| CAND-007 (corr) | demote-to-gotcha | ^g49 |
