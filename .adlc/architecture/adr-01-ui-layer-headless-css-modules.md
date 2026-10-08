# ADR-01 — UI layer: Base UI headless primitives + CSS Modules on generated token variables ^ADR-01

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-04 |
| Author | munifmubtashim (drafted by Claude) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | [[REQ-001]], `docs/design/design-system/` |

## Context

The frontend is being rebuilt from scratch ([[REQ-001]]). The old app used antd, a fully styled component kit. The redesign conventions (root `CLAUDE.md`) require a Scandinavian look from our own design system — warm neutrals, one terracotta accent, hairline borders and **no shadows** — with every color, space and type value coming from tokens, light/dark/system themes, and responsive layouts down to 360px.

The design system (`docs/design/design-system/`) defines tokens and five components (Button, Input, Card, Tag, ThemeToggle). It is deliberately quiet and specific: e.g. Input focus is "the line itself is the only focus signal", Button hover is a border/fill change only. Upcoming pages will also need things the design system doesn't spell out yet and that are hard to make accessible by hand: dialogs, menus, selects/comboboxes, popovers, tooltips, tabs, toasts.

So the decision has two halves that can't be separated: **where behavior and accessibility come from**, and **how styles reach components from the tokens**.

Registry facts checked 2026-10-04: `@base-ui/react` 1.8.0 (stable since 2025-12, ~19M weekly downloads, last release 2026-09); `radix-ui` 1.6.7 (~19M weekly, last release 2026-07); `react-aria-components` 1.21 (~5.8M weekly, released weekly). All three support React 19.

## Considered options

### Option 1 — A styled kit (MUI, Mantine, Chakra, or keep antd)

Install a full component library and theme it to the tokens.

**Pros:**
- Every component exists on day one.
- Large docs and examples.

**Cons:**
- Their visual defaults (elevation shadows, ripples, focus glows, dense spacing) fight the design system at every turn; theming them away is ongoing work.
- Two styling systems (the kit's engine + our tokens), and lint can't enforce "tokens only" inside the kit's styles.
- Exactly the situation the redesign is leaving (antd).

### Option 2 — Tailwind CSS + shadcn/ui-style copied components

Map tokens into a Tailwind theme; copy-paste component source built on a headless library.

**Pros:**
- Fast to compose layouts; shadcn gives accessible starting points.
- Tokens can be mapped into the Tailwind theme.

**Cons:**
- Arbitrary values (`p-[13px]`, `bg-[#fff]`) undermine "tokens only" unless policed by extra tooling.
- Adds a utility-class vocabulary on top of the token names the design system uses; markup gets noisy.
- shadcn's copied components carry its own look that must be stripped back.

### Option 3 — Base UI headless primitives + CSS Modules on generated CSS custom properties  *(recommended)*

Tokens are generated from `tokens.json` into `src/styles/tokens.css` as CSS custom properties (light/dark under `[data-theme]`). Simple components (Button, Input, Card, Tag) are hand-built with CSS Modules. Components with complex behavior (radio group, dialog, menu, select, popover…) wrap **Base UI** primitives, which ship behavior + ARIA + keyboard handling and **no styles**, exposing state as `data-*` attributes our CSS Modules target. Stylelint + ESLint reject raw colors/spacing/type values and shadows.

**Pros:**
- Look is 100% ours; nothing to undo. Fits "borders, not shadows" and the quiet focus styles exactly.
- Accessibility for the hard widgets comes from a maintained library instead of hand-rolled ARIA.
- One styling mechanism (plain CSS + variables), zero runtime cost, built into Vite; theme switching is a single attribute flip.
- "Tokens only" is lint-enforceable because all styles are plain CSS we own.
- Base UI is a single tree-shakable package from the team behind Radix, Floating UI and MUI, now stable 1.x and actively released.

**Cons:**
- Every visual component is written by us (more upfront work than a kit).
- Base UI is younger than Radix; its API may still shift in minor ways.
- CSS Modules need discipline for shared layout patterns (we'll add small layout primitives as pages need them).

### Option 4 — Same as 3, but Radix Primitives instead of Base UI

**Pros:** longest track record; huge ecosystem (shadcn).
**Cons:** Radix's release cadence is now mostly maintenance; its original authors build Base UI. Separate package per primitive historically (now a unified `radix-ui` package).

### Option 5 — Same as 3, but React Aria Components instead of Base UI

**Pros:** the strongest accessibility and internationalization story (Adobe); excellent for date pickers and complex collections.
**Cons:** larger API surface and render-prop style; heavier; more of its own conventions to learn. Better fit if the app later needs heavy i18n/date handling.

## Decision

**We choose Option 3 — Base UI + CSS Modules on generated token variables** (accepted at the REQ-001 architecture gate, 2026-10-04).

The design system is specific and quiet, so any styled kit costs more to un-style than it saves. Headless primitives give us accessibility for the hard widgets without imposing a look, and CSS Modules over generated custom properties keep a single source (`tokens.json`), cost nothing at runtime, make theming a one-attribute flip, and let lint enforce "tokens only". Base UI over Radix because it's where the same authors' active development is; over React Aria because its API is smaller and closer to plain React for an app of this size. React Aria is the named fallback if Base UI disappoints.

## Consequences

| Consequence | Type |
|---|---|
| We hand-build each visual component against the design system READMEs | new work |
| Base UI is used only where behavior is non-trivial (ThemeToggle now; dialog/menu/select later) | constraint |
| Base UI types stay behind our own component props, so a swap to React Aria touches only `components/ui/*` | trade-off |
| `tokens.css` is generated — edit `tokens.json`, run `npm run tokens`; a test fails if they drift | new workflow |
| Stylelint joins ESLint/Prettier in the toolchain | new tool |
| No ready-made data table/date picker — choose per need when a page requires one | follow-up |

## Open questions

- [ ] When the first page needs a date picker or data table, decide then whether Base UI suffices or a focused library is added.
- [ ] Whether to add a small set of layout primitives (Stack, Cluster, Container) — decide in the first page REQ.

## Related

- Concepts: [[knowledge/concepts/design-tokens]]
- Components: [[knowledge/components/frontend]]
- Gotchas: —
- Lessons: —
- ADRs: [[architecture/adr-02-server-state-tanstack-query]]
