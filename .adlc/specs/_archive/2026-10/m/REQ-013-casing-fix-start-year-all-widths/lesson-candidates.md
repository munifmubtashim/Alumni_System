## CAND-001 [implement-task]
**Claim:** Before hiding an editable field at some width, count the error-routing code it will need; showing it is often cheaper than the machinery.
**Saw it in:** `packages/frontend/src/features/me/ProfileForm.tsx:150` (REQ-011 version: isHidden, withOrderHint, HIDDEN_FIELD_HINT)
**Context:** Removing one phone-hidden field deleted ~60 lines of code, two exports and five tests.

## CAND-002 [implement-task]
**Claim:** When a gotcha's fix is reversed (rename instead of re-import), rewrite its title and mark the old rule historical, or readers follow the stale rule.
**Saw it in:** `.adlc/knowledge/gotchas.md:505` (G22 said "import it as ./baseDTO")
**Context:** G22 and G32 gave opposite advice once the disk name drifted; components/backend.md still labels G22 "baseDTO casing".

## CAND-003 [review-reflect]
**Claim:** When a REQ deletes the code a lesson or ADR note cites as its evidence, add a dated "resolved/removed in REQ-N" note to that page at wrapup instead of leaving it present-tense.
**Saw it in:** `.adlc/knowledge/lessons/LESSON-REQ-011-2-css-hidden-fields.md:18`, `.adlc/architecture/adr-04-forms-without-a-library.md:44`
**Context:** Lessons and the ADR-04 row still describe `.wideOnly` routing as live one REQ after it was deleted.

## Candidate verdicts

Dedup basis: origin/redesign as of the last fetch (a few hours old, 55 lessons seen); no duplicate found.

| Candidate | Verdict | Target / Reason |
|---|---|---|
| CAND-001 | discard | folded into the dated update on LESSON-REQ-011-2 |
| CAND-002 | discard | already fixed: G22 rewritten and G32 corrected in this REQ |
| CAND-003 | promote | LESSON-REQ-013-1 |
