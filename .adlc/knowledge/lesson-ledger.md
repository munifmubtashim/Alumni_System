# Lesson ledger

<!-- GENERATED from knowledge/lessons/ — do not hand-edit.
     Rebuilt (whole file) by /wrapup, /task, /bugfix, /recover, and /config migrate,
     from each lesson's header lines only:
       grep -h '^# \|^| ID \|^| Tags \|^| Severity \|^| REQ \|^> \*\*STATUS: superseded' knowledge/lessons/LESSON-*.md
     This file carries merge=union in .adlc/.gitattributes: a parallel merge can leave a
     duplicated row. That is expected — the next rebuild clears it. A merge conflict here
     is resolved by rebuilding, never by hand. -->

One row per lesson file. Title is the H1 without its `^L…` anchor. Superseded lessons render as `~~ID~~` with `→ LESSON-…` after the title. Order: legacy `LESSON-NNN` ascending, then `LESSON-<WORK_ID>-<n>` by work ID, then `<n>`.

| ID | Title | Tags | Severity | REQ |
|---|---|---|---|---|
| LESSON-REQ-001-1 | Pick toolchain majors by plugin peer ranges, not by "latest" | toolchain, typescript, eslint, vitest | guideline | REQ-001 |
| LESSON-REQ-001-2 | After a major React bump in a workspace, prove there is one React copy | npm-workspaces, react, dependencies | trap | REQ-001 |
| LESSON-REQ-001-3 | Vitest 5 Node-side tests: per-file environment comment, DOM-safe setup, and live in scripts/ | vitest, testing, typescript | guideline | REQ-001 |
| LESSON-REQ-001-4 | Import-boundary lint must match the documented boundaries, with a fixture per boundary | eslint, architecture, import-boundaries | trap | REQ-001 |
| LESSON-REQ-001-5 | Keep component styling in CSS Modules — inline styles bypass the token lint | css, design-tokens, linting | guideline | REQ-001 |
| LESSON-REQ-001-6 | When fixing contrast for one use of a token, sweep every use and pin the pairs in the contrast test | accessibility, contrast, design-tokens | guideline | REQ-001 |
| LESSON-REQ-001-7 | Put page-level errorElement on a path-less child route, and build routes from a factory | react-router, routing, error-handling | guideline | REQ-001 |
| LESSON-REQ-001-8 | When an ADR changes a convention, update CLAUDE.md conventions in the same REQ | adr, conventions, docs | guideline | REQ-001 |
| LESSON-REQ-001-9 | Guard Jotai storage atoms against throwing storage; test reload with resetModules | jotai, state, testing | trap | REQ-001 |
