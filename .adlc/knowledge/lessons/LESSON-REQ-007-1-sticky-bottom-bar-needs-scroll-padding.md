# A sticky bottom bar needs a matching scroll-padding, or focus lands behind it ^L-REQ-007-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-007-1 |
| Captured | 2026-10-06 |
| REQ | REQ-007 |
| Component | frontend |
| Tags | frontend, accessibility, focus, layout, phone |
| Severity | guideline |

## The lesson

The phone tab bar is `position: sticky; bottom: 0`. When a keyboard user tabs to a control near the bottom of a page, the browser scrolls it just into view, which can leave it under the bar. Give the scroll container a `scroll-padding-block-end` at least as tall as the bar (set in `styles/global.css` below 48rem). Any future fixed or sticky bar needs the same.

## Saw it in

- `styles/global.css`, `app/AppShell/BottomTabs.module.css` — [[REQ-007]]
