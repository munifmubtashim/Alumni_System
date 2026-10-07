# A spec that names a constant must be checked against the branch it will be built on: it may exist only on an unmerged sibling branch ^L-REQ-012-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-012-1 |
| Captured | 2026-10-07 |
| REQ | REQ-012 |
| Component | frontend, process |
| Tags | process, branches, merge |
| Severity | guideline |

## The lesson

Before planning a rename or label change, grep the work branch for every constant and string the spec cites. When parallel REQs touch the same strings, name the merge hazard in the PR draft and the merge checklist so the second merge fixes the leftover text and the conflicting test lines.

## Saw it in

- REQ-012 cut from `redesign` while REQ-011 was unmerged: `HIDDEN_FIELD_HINT` ("Open My Profile on a wider screen…") exists only on REQ-011's branch and will be stale after both merge (resolved: REQ-013 deleted the constant) (CAND-001, correctness C-1).
