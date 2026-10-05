# @alumni/frontend

The Alumni Network web app: React 19 + Vite 8 + TypeScript 6. Right now it renders an empty app shell (header with the brand name and a theme toggle) on top of the new design system. Feature screens (login, feed, profiles) come in later REQs.

## Stack

| Concern       | Choice                                                                    | Why / note                                                                   |
| ------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| UI runtime    | React 19.3, React DOM 19.3                                                | React Router 8 needs ≥ 19.2.7                                                |
| Build         | Vite 8, `@vitejs/plugin-react` 6                                          | Dev server proxies `/api` to the API                                         |
| Types         | TypeScript **6.0** (not 7)                                                | `typescript-eslint` 8.71 supports TS < 6.1; TS 7 would break type-aware lint |
| Routing       | React Router 8 (`react-router`, data router)                              |                                                                              |
| State         | Jotai 3 (client-only state), TanStack Query 5 (server state)              | ADR-02                                                                       |
| HTTP          | axios, one instance (`src/services/httpClient.ts`)                        | Attaches the auth header in one interceptor                                  |
| UI behavior   | Base UI (`@base-ui/react`), headless                                      | ADR-01. Only `ThemeToggle` uses it today                                     |
| Styling       | CSS Modules + design tokens (CSS custom properties)                       | No component library; no raw colors or shadows                               |
| Font          | Inter, self-hosted via `@fontsource-variable/inter`                       | No third-party font request                                                  |
| Lint / format | ESLint **9** (not 10), Stylelint 17, Prettier 3                           | `eslint-plugin-jsx-a11y` only supports ESLint ≤ 9                            |
| Tests         | Vitest 5, React Testing Library 16, user-event 14, jest-dom, **jsdom 29** | jsdom 30 needs Node ≥ 24.15; jsdom is pinned to 29 so Node 24.14 works       |

The package is ESM (`"type": "module"` in `package.json`) so the `.js` lint configs load as modules. It needs Node 24 or later (`engines.node`): `npm run tokens` runs a `.ts` file directly with Node's built-in type stripping (no `tsx`/`ts-node`).

## Scripts

Run inside `packages/frontend` (or from the repo root with `--workspace=packages/frontend`).

| Script                  | What it does                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `npm run dev`           | Vite dev server on port 5173; `/api` is proxied to the API (see below)                     |
| `npm run build`         | `typecheck`, then `vite build` into `dist/`                                                |
| `npm run preview`       | Serve the production build locally                                                         |
| `npm run typecheck`     | `tsc` on `tsconfig.app.json` (app code) and `tsconfig.node.json` (Vite config, `scripts/`) |
| `npm run lint`          | ESLint on all TS/JS, then Stylelint on `src/**/*.css`                                      |
| `npm run lint:fix`      | Same, with auto-fix                                                                        |
| `npm run format`        | Prettier, write                                                                            |
| `npm run format:check`  | Prettier, check only                                                                       |
| `npm test`              | Vitest, single run                                                                         |
| `npm run test:watch`    | Vitest, watch mode                                                                         |
| `npm run test:coverage` | Vitest with a v8 coverage report in `coverage/` (git-ignored)                              |
| `npm run tokens`        | Regenerate `src/styles/tokens.css` from `docs/design/design-system/tokens.json`            |
| `npm run tokens:check`  | Exit 1 if `tokens.css` is out of date (for CI)                                             |

From the repo root, `npm run dev` starts the API and this dev server together; `npm run dev:frontend` starts this one alone.

### Dev proxy

API calls use relative paths under `/api` (the axios instance has `baseURL: '/api'`). In dev, `vite.config.ts` proxies `/api` to `http://localhost:<PORT>`, where `PORT` comes from the repo-root `.env` (default 3000). Only `PORT` is read from that file, and only inside the Vite config; nothing else in it reaches the browser. Start the API too, or `/api` calls fail with a proxy error.

## Folder map

```
packages/frontend/
  index.html          inline no-flash theme script, then /src/main.tsx
  scripts/            generate-tokens.ts (+ test), enforcement.test.ts (lint rules self-test)
  src/
    main.tsx          imports the font, tokens.css, global.css (in that order), renders <App/>
    app/              App, providers, router, QueryClient, AppShell layout, RouteError
    features/         one folder per domain; theme/ (useApplyTheme) is the first
    components/ui/    design-system primitives: Button, Input, Card, Tag, ThemeToggle
    store/            Jotai atoms for client-only state (themeAtom)
    services/         httpClient (axios), authToken (token in localStorage)
    styles/           tokens.css (generated), global.css, contrast test
    test/             Vitest setup and harness smoke test
```

Each folder's README says what belongs there and what may import it:
[app](src/app/README.md) · [features](src/features/README.md) · [components/ui](src/components/ui/README.md) · [store](src/store/README.md) · [services](src/services/README.md) · [styles](src/styles/README.md) · [test](src/test/README.md)

**Path alias:** `@/` means `src/` (`import { Button } from '@/components/ui/Button'`). It is declared in `tsconfig.app.json` (`paths`) and in `vite.config.ts` (`resolve.alias`); Vitest reads the Vite config, so the editor, typecheck, build and tests all agree.

**Import boundaries** (enforced by ESLint for both `@/…` and relative paths):

- `components/ui/` must not import `services/`, `store/`, `features/`, `app/`, `axios` or `@tanstack/react-query`. Primitives are props in, events out.
- `services/` must not import React, `components/`, `store/`, `features/` or `app/`. Services return data to the caller.
- `store/` must not import `services/`, `features/` or `app/`. Features wire atoms to services.
- Nothing in `features/`, `store/`, `services/` or `components/` may import `app/` (in practice only `main.tsx` does). Test files (`*.test.ts(x)`) are exempt from this one ban only, so tests may import `app/` providers to render a component.

**Server state vs client state (ADR-02):** data from the API goes through TanStack Query, using the shared `QueryClient` from `app/queryClient.ts` (30 s stale time, no refetch on window focus, up to 2 retries but never on a 4xx). Jotai atoms in `store/` hold client-only state. The auth token lives only in `services/authToken.ts` (`localStorage['token']`), never in an atom; `httpClient` adds `Authorization: Bearer <token>` in its one request interceptor, so call sites never build auth headers.

**Route errors:** the router has two `errorElement` layers. The outer one, on the `/` layout route, catches a crash in the shell itself (the header is gone). The inner one, on a pathless child route, catches page errors and shows `RouteError` inside the shell, with the header still there.

## Design tokens

`docs/design/design-system/tokens.json` is the single source for colors, spacing, type, radii and motion (`--duration-fast`, `--easing-standard`). `scripts/generate-tokens.ts` turns it into `src/styles/tokens.css`: CSS custom properties for both themes.

- Spacing and type sizes/line-heights are emitted in **rem** (px ÷ 16), so they follow the user's browser font-size setting. Radii stay in px.
- Type styles are `font` shorthands: write `font: var(--text-label)`.
- Light values sit on `:root` and `:root[data-theme='light']`; dark values on `:root[data-theme='dark']`.

To change a token:

1. Edit `docs/design/design-system/tokens.json`.
2. Run `npm run tokens`.
3. Run `npm test`. `scripts/generate-tokens.test.ts` fails if `tokens.css` is stale, and `src/styles/contrast.test.ts` fails if a text/background pair drops below WCAG contrast.

Never edit `tokens.css` by hand. `npm run tokens:check` and the test both catch it.

The light accent was darkened at the architecture gate (`accent` `#975c43`, `accent-strong` `#7a4734`) so button labels and links reach 4.5:1. One recorded exception: the Input's resting border (`border-strong`, against both its `surface-sunken` fill and `surface-page`) is below 3:1 in both themes; the label and the sunken fill mark the field. The contrast test pins both pairs at their recorded ratios, fails if either gets worse, and fails if a pair ever starts passing, so the exception gets removed.

### Rules that enforce tokens

- **Stylelint** (`src/**/*.css`): no hex colors, no named colors, no color functions (`rgb()`, `hsl()`, `oklch()`, …), no `box-shadow`/`text-shadow`. Color, background, font, font-size/weight, line-height, padding, margin, gap and border-radius must use `var(--…)` (or a keyword such as `0`, `inherit`, `transparent`, `none`, `auto`). CSS Module class names are camelCase. `tokens.css` is exempt: it is generated and is where raw values live.
- **ESLint** (`src/**/*.{ts,tsx}`, except `src/styles/`): no raw color strings in TS/TSX and no `boxShadow` in a JSX `style` prop.
- Motion tokens are a convention, not a lint rule: write `transition: … var(--duration-fast) var(--easing-standard)`, but a raw `0.2s` still lints clean.
- `scripts/enforcement.test.ts` lints deliberately bad fixtures to prove both rule sets still fire.

## Theme

Three choices: Light, Dark, System, picked with the toggle in the header.

- The choice is stored in `localStorage['alumni.theme']` as JSON (`themePreferenceAtom` in `src/store/themeAtom.ts`). An unknown or garbled value reads back as `system`. Storage that throws (private mode) never breaks the app; the choice just isn't saved.
- `useApplyTheme` (`src/features/theme/`) sets `data-theme="light|dark"` on `<html>`. In System mode it follows `prefers-color-scheme` and updates live when the OS setting changes.
- **No flash:** an inline script in `index.html` reads the same key and sets `data-theme` before first paint. The key appears in both places; `src/store/themeAtom.test.ts` checks they match.

## Testing

- Tests sit next to the code: `Button.tsx` → `Button.test.tsx`.
- Default environment is jsdom. `src/test/setup.ts` adds the jest-dom matchers, a controllable `matchMedia` stub (`setPrefersDark` from `@/test/setup`), and resets localStorage, `data-theme` and the stub before and after every test.
- Tests in `scripts/` run in Node: their first line must be `// @vitest-environment node`. Vitest 5 has no `environmentMatchGlobs`, so without that line they run in jsdom.
- Vitest globals are off: import `describe`/`it`/`expect` from `vitest`.
- CSS Module class names are not hashed in tests (`.primary`, not `._primary_x1y2`), so tests can assert on them.
- Vitest stubs CSS imports (`import css from './x.css?raw'` is `''` in tests); read the file from disk if a test needs its contents.
