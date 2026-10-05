# services/

**Purpose:** non-UI code that talks to the outside world: the single axios instance (`httpClient.ts`, base URL `/api`) and the token store (`authToken.ts`).

**May import:** `axios`, browser APIs, and types from `@alumni/shared`.

**Must not import:** React or any UI code (`@/components/**`, `@/features/**`, `@/app/**`).

**Imported by:** `features/` and `app/`.
