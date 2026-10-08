# Decide at architect time how to match a design that uses the browser default line height ^L-REQ-008-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-008-5 |
| Captured | 2026-10-07 |
| REQ | REQ-008 |
| Component | frontend |
| Tags | frontend, design-system, stylelint, tokens |
| Severity | guideline |

## The lesson

The S3 designs set no `line-height`, so their text boxes are about 4px shorter (headings) and 6px shorter (the name) than our type tokens; Stylelint's `strict-value` rule rejects `line-height: normal`. Nothing could close that gap inside a REQ, and it surfaced only in the browser comparison at the end. When a design is built from unstyled HTML, settle it at `/architect`: either allow `normal` in the rule (one line, its enforcement test and `conventions.md`), or accept the token line heights and list the difference. Use an exact token line height where one matches (caption 16px, label 18px).

## Saw it in

- `packages/frontend/stylelint.config.js`; `s3-comparison.md` rows desktop 9, 11 and phone 8 — [[REQ-008]] (CAND-015)

- Related: [[knowledge/lessons/LESSON-REQ-004-2-check-design-colours-against-token-pairs|L-REQ-004-2]] · [[knowledge/concepts/design-tokens]]
