# config/

**Purpose:** app-wide constants that more than one layer needs, such as the brand name and support email (`brand.ts`). Constants and small pure helpers only (e.g. `supportMailto(subject)`): no React, no state, no I/O.

It is also the meeting point for contracts between features that may not import each other. `directoryReturn.ts` owns the directory and profile paths (`DIRECTORY_PATH`, and `profilePath(id)`, which URL-encodes the id), and the router state a directory card hands to the profile page (`directoryReturnState(search)`), which it turns back into the "Back to directory" target (`directoryReturnPath(state)`, plain `DIRECTORY_PATH` for anything unexpected). These paths and the state's key name live only there.

**May import:** nothing internal. This folder is a leaf.

**Must not import:** `@/app/**`, `@/features/**`, `@/components/**`, `@/store/**`, `@/services/**` (enforced by ESLint, for `@/…` and relative paths alike).

**Imported by:** `app/` and `features/`. `components/ui/` may not import it (primitives take text such as the brand name as props).
