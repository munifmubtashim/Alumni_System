# REQ-005-alumni-search-filters — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| Work path | /Users/munifmubtashim/Alumni_System/.worktrees/REQ-005-alumni-search-filters |
| Isolation | worktree |
| Branch | feat/REQ-005-alumni-search-filters |
| Commits | 1 (67ca0355) |
| Base | redesign |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

- **Round 2:** 8 fixes confirmed; new m9 (graduation_year type mix across other shared types) and t3 (trivial). AC6 now fully met.
- **Counts (round 1):** 0 critical · 0 major · 8 minor · 2 trivial (after merging 14 reviewer findings). No ADR conflict; SQL injection, parameter numbering, LIKE escaping and the 400-before-query rule were all checked and hold.
- **Pattern:** small duplication with existing validators (year rule, length limits), one input gap (NUL byte → 500), and type drift around list items and `graduation_year`.
- **Corrected fact:** `alumni.graduation_year` is `integer`. The exploration and stress-test said VARCHAR, mixing it up with `students.expected_graduation_year`. The code is right; the shared types say `string` (m7, needs decision).
- **UI:** not dispatched; no frontend caller of `GET /api/alumni`.
- **Packet:** 103KB. Tests mock the pool, so the manual `psql` check (`q=100%`, `q=a_b`) is still for you to run (checklist below).

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| m1 | minor | A NUL byte in `q`/`department`/`university` passes validation; Postgres rejects it → 500 instead of 400 | validation.ts (optionalText / parseAlumniSearch) | trivial | resolved, round 2 |
| m2 | minor | `parseAlumniSearch` copies `optionalYear`'s year rule | validation.ts | small | resolved, round 2 |
| m3 | minor | Length limits 100/100/150 are bare numbers, repeated in other validators | validation.ts | small | resolved, round 2 |
| m4 | minor | `AlumniPage.items` typed `AlumniDTO[]` (optional email) while shared `AlumniListItem` omits email; names differ across layers | AlumniQuery.ts:23, shared types | small | resolved, round 2 |
| m5 | minor | conventions.md says "reuse `parseAlumniSearch`" for the next list, but the reusable parts (`pagingNumber`, `singleQueryValue`) are private | conventions.md | trivial | resolved, round 2 |
| m6 | minor | New dal types live in AlumniQuery.ts; other businessLogic-facing types live in `dal/dto/` | dal | small | resolved, round 2 |
| m7 | minor | `graduation_year` is integer, but `Alumni` (shared) and `AlumniDTO` say `string`; the API returns numbers | shared, dal DTO | small | resolved, round 2 |
| m8 | minor | Backend component page doesn't mention `searchAlumni` / `escapeLike` / `parseAlumniSearch` | .adlc vault | small | your call (wrap-up) |
| t1 | trivial | Query test picks the items/count calls by position, not by SQL | AlumniQuery.test.ts:50 | trivial | resolved, round 2 |
| m9 | minor | `graduation_year` is now `number \| null` on `Alumni`/`AlumniDTO`, but still `string` on `MyProfile`, the edit payload, `RegisterInput`, `MyProfileRow`, `AlumniEditableFields`, `UpdateMyProfileInput` (pg coerces; harmless at runtime) | shared types, RegisterDTO.ts, UserManager.ts | small | decided: follow-up REQ |
| t3 | trivial | company/job-title/email limits still bare `100`; the `q` comment ties them to `NAME_MAX` | validation.ts | trivial | decided: follow-up (with m9) |
| t2 | trivial | baseDTO import fix should be named in the PR (and is its own concern) | PR / commit | trivial | your call (wrap-up) |

Round 2 (2026-10-06): m1–m7 and t1 confirmed resolved by all four reviewers. New: m9 (minor, type mix), t3 (trivial). QUAL-007 (DTO file style) noted, no action. Backend 331 tests, typecheck clean; shared and frontend typecheck clean.

Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced). All four reports carry a `Written by` line.

## Consolidated by severity

### Minor (8)

- **m1** (correctness CORR-001): reject `\u0000` in `optionalText` (all text inputs benefit) or in `parseAlumniSearch`; add a test.
- **m2** (quality QUAL-001, reflector REFL-003): use `optionalYear(value, "graduationYear")` and convert to a number; same error text.
- **m3** (quality QUAL-002): named constants (`NAME_MAX = 100`, `DEPARTMENT_MAX = 100`, `UNIVERSITY_MAX = 150`) shared with `validateAlumniFields`/`validateUserBasics`.
- **m4** (quality QUAL-003, architecture ARCH-003): `AlumniPage.items: Omit<AlumniDTO,"email">[]`. One name per shape (e.g. dal `AlumniListPage` ↔ shared `AlumniListResponse`), or a comment linking them.
- **m5** (architecture ARCH-001): reword the convention, or export generic `parsePaging` / `singleQueryValue` now.
- **m6** (architecture ARCH-002): move `AlumniSearchFilters`, `AlumniPaging`, `AlumniPage` to `dal/dto/` (like `RegisterDTO.ts`).
- **m7** (reflector REFL-001), **needs decision**: change `Alumni.graduation_year` / `AlumniDTO.graduation_year` to `number` here (touches the frontend's shared type, which nothing reads yet), or file a follow-up.
- **m8** (reflector REFL-002), **wrap-up**: backend component page + a gotcha for the `ESCAPE`-in-template-literal trap.

### Trivial (2)
- **t1** (quality QUAL-004): find calls by `/COUNT\(/` instead of `calls.at(-2)`.
- **t2** (quality QUAL-005, reflector REFL-004), **wrap-up**: name the baseDTO fix in the PR body.

### Manual check (needs a real database)

```
psql "$DATABASE_URL" -c "SELECT u.name FROM alumni a JOIN users u ON a.user_id=u.id WHERE u.name ILIKE '%100\\%%'"   # literal %
curl -s -H "Authorization: Bearer $TOKEN" 'http://localhost:3000/api/alumni?q=100%25'   # 200, not 500
curl -s -H "Authorization: Bearer $TOKEN" 'http://localhost:3000/api/alumni?q=a_b'      # _ literal
```

## Acceptance criteria check

- [✓] AC1 — no params → first page, ordered by name then id, `{ items, total }`
- [✓] AC2 — `q` on name/company/job title, case-insensitive; `%`/`_` escaped (manual DB check pending)
- [✓] AC3 — department/university full case-insensitive; graduationYear exact
- [✓] AC4 — filters combine with AND
- [✓] AC5 — page/pageSize defaults and max; total ignores paging; past-the-end → empty items
- [✓] AC6 — 400 for every listed case, incl. NUL bytes (fixed round 2)
- [✓] AC7 — SQL only in AlumniQuery, all values bound, fixed fragments
- [✓] AC8 — behind authMiddleware; guard test green
- [✓] AC9 — query, manager and route tests (324 pass)
