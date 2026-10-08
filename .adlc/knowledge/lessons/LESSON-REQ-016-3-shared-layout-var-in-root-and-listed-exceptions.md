# A layout value that several pages and shared chrome must agree on goes in `:root`, with the pages that stay off it written down ^L-REQ-016-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-016-3 |
| Captured | 2026-10-08 |
| REQ | REQ-016 |
| Component | frontend |
| Tags | frontend, css, layout, footer |
| Severity | guideline |

## The lesson

The footer could not line up with the page because Home (65rem), Directory (72rem), Profile (53.75rem) and the footer (56.25rem) each carried their own cap. REQ-016 made one `--page-max` and every page and the footer use `min(100%, var(--page-max))` with the same side padding. Declare such a property once in `styles/global.css` `:root` (a property set only on one shell element silently invalidates the rule outside it), and list the pages that deliberately stay off it (Account settings, About, Admin), so the alignment claim is checkable. jsdom has no layout: measure edges in a browser.

## Saw it in

- `styles/global.css`, `app/AppShell/SiteFooter.module.css` — [[REQ-016]] (CAND-003, ARCH-001, QUAL-004)
