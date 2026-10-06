
## CAND-901 [review-corr]
**Claim:** `str.split(/\s+/)[0] ?? fallback` never uses the fallback; split of "" returns `['']`. Test for empty string explicitly.
**Saw it in:** `packages/frontend/src/features/home/HomePage.tsx:26`
**Context:** First-name helper for the greeting.

## CAND-902 [review-corr]
**Claim:** A sticky bottom bar needs a matching `scroll-padding-bottom`, or keyboard focus lands behind it.
**Saw it in:** `packages/frontend/src/app/AppShell/BottomTabs.module.css:9`
**Context:** New phone tab bar.

## CAND-001 [review-reflect]
**Claim:** When a primitive gains a prop, size or export, update its row in `components/ui/README.md` and the vault component page in the same REQ.
**Saw it in:** `packages/frontend/src/components/ui/README.md:15,17,18`
**Context:** Menu `label`/`MenuSeparator` and Avatar `xs` were added; the table was not touched (repeat of L-REQ-002-6 for primitives).

## CAND-002 [review-reflect]
**Claim:** Size/colour choices that map a design value to a calc() of tokens should be listed once in a design-gap note, not only in CSS comments.
**Saw it in:** `packages/frontend/src/features/home/HomePage.module.css`, `app/AppShell/AppShell.module.css`
**Context:** Many 10px/14px/20px calc() workarounds; the requirement says gaps are listed after the screenshot pass.

## Candidate verdicts

| Candidate | Verdict | Why |
|---|---|---|
| CAND-901 | discard | Fixed here; too narrow to keep |
| CAND-902 | promote | LESSON-REQ-007-1 |
| CAND-001 | discard | Repeat of L-REQ-002-6; docs were fixed in this REQ |
| CAND-002 | discard | The gaps are listed in pr-draft.md; no lasting rule |
