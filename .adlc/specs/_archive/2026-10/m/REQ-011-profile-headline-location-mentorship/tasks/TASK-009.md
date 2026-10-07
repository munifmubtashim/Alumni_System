# TASK-009 — Design comparison and fixes

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 3 |
| Status | complete |
| Repo | alumni-system |
| Depends on | TASK-005, TASK-006, TASK-007 |
| Blocks | — |

## Goal

Screenshots of My Profile, a public profile and the directory sit beside S5, S3, S2 at desktop and phone, light and dark; differences are fixed or explained (AC15).

## Files to touch

| Path | Action |
|---|---|
| `.adlc/specs/2026-10/m/REQ-011-profile-headline-location-mentorship/ui-evidence/` | create |
| frontend CSS/components as needed | edit |

## Approach

- Apply 004 to the dev database (ask first), run API + frontend, seed one alumnus with all five fields.
- Capture 1440 px and 390 px, light and dark, for the three pages and the matching design files; write `differences.md`. Fix what differs.

## Acceptance

- [ ] 12 comparisons (3 pages × 2 widths × 2 themes) saved
- [ ] Remaining differences listed with reason

## Notes

Applying a migration to the dev database is a schema change: stop and confirm with the user first.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md

## TASK-009a

Fix from the design comparison: the public profile's "Available for mentorship" badge was a `Tag tone="success"` (grey fill, green dot); S3 draws a round sage pill.

- New colour tokens in `docs/design/design-system/tokens.json`: `success-soft` (light `#e9efe5`, dark `#2a3326`) and `success-strong` (light `#4f6947`, dark `#93b188`), the design's own values. `tokens.css` regenerated; the design-system README table lists both.
- Contrast: `success-strong` on `success-soft` is 5.21:1 light, 5.55:1 dark; pair added to `styles/contrast.test.ts`.
- The pill lives in `features/profile/ProfileHeader` (span + aria-hidden 10px svg dot, `currentColor`), styled in its CSS module with tokens only: `radius-pill`, padding `space-1` / `space-2 + space-1/2` (10px), gap 6px as `calc`, `text-caption` (12px/500). `Tag` is unchanged (one use, so no new Tag tone); the directory "Mentor" tag is untouched.
- Out-of-list edit: `scripts/generate-tokens.test.ts` pins the colour count; bumped 15 -> 17 (forced by the authorized token addition).
- Not changed: the copied design-bundle token files under `docs/design/screens/*/ds/alumni-network/tokens.json` (design exports, not read by code).
