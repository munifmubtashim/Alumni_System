# Adding a lazy feature means editing six places, and the vault copies have no check ^L-REQ-009-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-009-4 |
| Captured | 2026-10-07 |
| REQ | REQ-009 |
| Component | app, eslint, vault |
| Tags | frontend, lazy-routes, eslint, docs, vault |
| Severity | guideline |

## The lesson

When a lazy feature is added, update `LAZY_FEATURES` in `eslint.config.js` and in `lazyRoutes.test.ts`, the fixtures in `scripts/enforcement.test.ts`, every README that counts lazy pages (`app/README.md`, `features/README.md`, `frontend/README.md`, root `CLAUDE.md`), and the vault copies (ADR-08's count, `route-layout.md`, `components/frontend.md`); nothing fails if one is forgotten.

## Saw it in

- `packages/frontend/eslint.config.js:77`, `packages/frontend/src/app/lazyRoutes.test.ts:20`, `packages/frontend/src/app/README.md:8`
- Reflector REFL-002: vault copies went stale in REQ-008 and REQ-009
