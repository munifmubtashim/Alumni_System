# REQ-015 — Visual check against S6

The running admin page was screenshotted next to each S6 design file at the same width (desktop 1440, phone 390), light and dark, with the drawer and the delete dialog open. Seed data only.

**How:** headless Brave driven by a scratchpad CDP (Chrome DevTools Protocol) script; Claude in Chrome was not connected. Screenshots were compared by eye (layout, spacing, type, colour). Keyboard behaviour (Tab stays inside the drawer and dialog, Enter submits the drawer form) is checked separately by the orchestrator, not here.

| S6 file | App screenshot | Result |
|---|---|---|
| `S6-Desktop-Light.dc.html` | `app-Desktop-Light.png` | **Fixed:** table rows were about 43px, S6 about 59px; the actions cell no longer trims its padding, so rows are about 57px (cells `space-3` `space-4`, 32px buttons). Header cells now `space-1` `space-4` `space-2` (S6 0 16px 10px; 4px top so the sort button's focus ring is not clipped). Stat numbers were already weight 600 (`heading-lg`, 28px vs S6 26px, nearest token). **Deliberate:** built shell header (Alma logo, theme toggle, no My Profile link), the spec's four stat labels in neutral colours, shared `SearchField` (sunken, 16px text). |
| `S6-Desktop-Dark.dc.html` | `app-Desktop-Dark.png` | **Fixed:** same CSS as light (rows, header). **Deliberate:** same as light; colours come from the dark tokens. |
| `S6-Phone-Light.dc.html` | `app-Phone-Light.png` | **Fixed:** stat cards padding `space-3` (S6 14px; was `space-4`), about 74px tall (S6 about 70px); value `heading-md` weight 600 (S6 20px/600); label `caption` (12px, nearest to S6 11px). Phone cards padding `space-3` `space-4` and no gap between name and detail, about 64px (was about 72px, S6 about 62px). Row buttons keep a 44px tap target through a `::before` (G35) with a 12px gap so hit areas don't overlap. **Deliberate:** Prev/Next and count also on phones; built tab bar ("Account"). |
| `S6-Phone-Dark.dc.html` | `app-Phone-Dark.png` | **Fixed:** same CSS as phone light. **Deliberate:** same as phone light. |
| `S6-AddDrawer.dc.html` | `app-AddDrawer.png`, `app-AddDrawer-Dark.png`, `app-Phone-AddDrawer.png` | **Matches** in layout. **Deliberate:** inputs are the shared `Input` primitive (sunken background, 16px text so iOS doesn't zoom, its label style), as on every other form; backdrop also covers the header (S6 starts below it; the header can't be used while the drawer is open); help text under Temporary password; no Role select; "Current role" and "Company" are two fields; full width on phones (S6 has no phone drawer). |
| `S6-DeleteConfirm.dc.html` | `app-DeleteConfirm.png` | **Fixed:** `ConfirmDialog` was about 400px wide with 24px padding; now 28.5rem (456px, S6's 400px content + 2 × 28px) with `space-6` (32px) padding from 48rem, `space-5` on phones, still capped at the screen width minus a gutter; radius `radius-lg` (14px, S6 16px), gap `space-4` (S6 18px). **Deliberate:** no shadow (lint bans it; hairline border instead); backdrop covers the header; text says "Alma" via `BRAND_NAME`. |

All deliberate differences are also listed in `packages/frontend/src/features/admin/README.md` → "Deliberate differences from S6".
