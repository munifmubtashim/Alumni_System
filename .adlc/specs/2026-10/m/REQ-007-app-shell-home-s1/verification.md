# REQ-007 verification

Reviewers: correctness, past-mistakes check (reflector). UI checked by hand in the browser (see pr-draft.md); no ui-reviewer run. Narrative: review-log.md.

| ID | Sev | Reviewer | Summary | Status |
|---|---|---|---|---|
| CORR-001 | minor | correctness | `firstNameOf` fallback never used; blank name gives "Welcome back, " | fixed |
| CORR-002 | minor | correctness | While /me loads or fails, account button is an empty circle | fixed |
| CORR-003 | minor | correctness | Sticky tab bar may cover a focused control at page bottom (unconfirmed) | fixed |
| REFL-001 | minor | reflector | ui/README.md and frontend README stale: Menu label/MenuSeparator, ThemeToggle, Avatar xs | fixed |
| REFL-002 | minor | reflector | route-layout concept diagram stale | fixed |
| REFL-003 | minor | reflector | knowledge/components/frontend.md lacks new pieces | fixed |
| REFL-005 | minor | reflector | ThemeToggle `full` variant now unused but documented as live | fixed |
| REFL-004 | trivial | reflector | features/README.md omits Home cards | fixed |

Critical 0 · major 0 · minor 7 · trivial 1.
