# features/

**Purpose:** one folder per domain. A feature owns its hooks, queries, and domain components, and wires UI primitives to state and services.

**Features today:**

- `theme/` — applies the light/dark/system preference to the page.
- `auth/` — session (token, current user, 401 handling via `SessionBridge`), route guards (`RequireAuth`, `GuestOnly`), login and sign-up pages in a shared `AuthLayout` (full-height page with no app header: brand panel beside the form from 60rem, only its logo row above the form below that), and `ForgotPasswordHelp` (support mailto message).
- `home/` — the signed-in home page.

**May import:** `@/components/ui/**`, `@/config/**`, `@/store/**`, `@/services/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**`.

**Imported by:** `app/` and other features.
