# {{TITLE}} ^L-{{WORK_ID}}-{{N}}

> **File:** `knowledge/lessons/LESSON-{{WORK_ID}}-{{N}}-<slug>.md` — `{{WORK_ID}}` is the REQ or BUG ID this lesson came from, `{{N}}` counts within it (mint per `core/VAULT-LAYOUT.md` → `mint(lesson)`).
> **Minimum required fields**: metadata table (including **Tags**), "The lesson", and "Saw it in".
> Optional sections below are filled the first time the lesson recurs in a future REQ, or when reflector surfaces it as relevant — born minimal, grown on demand.
> If this lesson replaces an older one, fill `Supersedes` here **and** put the banner `> **STATUS: superseded by [[knowledge/lessons/LESSON-…]]** — <date>` at the top of the old file; the reflector skips banner-marked lessons and the ledger strikes them through.

| Field | Value |
|---|---|
| ID | LESSON-{{WORK_ID}}-{{N}} |
| Captured | {{DATE}} |
| REQ | {{WORK_ID}} |
| Component | {{COMPONENT}} |
| Tags | {{TAGS}} — required: 2–5 lowercase tokens, component names or domains as `exploration.md` / the blast radius name them (`payments`, `queue-handlers`, `auth`). This is what tiered loading will filter on. |
| Severity | nice-to-know \| guideline (a rule to follow) \| trap (cost real time before) \| critical (must never repeat) |
| Supersedes | _(optional)_ LESSON-… |

## The lesson

The single sentence to remember. Written as a do/don't or a rule you can check.

> Always declare Firestore composite indexes before deploying queries that need them.

## Saw it in

- `src/path/to/file.ts:42` — short note on what it looked like there
- (additional file references if applicable)

---

## Optional — fill in when it happens again

### What happened

One paragraph. The situation that produced the lesson. What was expected, what actually happened.

### Why it matters

What breaks if this lesson isn't applied. Concrete consequences — bugs, perf regressions, security issues, wasted time.

### How to apply

Concrete steps. When should the architect agent surface this lesson? What should task-implementer do differently?

- During `/architect`: check for new compound `where` clauses in queries.
- During `/implement`: if adding a query with multiple `where` clauses on the same collection, add the index to `firestore.indexes.json` in the same task.

### When this doesn't apply

Edge cases or contexts where the rule is wrong. Important — over-applied lessons cause as much damage as missing ones.

### Related

- Originating REQ: {{WORK_ID}} — resolve the folder per `core/VAULT-LAYOUT.md`; this lesson outlives the REQ, so it records the ID, not a path that archiving would break
- Concepts: {{CONCEPT_LINKS}}
- Components: {{COMPONENT_LINKS}}
- See also: {{LESSON_LINKS}}
