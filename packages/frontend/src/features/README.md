# features/

**Purpose:** one folder per domain (e.g. `theme/`, later `auth/`, `posts/`). A feature owns its hooks, queries, and domain components, and wires UI primitives to state and services.

**May import:** `@/components/ui/**`, `@/store/**`, `@/services/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**`.

**Imported by:** `app/` and other features.
