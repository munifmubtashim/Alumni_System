# TASK-004 — App shell header to S1

| Field | Value |
|---|---|
| REQ | REQ-004 |
| Tier | 1 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-001 |
| Blocks | TASK-005 |

## Goal

The header follows `docs/design/screens/app/S1-*` (Alma logo, account menu, theme toggle; light/dark, phone), with **no nav links** (AC7). Auth behaviour is unchanged.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/app/AppShell/AppShell.tsx`, `AppShell.module.css` | edit — `<Link to="/" className={styles.brand}><Logo label={BRAND_NAME} showWordmark /></Link>`; S1 spacing |
| `packages/frontend/src/app/AppShell/HeaderAuth.tsx` | edit only if S1 styling needs a class hook; no behaviour change |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx` | edit — add a "no nav links" case (the brand-text edits were done in TASK-001) |

## Approach

- **Header:** S1 desktop is a single row (logo left, actions right) with a hairline `--border-subtle`; padding from `--space-*`. On phones the actions wrap under the logo, as today.
- **Brand link:** the link's accessible name must stay "Alma" (Logo wordmark text), so the banner `toHaveTextContent('Alma')` passes.
- **No nav:** S1's Directory/Feed/My Profile/Admin links are left out (AC7). The test asserts no `navigation` landmark inside the banner.
- **Untouched:** keep the skip link and `SessionBridge` mount exactly as they are.

## Acceptance

- [ ] AppShell tests pass; only the new case is added
- [ ] `npm run lint`, `npm run typecheck`, `npm test` pass

## Notes

### Implementation notes (2026-10-06)

- Header: `background: var(--surface-raised)`, hairline `--border-subtle`, padding `space-3 space-4` (phone, S1 14px/16px), `space-3 space-6` + `min-height: 4rem` from 48rem (S1 64px). No new contrast pairs: ink-primary/ink-secondary/accent on surface-raised are already in `contrast.test.ts`.
- Brand: `<Link to="/" className={styles.brand}><Logo label={BRAND_NAME} showWordmark /></Link>`; link name "Alma" from the wordmark.
- **Deviation from Approach:** "no navigation landmark inside the banner" is false for guests, because HeaderAuth already wraps Log in / Sign up in `<nav aria-label="Account">`. The new test asserts the guest banner's only nav is "Account" and its links are exactly Alma, Log in, Sign up; signed in, no nav and only the Alma link (CAND-005).
- Kept the existing DOM order (auth area, then theme toggle). S1 shows the toggle before the avatar; swapping would change tab order, which the brief ruled out.
- HeaderAuth.tsx not edited. typecheck, lint, format:check, `npm test` (446 passed) green.

## Related

- Architecture: [[specs/2026-10/m/REQ-004-alma-rebrand-auth-shell/architecture]]
