# config/

**Purpose:** app-wide constants that more than one layer needs, such as the brand name and support email (`brand.ts`). Constants and small pure helpers only (e.g. `supportMailto(subject)`): no React, no state, no I/O.

It is also the meeting point for contracts between features that may not import each other. `directoryReturn.ts` owns the directory and profile paths (`DIRECTORY_PATH`, and `profilePath(id)`, which URL-encodes the id), and the router state a directory card hands to the profile page (`directoryReturnState(search)`), which it turns back into the "Back to directory" target (`directoryReturnPath(state)`, plain `DIRECTORY_PATH` for anything unexpected). These paths and the state's key name live only there.

`feedPath.ts` holds `FEED_PATH` (`/feed`) for the router, the nav and Home. `mePath.ts` holds `ME_PATH` (`/me`) for the router, the nav, the avatar menu and Home. `aboutPath.ts` holds `ABOUT_PATH` (`/about`) for the router, the site footer and the log-in and sign-up pages (the page itself is lazy). `relativeTime.ts` turns a post or comment time into "5 minutes ago" (a plain date past 5 weeks); the profile and feed pages both use it, and as lazy features neither may import the other's copy.

**May import:** nothing internal. This folder is a leaf.

**Must not import:** `@/app/**`, `@/features/**`, `@/components/**`, `@/store/**`, `@/services/**` (enforced by ESLint, for `@/…` and relative paths alike).

**Imported by:** `app/` and `features/`. `components/ui/` may not import it (primitives take text such as the brand name as props).
