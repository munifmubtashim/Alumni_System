# features/

**Purpose:** one folder per domain. A feature owns its hooks, queries, and domain components, and wires UI primitives to state and services.

**Features today:**

- `theme/` — applies the light/dark/system preference to the page.
- `auth/` — session (token, current user, 401 handling via `SessionBridge`), route guards (`RequireAuth`, `GuestOnly`), login and sign-up pages.
- `home/` — the signed-in home page.

**May import:** `@/components/ui/**`, `@/store/**`, `@/services/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**`.

**Imported by:** `app/` and other features.
