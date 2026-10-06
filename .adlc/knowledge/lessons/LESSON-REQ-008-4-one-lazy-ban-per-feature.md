# Give each lazy feature its own import ban and guard check, each exempting only its own folder ^L-REQ-008-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-008-4 |
| Captured | 2026-10-07 |
| REQ | REQ-008 |
| Component | frontend |
| Tags | frontend, eslint, lazy-routes, adr |
| Severity | guideline |

## The lesson

One shared ban that skips every lazy folder lets lazy features import each other statically. In flat config the options of a rule do not merge across matching blocks, so the bans are split by non-overlapping file region: the rest of `src/` bans all lazy features; each lazy folder bans the others. `lazyFeatureBoundaries()` in `eslint.config.js` generates the blocks, and `app/lazyRoutes.test.ts` runs the same check once per feature as a second layer. A third lazy feature is one entry in `LAZY_FEATURES` in both files; prove the new ban on a real file (a temporary import must fail lint and the test).

## Saw it in

- `packages/frontend/eslint.config.js`, `src/app/lazyRoutes.test.ts` — [[REQ-008]] (CAND-012, CAND-017)

- Related: [[architecture/adr-08-route-code-splitting-and-url-list-state|ADR-08]] · [[knowledge/gotchas#^g27|G27]]
