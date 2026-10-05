# store/

**Purpose:** Jotai atoms for client-only state (e.g. `themeAtom.ts`). Server data belongs in TanStack Query, not here; the auth token lives in `services/authToken.ts`, never in an atom.

**May import:** `jotai` and its utilities, and types from `@alumni/shared`. No React components, no `@/services/**` HTTP calls, no `@/app/**` or `@/features/**`.

**Imported by:** `features/` and `app/`.
