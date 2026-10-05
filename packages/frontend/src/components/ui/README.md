# components/ui/

**Purpose:** design-system primitives (Button, ButtonLink, Input, Card, Tag, Alert, ThemeToggle). Each lives in its own folder with `Name.tsx`, `Name.module.css`, `Name.test.tsx`, and `index.ts`. Primitives are props-in, events-out: typed props, styles only from design tokens (`var(--…)`), no data fetching.

**May import:** React, `@base-ui/react`, `react-router` (ButtonLink renders its `Link`), other `components/ui/` primitives, and `@/styles/**`.

**Must not import:** `@/services/**`, `@/store/**`, `@/features/**`, `@/app/**`, `axios`, `@tanstack/react-query` (enforced by ESLint, for `@/…` and relative paths alike).

**Imported by:** `features/` and `app/`.
