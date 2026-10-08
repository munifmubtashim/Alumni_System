# ADR-06 — `src/config/`: a leaf layer for app-wide constants ^ADR-06

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-06 |
| Author | munifmubtashim (drafted by Claude) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | [[REQ-004]] · [[knowledge/lessons/LESSON-REQ-001-4-import-boundary-lint-must-match-docs\|L-REQ-001-4]] |

## Context

REQ-004 needed the product name ("Alma") in the app header (`app/`) and on the auth pages (`features/auth`), and a support e-mail in `features/auth`. The constants used to live in `app/brand.ts`, but `features/` may not import `app/` (lint-enforced). A shared home was needed that every layer may read and that can't grow dependencies.

## Considered options

### Option 1 — `src/config/`, a lint-enforced leaf
Constants and small pure contracts only (amended by REQ-008, 2026-10-07: a pure file such as `directoryReturn.ts`, which owns the router-state key and the route paths that two lazy features share, is allowed because neither lazy feature may import the other, ADR-08). `config/` may not import `app`, `features`, `components`, `store` or `services`; `components/ui` may not import `config/`, because primitives stay prop-driven and take brand text as a prop. Enforced by ESLint blocks plus ban/allow fixtures.
**Pros:** one source for brand values; impossible to create a cycle; ui stays reusable. **Cons:** one more folder and boundary to keep documented.

### Option 2 — keep constants in `app/` and pass them down as props
**Pros:** no new folder. **Cons:** prop-drilling a product name through routes; `features/` still can't reach the support e-mail.

### Option 3 — put them in `features/` (e.g. `features/brand`)
**Pros:** no new layer. **Cons:** constants aren't a feature; `app/` importing a feature for a string blurs the layers.

## Decision

**We chose Option 1.**

## Consequences

- Brand and support values live in `src/config/brand.ts` (`BRAND_NAME`, `SUPPORT_EMAIL`, `PASSWORD_RESET_SUBJECT`, `supportMailto`).
- `index.html`'s `<title>` is a second copy (static HTML can't import), pinned by a test in `config/brand.test.ts` ([[knowledge/gotchas#^g20|G20]]).
- Adding a value to `config/` never needs a new boundary; adding anything that imports into `config/` is a lint error.

## Related

- [[REQ-004]] · [[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]] (prop-driven primitives)
