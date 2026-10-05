# Vault Index

A table of contents for the vault. Claude reads this when answering "what do we know about X" — it's faster than walking every file.

## How this file is maintained

Updated by `/wrapup` at the end of each REQ. You can also edit it manually. When a new artifact is created, add a row in the appropriate section with a one-line description.

---

## Specs

_(REQ pages by id, with a one-line summary)_

`Path` is vault-relative and is the one place a REQ's folder location is written down — `/wrapup` repoints it when a REQ is archived, and `/config migrate` repoints it when folders are bucketed. Everything else refers to a REQ by **ID** and resolves the path at read time.

| REQ | Title | Status | Path |
|---|---|---|---|
| REQ-001 | Rebuild the frontend foundation on the new design system | merged 2026-10-05 (PR #14) | specs/_archive/2026-10/m/REQ-001-frontend-foundation |

## ADRs

| ID | Title | Status | Decided |
|---|---|---|---|
| [[architecture/adr-01-ui-layer-headless-css-modules\|ADR-01]] | UI layer: Base UI headless + CSS Modules on generated tokens | accepted | 2026-10-04 |
| [[architecture/adr-02-server-state-tanstack-query\|ADR-02]] | TanStack Query for server state; Jotai for client state | accepted | 2026-10-04 |

## Concepts

Patterns, rules that must always hold, domain models.

| Page | One-line summary |
|---|---|
| [[knowledge/concepts/design-tokens]] | tokens.json → generated CSS variables; tokens-only enforced by lint; contrast pinned by test |

## Components

One page per major module.

| Page | Module | Owner |
|---|---|---|
| [[knowledge/components/frontend]] | `packages/frontend` | munifmubtashim |

## Lessons

See [[knowledge/lesson-ledger]] — generated, one row per lesson, rebuilt by every skill that writes a lesson. Not edited here.

## Gotchas

See [[knowledge/gotchas]] — single-file consolidated list with `^g##` anchors.

## Reference

Cross-cutting reference docs that don't fit elsewhere.

| Page | What it covers |
|---|---|
| _(empty)_ | |
