# config/

**Purpose:** app-wide constants that more than one layer needs, such as the brand name and support email (`brand.ts`). Constants and small pure helpers only (e.g. `supportMailto(subject)`): no React, no state, no I/O.

It is also the meeting point for contracts between features that may not import each other. `directoryReturn.ts` owns the router state a directory card hands to the profile page (`directoryReturnState(search)`) and turns it back into the "Back to directory" target (`directoryReturnPath(state)`, plain `DIRECTORY_PATH` for anything unexpected). The state's key name lives only there.

**May import:** nothing internal. This folder is a leaf.

**Must not import:** `@/app/**`, `@/features/**`, `@/components/**`, `@/store/**`, `@/services/**` (enforced by ESLint, for `@/…` and relative paths alike).

**Imported by:** `app/` and `features/`. `components/ui/` may not import it (primitives take text such as the brand name as props).
