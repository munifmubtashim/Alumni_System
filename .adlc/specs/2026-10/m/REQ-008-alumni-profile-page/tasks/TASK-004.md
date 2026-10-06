# TASK-004 — Directory handover of search state

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-006 |

## Goal

Directory handover of search state.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/config/directoryReturn.ts` | create |
| `packages/frontend/src/config/directoryReturn.test.ts` | create |
| `packages/frontend/src/features/directory/AlumniCard.tsx` | edit |
| `packages/frontend/src/features/directory/AlumniCard.test.tsx` | edit |
| `packages/frontend/src/config/README.md` | edit |

## Approach

- `directoryReturnState(search)` → `{ directorySearch: search }`; `directoryReturnPath(state)` → `/directory` + the string if it is a string that is empty or starts with `?` and has no `#`, otherwise `/directory`. Export `DIRECTORY_PATH = '/directory'`.
- `AlumniCard` reads `useLocation().search` and passes it as `state` on its `Link`. The `to` stays `/alumni/<id>`; the card still renders inside a router in tests.
- Leaf rules: no React, no other imports.

## Acceptance

- [ ] Garbage state (null, number, object without the key, non-string, `'x'`, `'?a#b'`) gives `/directory`; `'?q=ann&page=2'` is restored exactly; empty string gives `/directory`.
- [ ] A card rendered at `/directory?q=ann` links with that state; existing href test still passes.
- [ ] ESLint boundary tests for `config/` still pass.

## Notes

Do not import anything from `features/profile`. The key name `directorySearch` lives only in this config file.

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
