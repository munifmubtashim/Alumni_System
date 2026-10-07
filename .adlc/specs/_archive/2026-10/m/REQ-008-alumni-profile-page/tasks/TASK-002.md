# TASK-002 — Pure formatting helpers

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-005, TASK-006 |

## Goal

Pure formatting helpers.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/profile/format.ts` | create |
| `packages/frontend/src/features/profile/format.test.ts` | create |
| `packages/frontend/src/features/profile/relativeTime.ts` | create |
| `packages/frontend/src/features/profile/relativeTime.test.ts` | create |

## Approach

- `present(value)` (trimmed or undefined), `headline(alumni)` → "Job title at Company · Class of YYYY" (no stray "at" or "·"), `educationLine(alumni)` → "Department · Class of YYYY", `employmentTitle(alumni)` → "Job title · Company", `safeLinkedInUrl(raw)` → normalised string or undefined (only http/https, parsed with URL), `commentCountText(n)` → "0 comments" / "1 comment" / "14 comments".
- `relativeTime(iso, now = new Date())` with Intl.RelativeTimeFormat (numeric always, long): just now, minutes, hours, days, weeks up to 5; older gives a medium date via Intl.DateTimeFormat. An invalid or future date gives the plain date or "just now", never "NaN".
- No React, no I/O.

## Acceptance

- [x] Each helper's missing-part cases give no stray separators.
- [x] `javascript:`, `data:`, relative and malformed LinkedIn values return undefined; `https://www.linkedin.com/in/x` passes.
- [x] Relative time tested with a fixed `now`: 30 s, 5 min, 3 h, 3 days, 2 weeks, 6 weeks (date), future, invalid.
- [x] Tests, typecheck, lint pass.

## Notes

Do not import AlumniCard's private helpers; copy the 3-line `present`. Do not move shared code between features in this REQ.

**Implementation notes (TASK-002):**
- Helper inputs are `Pick<Alumni, ...>` so both the full profile (`Alumni`) and list items fit. All string helpers return `string | undefined` (undefined = hide the line).
- `relativeTime(iso: string | Date, now?)`: under 1 min and any future time read "just now"; minutes/hours/days floor; weeks 1-5 ("5 weeks ago" at 35 days); 42+ days give `Intl.DateTimeFormat('en', { dateStyle: 'medium' })` in local time.
- Deviation: an **invalid** date returns `''` (not "just now" and not a date, since there is no date to show). Callers should hide the time element when it is empty.
- `safeLinkedInUrl` returns `url.href` (normalised, e.g. adds a trailing `/` to a bare host) and also rejects host-less URLs.
- `commentCountText` treats NaN/negative as 0.

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
