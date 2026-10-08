# A new nav entry or menu item means grepping every README for the old entry list, not only the lazy-page counts ^L-REQ-010-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-010-5 |
| Captured | 2026-10-07 |
| REQ | REQ-010 |
| Component | frontend, docs |
| Tags | frontend, docs, navigation, vault |
| Severity | guideline |

## The lesson

Beyond LESSON-REQ-009-4's six lists, search all READMEs and vault pages for the old nav and menu wording ("Directory and Feed", a menu of "Log out" only), each path-constant list (`config/README.md`), and the "may not import" line in every other lazy feature's README; nothing fails if one is missed.

## Saw it in

- `packages/frontend/README.md`, `src/app/README.md`, `features/feed/README.md`, `features/profile/README.md`, `.adlc/knowledge/components/frontend.md` went stale together (REFL-002, CAND-002/018/023); fixed in review round 2


## Saw it again

- [[REQ-015]]: the feed, me and profile READMEs' "may not import" lines had missed `about` (REQ-014); fixed with `admin`.
