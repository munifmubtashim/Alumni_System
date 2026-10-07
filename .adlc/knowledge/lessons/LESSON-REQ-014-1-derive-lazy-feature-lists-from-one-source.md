# The lazy-feature checklist was missed again; derive the lists from LAZY_FEATURES ^L-REQ-014-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-014-1 |
| Captured | 2026-10-07 |
| REQ | REQ-014 |
| Component | app, eslint, vault |
| Tags | frontend, lazy-routes, eslint, docs, vault |
| Severity | guideline |

## The lesson

Adding the fifth lazy page, the six-place checklist of [[knowledge/lessons/LESSON-REQ-009-4-adding-a-lazy-feature-touches-six-lists|L-REQ-009-4]] was again only partly done: the ESLint fixtures in `scripts/enforcement.test.ts` and four doc lists were missed until review. Advice is not enough; a test that fails when a folder under `features/` that `router.tsx` loads with `import()` is missing from `LAZY_FEATURES`, the fixtures or the docs would make the miss impossible. Until then, grep for the previous feature's name (`grep -rn "feed" --include=*.md --include=*.ts`) and update every hit that lists lazy pages.

## Saw it in

- Reflector REFL-001 and REFL-002 on REQ-014: no `about` fixtures, and `features/README.md`, `frontend/README.md`, `CLAUDE.md` and `conventions-frontend.md` lists stopped at `me`
