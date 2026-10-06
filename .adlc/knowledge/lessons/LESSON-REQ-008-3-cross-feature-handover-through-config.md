# Hand state between two lazy features through one config/ contract that validates on read, and test it by clicking through ^L-REQ-008-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-008-3 |
| Captured | 2026-10-07 |
| REQ | REQ-008 |
| Component | frontend |
| Tags | frontend, routing, router-state, config, adr |
| Severity | guideline |

## The lesson

Lazy features may not import each other (ADR-08), so a handover such as the directory's search string reaching the profile's Back link needs a neutral home: a small pure file in `config/` that owns the state key, the producer (`directoryReturnState`), the consumer (`directoryReturnPath`) and the route paths. The consumer takes `unknown` and validates (a string that is empty or starts with `?` and has no `#`), so tampered or missing `location.state` falls back to the plain page. Test the handover by clicking the link into a stub route that renders `useLocation().state`; the `href` never shows state, so an href-only test cannot catch a dropped `state` prop. When a leaf layer's ADR says "constants only" and a REQ adds logic to it, amend the ADR in the same REQ (ADR-06 was not).

## Saw it in

- `config/directoryReturn.ts`, `features/directory/AlumniCard.tsx`, `features/profile/BackLink.tsx` — [[REQ-008]] (CAND-003, CAND-016, CAND-027)

- Related: [[architecture/adr-06-config-leaf-layer|ADR-06]] · [[architecture/adr-08-route-code-splitting-and-url-list-state|ADR-08]] · [[knowledge/lessons/LESSON-REQ-006-1-url-mirrored-input-own-write|L-REQ-006-1]]
