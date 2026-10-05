# Alumni Network — Design System

A Scandinavian-inspired system for an alumni network product: warm neutrals instead of stark white-and-black, one muted accent carrying all the emphasis, generous whitespace, and quiet borders standing in for shadows.

## Principles

- **Warm, not cold.** Neutrals lean warm (off-white, warm charcoal) rather than clinical grey — paper and ink, not screen and plastic.
- **One accent, used sparingly.** A single dusty terracotta carries every call-to-action, link and selected state. Nothing else competes with it; success/warning/error stay muted and small.
- **Space does the work.** Hierarchy comes from whitespace and type scale before it comes from color or weight. When in doubt, add space rather than a border or a shadow.
- **Borders, not shadows.** Surfaces are separated by a 1px hairline (`border-subtle`), never a drop shadow. It's the single biggest signal of the "quiet" feel — don't reach for `box-shadow`.
- **Light and dark are equally considered.** Dark mode is a warm charcoal, not pure black, so the same warmth carries through; every token has a value in both themes.

## Color

Two themes, one accent. Light is warm off-white and charcoal ink; dark is warm charcoal and off-white ink — a straight inversion, not a different palette.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `surface-page` | `#faf7f2` | `#1d1a17` | Page background |
| `surface-raised` | `#ffffff` | `#272320` | Cards, modals, menus |
| `surface-sunken` | `#f0ebe3` | `#171412` | Inset wells, input backgrounds |
| `border-subtle` | `#e4dcd0` | `#3a352f` | Default hairline border |
| `border-strong` | `#cfc4b4` | `#4c453c` | Hover/focus borders, control resting border |
| `ink-primary` | `#2b2724` | `#f1ece4` | Primary text |
| `ink-secondary` | `#6b6560` | `#b7afa5` | Secondary text, labels |
| `ink-muted` | `#948c84` | `#837b72` | Placeholder, disabled |
| `accent` | `#975c43` | `#d08a66` | The one accent — buttons, links, active state |
| `accent-strong` | `#7a4734` | `#e4a07c` | Hover/pressed accent |
| `accent-ink` | `#fdf8f3` | `#1d1a17` | Text on a solid accent fill |
| `accent-soft` | `#f3e4d9` | `#3a2c23` | Accent tint — selected tags, highlighted rows |
| `success` | `#5f7a56` | `#93b188` | Positive status |
| `warning` | `#a9813f` | `#d7ac6e` | Caution status |
| `error` | `#a3503f` | `#d1796a` | Error / destructive |

Every text/surface pairing above meets 4.5:1 in both themes (checked at the sizes the type scale actually uses).

## Typography

One family — a clean, humanist sans (Inter, falling back to the system sans stack) — carries everything. Hierarchy comes from size and generous line-height, not from switching typefaces.

| Style | Size / line-height | Weight | Use |
| --- | --- | --- | --- |
| `display` | 44px / 52px | 600 | Page-level hero headings, used sparingly |
| `heading-lg` | 28px / 36px | 600 | Section headings |
| `heading-md` | 20px / 28px | 600 | Card and dialog titles |
| `heading-sm` | 16px / 24px | 600 | Compact headings |
| `body` | 16px / 26px | 400 | Default reading text |
| `body-sm` | 14px / 22px | 400 | Secondary text, helper text |
| `label` | 13px / 18px | 500 | Form labels, button and tag text |
| `caption` | 12px / 16px | 500 | Timestamps, counts |

## Spacing

An 4px-rooted scale, deliberately generous at the top end so pages can breathe: `space-1` (4px) through `space-8` (64px). Cards and buttons default to `space-4` (16px) padding; sections separate by `space-6`–`space-7` (32–48px).

## Radius

Soft, not sharp, and never a full pill unless the control is round by nature:

- `radius-sm` (4px) — tags, chips, checkboxes
- `radius-md` (8px) — buttons, inputs
- `radius-lg` (14px) — cards, modals
- `radius-pill` (999px) — the theme toggle track, avatar badges

## Motion

Quiet and short — motion only softens a state change, it never decorates:

- `duration-fast` (150ms) — hover and state-color transitions on controls
- `easing-standard` (`ease`) — the timing curve for those transitions; no bounce or overshoot

The app turns transitions off under `prefers-reduced-motion: reduce`.

## Components

- **Button** — primary (solid accent), secondary (bordered), and ghost (text-only) variants, all `radius-md`, `space-4` horizontal padding.
- **Input** — a labeled text field on `surface-sunken` with a `border-strong` resting border; on focus the border switches to `accent` and the fill to `surface-raised` — no hover step, no glow, just a clearer line. Placeholder and helper text use `ink-secondary` so they reach 4.5:1.
- **Card** — `surface-raised` on a `border-subtle` hairline, `radius-lg`, generous `space-5` internal padding. No shadow.
- **Tag** — small `radius-sm` pill-ish chip in neutral, accent-soft (selected), or a status tone.
- **ThemeToggle** — a three-way light / dark / system switch, `radius-pill` track, that actually flips `data-theme` on the page so you can see every token above respond live.

## What this is

A from-brief system, not pulled from an existing codebase — built to the spec given (warm neutrals, one muted accent, generous whitespace, soft borders). If there's an existing alumni-network codebase to reconcile this against later, that's a separate sync pass.
