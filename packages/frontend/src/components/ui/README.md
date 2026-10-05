# components/ui/

**Purpose:** design-system primitives (Button, ButtonLink, Input, Card, Tag, Alert, Menu, SegmentedControl, ThemeToggle). Each lives in its own folder with `Name.tsx`, `Name.module.css`, `Name.test.tsx`, and `index.ts`. Primitives are props-in, events-out: typed props, styles only from design tokens (`var(--…)`), no data fetching.

| Primitive                         | What it is                                                                                                                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                          | `primary` / `secondary` / `ghost`; `loading` disables it, sets `aria-busy` and shows a dot                                                                                                                           |
| `ButtonLink`                      | Button styles on a react-router `Link` (lives in `Button/`); no `loading`/`disabled`                                                                                                                                 |
| `Input`                           | labelled text field with `helperText` and `error` (`aria-invalid`, error text in `aria-describedby`)                                                                                                                 |
| `Card`                            | raised surface; `as` picks the element                                                                                                                                                                               |
| `Tag`                             | small status label with a tone dot                                                                                                                                                                                   |
| `Alert`                           | inline message; `tone="error"` is `role="alert"`, `tone="info"` is `role="status"`; optional `title`                                                                                                                 |
| `Menu` / `MenuItem` / `MenuLabel` | Base UI Menu: a dropdown with keyboard support (Enter/ArrowDown open, Escape closes and returns focus). `Menu` takes `trigger` and `align`; each `MenuItem` has `onSelect`; `MenuLabel` is a non-interactive heading |
| `SegmentedControl<T>`             | Base UI RadioGroup pill: `label`, `options`, `value`, `onValueChange`                                                                                                                                                |
| `ThemeToggle`                     | Light / Dark / System, a thin wrapper over `SegmentedControl`                                                                                                                                                        |

**May import:** React, `@base-ui/react`, `react-router` (ButtonLink renders its `Link`), other `components/ui/` primitives, and `@/styles/**`.

**Must not import:** `@/services/**`, `@/store/**`, `@/features/**`, `@/app/**`, `axios`, `@tanstack/react-query` (enforced by ESLint, for `@/…` and relative paths alike).

**Imported by:** `features/` and `app/`.
