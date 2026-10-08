# BUG-001-feed-null-caption-crash — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-08 |
| Branch | bugfix/BUG-001-feed-null-caption-crash |
| Base | redesign |
| Commits | 1 (8d37cfc8) |
| Files changed | 8 |

Full narratives: `review-log.md`.

## Summary

- Round 2: m1, m2 resolved (correctness re-check). New: 1 trivial (CORR-004, wording of the 400 on a media-only edit — leave). Open: m3 follow-up, m4 at wrap-up.
- 0 critical · 0 major · 4 minor (1 actionable, 3 your call) · 1 trivial. Packet 86KB.
- Reviewed by: correctness (balanced) · reflector (balanced).
- Every null/undefined/blank caption path is safe; the create validation, the caption-or-media rule and the update merge are correct; the ownership check is still first; no regressions; no ADR conflict.

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| m1 | minor | resolved, round 2 | — | — | — |
| m2 | minor | resolved, round 2 (caption required; media-only refused) | — | — | — |
| m3 | minor | two concurrent edits (one clears caption, one clears media) can still leave an empty post | PostManager.updatePost | medium | your call |
| m4 | minor | conventions-api.md doesn't state the new post rules | .adlc/context/conventions-api.md | trivial | your call (/wrapup) |
| t1 | trivial | author_photo typed `string` but column is nullable (safe: Avatar takes null) | shared post/comment types | trivial | — |

## Consolidated by severity

- **m1** correctness + reflector (CORR-002, REFL-003): run update's string values through the same blank→null + trim normalizer as create; update the "no trimming" test.
- **m2** correctness + reflector (CORR-003, REFL-001): either require a caption until media is rendered, or accept media-only posts (documented) — composer can't create them today.
- **m3** correctness (CORR-001): unlikely race; a DB `CHECK (caption IS NOT NULL OR media_url IS NOT NULL)` would close it, but needs a migration and cleanup of existing rows — follow-up.
- **m4** reflector (REFL-002): /wrapup adds the rules to conventions-api.

## Acceptance criteria check

- [✓] null / missing / '' / whitespace caption renders with no paragraph; rest of the feed renders (tests + live DB check)
- [✓] regression tests fail on the old guard, pass now
- [✓] other caption reads checked (profile card, edit initial value, optimistic create)
- [✓] API refuses a post with neither caption nor media (400), on create and update
