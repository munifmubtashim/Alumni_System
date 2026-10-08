# A profile-completeness measure may only count fields the app lets the user edit ^L-REQ-016-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-016-2 |
| Captured | 2026-10-08 |
| REQ | REQ-016 |
| Component | frontend |
| Tags | frontend, home, profile, ux |
| Severity | guideline |

## The lesson

REQ-016's spec counted the profile photo, but Account settings has no photo control (there is no upload endpoint). Users who filled everything else were stuck below 100% with a next step that led nowhere. When a spec lists the fields, check each against an editor before building the bar; the photo was dropped at the implement gate and `profileCompleteness.ts` says where to add it back.

## Saw it in

- `features/home/profileCompleteness.ts` — [[REQ-016]] (CAND-010)
