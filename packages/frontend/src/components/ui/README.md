# components/ui/

**Purpose:** design-system primitives (Button, ButtonLink, Input, PasswordInput, Logo, Card, Tag, Alert, Menu, SegmentedControl, ThemeToggle). Each lives in its own folder with `Name.tsx`, `Name.module.css`, `Name.test.tsx`, and `index.ts`. Primitives are props-in, events-out: typed props, styles only from design tokens (`var(--…)`), no data fetching.

| Primitive                         | What it is                                                                                                                                                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                          | `primary` / `secondary` / `ghost`; `loading` disables it, sets `aria-busy` and shows a dot                                                                                                                                             |
| `ButtonLink`                      | Button styles on a react-router `Link` (lives in `Button/`); no `loading`/`disabled`                                                                                                                                                   |
| `Input`                           | labelled text field (~40px tall) with `helperText` and `error` (`aria-invalid`, error text in `aria-describedby`); optional `endAdornment` (a control inside the field's end edge)                                                     |
| `PasswordInput`                   | `Input` with a show/hide button (`aria-label` flips Show/Hide password, no `aria-pressed`); focus stays in the input; takes every `Input` prop except `type`                                                                           |
| `Logo`                            | inline-SVG brand mark coloured by tokens; props `label`, `showWordmark`, `decorative`, `size`                                                                                                                                          |
| `Card`                            | raised surface; `as` picks the element                                                                                                                                                                                                 |
| `Tag`                             | small status label with a tone dot                                                                                                                                                                                                     |
| `Alert`                           | inline message; `tone="error"` is `role="alert"`, `tone="info"` is `role="status"`; optional `title`                                                                                                                                   |
| `Menu` / `MenuItem` / `MenuLabel` | Base UI Menu: a dropdown with keyboard support (Enter/ArrowDown open, Escape closes and returns focus). `Menu` takes `trigger` and `align`; each `MenuItem` has `onSelect`; `MenuLabel` is a non-interactive heading                   |
| `SegmentedControl<T>`             | Base UI RadioGroup pill: `label`, `options`, `value`, `onValueChange`. An option with an `icon` shows only the icon, is named by its `label` (`aria-label`) and shows the label in a Base UI Tooltip on hover and focus                |
| `ThemeToggle`                     | Light / Dark / System, a thin wrapper over `SegmentedControl`. `variant="full"` (default, app header) shows the words; `variant="compact"` (auth pages) shows sun / moon / monitor icons, same radio names, tooltip on hover and focus |

**May import:** React, `@base-ui/react`, `react-router` (ButtonLink renders its `Link`), other `components/ui/` primitives, and `@/styles/**`.

**Must not import:** `@/services/**`, `@/store/**`, `@/features/**`, `@/config/**`, `@/app/**`, `axios`, `@tanstack/react-query` (enforced by ESLint, for `@/…` and relative paths alike). Brand text such as the product name comes in as a prop (`Logo label`).

**Imported by:** `features/` and `app/`.
