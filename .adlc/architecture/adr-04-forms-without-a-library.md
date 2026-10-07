# ADR-04 — Forms: controlled inputs + pure validators + useMutation; no form library (for now) ^ADR-04

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-05 |
| Author | munifmubtashim (drafted by Claude) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | [[REQ-002]] |

## Context

[[REQ-002]] builds the first two forms. Login has 2 fields. Register has 4 to 6 fields depending on role, plus server-error mapping. Later REQs bring My Profile (10+ fields) and the post composer. Checked 2026-10-05: React Hook Form 7.89 (~70M weekly downloads) and Zod 4.6 (~387M) both support React 19. Base UI 1.8 ships `Form`/`Field`, but our own `Input` primitive already wires labels, help text and (now) errors.

## Considered options

### Option 1 — Controlled state + pure validator functions + `useMutation` *(recommended now)*

**Pros:** no new dependency; validators are plain functions with unit tests that mirror backend rules and messages; very little code for two small forms.
**Cons:** each form hand-writes touched and submit state; it doesn't scale well past ~8 fields.

### Option 2 — React Hook Form + Zod (+ @hookform/resolvers)

**Pros:** the industry default; schema reuse; scales to big forms.
**Cons:** three new dependencies for two small forms; Zod schemas would duplicate the backend validators anyway (no shared validation package exists).

### Option 3 — Base UI `Form` + `Field`

**Pros:** already installed; built-in validity handling and aria wiring.
**Cons:** overlaps with our `Input` primitive's label and error wiring; two ways of building a field.

## Decision

**Option 1 now** (accepted at the REQ-002 architecture gate, 2026-10-05). **Revisit when a form passes ~8 fields or needs dynamic field arrays** (My Profile, REQ-010, reached it and stayed with this option; see Consequences), and pick between Option 2 and moving validation into `@alumni/shared` so frontend and backend share one rule set.

## Consequences

| Consequence | Type |
|---|---|
| `features/<x>/validation.ts` holds pure, tested validators per form | convention |
| Client messages mirror the backend's; the server's 400 message is still shown | rule |
| Re-decided at REQ-010 (My Profile, up to 12 fields): **stay with controlled state, pure validators and `useMutation`; no form library.** What held it together: `validation.ts`, `planSave` and `ProfileForm` tests. What hurt: `ProfileForm` grew to ~320 lines, and field rules are now copied three times (backend, auth, me). | decision |
| Re-checked at REQ-011 (My Profile now ~17 controls: five more profile fields, a switch): **still controlled state and pure validators; no form library.** What it cost: a boolean field outside the string-keyed form type, and errors for a CSS-hidden field routed to the form alert (LESSON-REQ-011-2). Revisit trigger unchanged | rule |
| Re-decide when a form needs dynamic field arrays, or when the shared field rules move into `@alumni/shared` (follow-up) | follow-up |

## Related

- [[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]] · [[architecture/adr-02-server-state-tanstack-query|ADR-02]]
