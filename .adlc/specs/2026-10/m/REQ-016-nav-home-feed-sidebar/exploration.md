# REQ-016 — Codebase exploration

| Field | Value |
|---|---|
| Generated | 2026-10-08 |
| By | codebase-explorer |
| Repo(s) scanned | alumni-system |

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `packages/frontend/src/features/directory/AlumniCard.tsx` | Renders a person card with avatar, name, meta (year/department), job line and optional "Mentor" tag for feed-sidebar suggested alumni | reuse for sidebar |
| `packages/frontend/src/features/directory/useAlumniSearch.ts` | TanStack Query hook that calls `searchAlumni` with paging | adapt for suggested alumni query (no paging) |
| `packages/frontend/src/features/feed/useWideScreen.ts` | `useSyncExternalStore` hook that tracks the 48rem breakpoint for desktop/phone layout decisions | reuse for Feed sidebar visibility |
| `packages/frontend/src/features/home/HomePage.tsx` (lines 19–35) | Quick-link card structure with title and description | reuse for new Home sections (profile-completeness, latest posts, mentors, suggestions) |
| `packages/backend/src/dal/query/AlumniQuery.ts` (searchAlumni) | Parameterized SQL with condition builder; filters on q, department, university, graduationYear with a fixed ORDER BY map | follow pattern for suggested alumni and mentors queries |

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `packages/frontend/src/app/AppShell/navItems.tsx` | Add Home to both HEADER_NAV_ITEMS and TAB_NAV_ITEMS; add Profile (alumni id link) to TAB_NAV_ITEMS | **medium** — changes nav item order and adds new item; MainNav and BottomTabs both iterate this |
| `packages/frontend/src/app/AppShell/MainNav.tsx` | Now renders Home, Directory, Feed, Admin (no change in rendering logic) | **low** — only the data source changes |
| `packages/frontend/src/app/AppShell/BottomTabs.tsx` | Now renders Home, Directory, Feed, Profile, Admin (no change in rendering logic) | **low** — only the data source changes |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx` | Nav item order tests must be updated; new Profile tab must be tested | **medium** — several test assertions on nav text and order |
| `packages/frontend/src/app/AppShell/HeaderAuth.tsx` | Avatar menu: "Account settings" no longer needs to be a fallback for Profile tab; "View profile" is already there. No code change needed (already conditional on `alumniId !== null`) | **low** — existing logic already handles this |
| `packages/frontend/src/features/home/HomePage.tsx` | Replace the three large quick-link cards with new sections (profile-completeness card, "Latest from feed", "Mentors available", "Suggested alumni") | **high** — complete redesign of page layout and content; still renders welcome greeting and uses `useCurrentUser` |
| `packages/frontend/src/features/home/HomePage.test.tsx` | All test fixtures and assertions must be rewritten for the new Home sections | **high** — new sections with different states (loading, empty, error per section) |
| `packages/frontend/src/features/feed/FeedPage.tsx` | Add sidebar wrapper and pass suggested alumni data to a sidebar component (only rendered when `useWideScreen()` is true) | **medium** — layout wraps feed in flex row; main feed column logic unchanged |
| `packages/frontend/src/features/feed/FeedPage.module.css` | Change layout from centred single column to desktop two-column with sidebar from 48rem; mobile unchanged | **medium** — responsive layout change |
| `packages/backend/src/api/routes/AlumniRoutes.ts` | Add a new endpoint `GET /api/alumni/suggested` (authenticated) for suggested alumni | **low** — purely additive; existing routes unchanged |
| `packages/backend/src/api/controllers/AlumniController.ts` | Add handler for suggested alumni endpoint | **low** — new handler added; existing handlers untouched |
| `packages/backend/src/businessLogic/src/AlumniManager.ts` | Add `getSuggestedAlumni(userId)` method | **low** — new method; existing methods unchanged |
| `packages/backend/src/dal/query/AlumniQuery.ts` | Add methods for suggested alumni query (with department/university ranking) and mentors filter | **medium** — new query methods; existing `searchAlumni` needs optional mentorship filter |
| `packages/backend/src/businessLogic/src/validation.ts` | Extend `AlumniSearchFilters` to include optional `mentorship` boolean; add validation for that param (empty or true/false only, bad values → 400) | **medium** — extends existing type; new validation rule |
| `packages/frontend/src/features/directory/params.ts` | Add optional `mentorship` param parsing (same pattern: empty means absent, bad value ignored) | **low** — parallel to existing filters; no removal of existing logic |
| `packages/frontend/src/services/alumniApi.ts` | Add `getSuggestedAlumni()` function (authenticated, no params) and extend `AlumniSearchParams` with optional `mentorship` field | **low** — additive |
| `packages/frontend/src/config/queryKeys.ts` | Add suggested alumni query key root (e.g. `'suggestedAlumni'`) | **low** — purely additive |
| `packages/frontend/src/app/AppShell/SiteFooter.module.css` | Adjust footer max-width and/or margins to align with page content (Home, Directory, Profile, Feed) at desktop and tablet width | **low** — CSS-only layout adjustment |
| `packages/backend/src/api/routes/routes.test.ts` | Add test for 401 on unauthenticated `/api/alumni/suggested` request | **low** — new test case; existing coverage unchanged |
| `packages/backend/src/businessLogic/src/AlumniManager.test.ts` or new file | Test suggested alumni ranking (department > university > general), user exclusion, count cap, empty result | **low** — new tests only |
| `packages/frontend/src/features/feed/FeedPage.test.tsx` | Test sidebar loading, error, and empty states; test sidebar does not render below 48rem; test main feed column still works | **medium** — new sidebar test cases added |
| `packages/frontend/src/features/home/HomePage.test.tsx` | Rewrite all tests for new sections and their states | **high** — complete rewrite |

## 3. Integration points

### Navigation & Routing
- **Entry point (frontend):** `packages/frontend/src/app/AppShell/navItems.tsx` — HEADER_NAV_ITEMS and TAB_NAV_ITEMS are the single source of truth for nav. Both MainNav and BottomTabs filter by admin role via `visibleNavItems()`. L-REQ-010-5 warns that nav changes touch every README that lists nav items.
- **Profile tab link target:** The Profile tab must compute the link at render time using the signed-in user's `alumni_id` from `useCurrentUser()`. A1 in the spec says users with no alumni profile (students) should see the Profile tab link to Account settings (`/me`). This requires logic in either `navItems.tsx` or `BottomTabs.tsx` to build the dynamic path.

### API & HTTP
- **Suggested alumni endpoint:** New authenticated route `GET /api/alumni/suggested` in AlumniRoutes, which calls `AlumniManager.getSuggestedAlumni(userId)` (the token's `sub`).
- **Mentorship filter:** Extend existing `GET /api/alumni` (searchAlumni) with optional `mentorship` query param. REQ-005 contract is extended, not replaced; callers see no change if they omit the param.
- **Query keys:** Home and Feed sidebar both use suggested alumni; Home fails independently, Feed sidebar fails independently (spec AC6). Need a dedicated query key like `['suggestedAlumni']`.

### State & Data
- **useCurrentUser() shape:** Already carries `alumni_id` (number | null) and `has_alumni_profile` (boolean). No schema change needed; all data exists in MyProfile type. For the Profile tab, read `alumni_id` to build the link.
- **TanStack Query:** Home's latest posts reuse `['feed', 'posts', ...]` (spec AC5 says "reuse the feed's post data"). Suggested alumni is a new, independent query key. Each Home section (profile-completeness, posts, mentors, suggestions) is its own independent query with its own loading/error state (spec AC6).

### Layout & Styling
- **Responsive breakpoint:** Home and Feed use the existing 48rem breakpoint already defined in `useWideScreen.ts` (Feed layout) and CSS media queries (HomePage, Directory, etc.). The Feed sidebar is built the same way: render at 48rem+ via `useWideScreen()`.
- **Page width alignment:** Footer currently has `max-width: 56.25rem` (900px), but Home, Directory, Profile, Feed cap at 40rem (640px). The spec says "lines up with the page content width" — this likely means the footer container's edge, not the text width, should align with the page container's edge at all widths. CSS fix needed in SiteFooter.module.css to use `min(100%, 40rem)` or similar to match page caps, or remove the max-width so padding alone determines the edge.

### Shared Components & Utilities
- **AlumniCard:** Can be reused for sidebar cards; the current component already has all fields needed (alumni_id, name, photo_url, job title, company, mentorship_available). No avatar URL field in AlumniListItem yet — check if profile_url or photo_url is joined (lines 7–8 of AlumniQuery show `u.photo_url` is joined). Yes, reusable.
- **Avatar, Tag, components/ui primitives:** Already used by AlumniCard; no new UI primitives needed per the non-goals.

### Lazy-route rules
- **Home is eager** (line 3 of router.tsx imports HomePage directly), not in LAZY_FEATURES, so it's safe for Home to import feed components (PostCard, Byline) if we share them. **However**, L-REQ-008-6 warns that components shared between Home (eager) and Feed (lazy) need a "decided shared home". Currently PostCard and Byline live only in `features/feed/`. A new shared Home section that reuses feed posts could import them, but that violates the lazy boundary. Options: (1) move PostCard/Byline to `components/ui/` or a new shared folder; (2) duplicate the post-rendering logic in Home; (3) Home reuses only the data (via TanStack Query) and renders its own minimal post preview. **The spec calls for reusing "the feed's post data and author line"** — this likely means TanStack Query cache reuse (same query key), not component reuse. A separate component or duplicated rendering is safer.
- **Feed is lazy.** Its sidebar is only rendered on desktop (`useWideScreen() && <Sidebar />`), so the condition is at render time, not build time. No lazy-boundary issue.

### Known gotchas relevant to REQ-016
- **G05 (Base UI Radio tooltip):** Not directly relevant unless Profile tab icon gets a tooltip.
- **G08 (RouterProvider import):** Already correct in App.tsx.
- **G22 (BaseDTO casing):** Not touched.
- **G25 (Base UI Popover):** Not touched; no new popovers.
- **G37 (My Profile sticky bar):** Not touched; no changes to My Profile or sticky bars.
- **G40 (Switch nativeButton):** Not touched; no new switches.
- **L-REQ-005-1 (paged list endpoints):** Suggested alumni endpoint should follow this pattern (`{ items, total }`), not take `page`/`pageSize`, just return 3–5 items. New pattern, not paged.
- **L-REQ-008-3 (config contract for router state):** Profile tab doesn't hand state to /alumni/:id (the profile doesn't need a back link to nav), so no new config contract needed.
- **L-REQ-008-6 (shared helpers between lazy features):** PostCard is only in feed. If Home renders posts inline, it must duplicate or move the component; either way, needs a decision.

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| `packages/backend/src/api/routes/routes.test.ts` | Public routes (health, login, register), protected routes (`GET /api/alumni` searchAlumni), route guard by role | Missing: 401 on `GET /api/alumni/suggested` without token; mentorship filter param validation (empty, true, false, bad value) |
| `packages/backend/src/businessLogic/src/AlumniManager.test.ts` | createAlumni, findAlumniById, updateOwnAlumni, searchAlumni | Missing: getSuggestedAlumni user exclusion, department/university ranking, count cap (3–5), empty result |
| `packages/backend/src/dal/query/AlumniQuery.ts` (implicit tests via Manager) | searchAlumni with filters, paging | Missing: direct test of suggested alumni SQL (ranking logic, user exclusion) and mentorship filter SQL |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx` | Nav links and their labels, active states, avatar menu, theme toggle | Missing: Home nav item marked current on `/`, not on other paths; Profile tab links to `/alumni/:id` with correct alumni id; Profile tab links to `/me` when no alumni profile; Header nav shows Home, Directory, Feed, Admin (in order) |
| `packages/frontend/src/features/home/HomePage.test.tsx` | Welcome greeting and quick-link cards (title, description) | Completely missing: all new sections (profile-completeness card, latest posts, mentors available, suggested alumni); each section's loading, empty, error states; that sections fail independently without breaking others |
| `packages/frontend/src/features/feed/FeedPage.test.tsx` | Feed rendering, composer, posts, Load more, delete flow | Missing: sidebar renders on desktop (`matchMedia('(width >= 48rem)')` = true), not on phone; sidebar loading, error, empty states; main feed column still works with sidebar |
| `packages/frontend/src/features/directory/params.test.ts` | Directory param parsing and validation | Missing: mentorship filter param parsing (empty, true, false, bad value ignored) |

### Coverage gaps summary
- **Backend:** New suggested alumni endpoint route test, Manager test for ranking/exclusion/cap, SQL test for ranking order.
- **Frontend:** Home page complete rewrite with new section tests (each section's states); AppShell nav tests for new item order and Profile tab logic; Feed sidebar tests.
- **Component behavior:** Profile tab linking to `/alumni/:id` vs `/me` based on alumni_id presence; suggested alumni sidebar rendering only on desktop; independent error handling per Home section.

## Vault references

Pages from the knowledge vault relevant to this REQ:

- [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home|L-REQ-008-6]] — Home (eager) rendering feed posts needs a shared component home, not duplication or cross-feature import.
- [[knowledge/lessons/LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list|L-REQ-010-5]] — Nav changes mean grepping every folder README for the old nav entry list, not just lazyRoutes.test.ts.
- [[knowledge/lessons/LESSON-REQ-008-3-cross-feature-handover-through-config|L-REQ-008-3]] — Profile doesn't need router state (no back link), but the config/directoryReturn pattern is a model for lazy-feature data hand-off.
- [[knowledge/lessons/LESSON-REQ-008-4-one-lazy-ban-per-feature|L-REQ-008-4]] — Feed's lazy-route import ban will need a near-miss fixture for "suggested" (e.g. "@/features/suggestedAlumni", "../suggestedAlumniHelpers") if a new shared component lives in a new folder.
- [[knowledge/lessons/LESSON-REQ-005-1-paged-list-endpoints|L-REQ-005-1]] — Suggested alumni endpoint differs: no paging, fixed 3–5 items, ranking rules only (no q, filters). New pattern, not an extension of directory search.
- [[knowledge/gotchas#^g10|G10]] — Lint traps on form handlers and nullish coalescing; if Profile tab logic uses `alumni_id ?? null` or conditional routes, ensure correct spelling.
- [[knowledge/gotchas#^g27|G27]] — CSS override specificity: Footer width change (if `.inner` uses a min() calc or margin-based width) must test at all widths where pages are narrower.

## Open questions

- **Assumption A1 verification:** Does Profile tab go to `/me` (Account settings) or stay unrendered when no alumni profile? Spec says "see Assumption A1" but marks it "needs verification". Current avatar menu behavior already gates "View profile" on `alumni_id !== null`, so Profile tab should mirror that (link to `/me` when null).
- **Profile-completeness card A2 verification:** Which fields count as incomplete? Spec lists photo, headline, job title, company, department, graduation year, bio. Are all required? Current MyProfile type has all optional except name and email. Confirm scope for progress bar.
- **Suggested alumni count cap:** Spec says 3–5. Is this a fixed count (always return 3–5 if available) or a range (return up to 5, show 3–4 on Home)? Home shows "3–4 alumni" (AC4); Feed sidebar shows "3–5 people" (AC1). Current spec language "3–5" suggests a range; count as up to 5, display fewer if needed.
- **Suggested alumni ranking tie-break:** Spec says "stable tie-break". What makes it stable? Likely `id` ascending (like directory's `ORDER BY u.name, a.id`).
- **Footer alignment:** Spec says "lines up with the page content width". Does this mean (a) footer inner width matches page width (both 40rem max), or (b) footer padding-edges align with shell padding-edges (full width, matching gutters)? Likely (a), so footer inner should use the same `min(100%, 40rem)` as page containers.

## Dependency sketch

A simplified flow of components and data:

```
Frontend Nav Layer:
  navItems.tsx (HEADER_NAV_ITEMS, TAB_NAV_ITEMS)
    ↓ data to
  MainNav.tsx (renders header nav)
  BottomTabs.tsx (renders tab bar)
    ↓ render
  AppShell.tsx → AppShell.module.css

Frontend Page Layer:
  HomePage.tsx (new sections)
    ↓ queries
  useSuggestedAlumni() → alumniApi.getSuggestedAlumni()
  usePosts() (existing, reused)
  useCurrentUser() (existing, reused)

  FeedPage.tsx (sidebar added)
    ↓ queries
  useSuggestedAlumni() ← shared query

Backend Route Layer:
  AlumniRoutes.ts
    ↓ handlers
  AlumniController.{createAlumni, searchAlumni, getSuggestedAlumni, ...}
    ↓ delegates
  AlumniManager.{createAlumni, searchAlumni, getSuggestedAlumni, ...}
    ↓ SQL
  AlumniQuery.{searchAlumni, getSuggestedAlumni, findAlumniByDepartment, ...}
    ↓ pool query
  Postgres alumni table

Profile Tab Special Case:
  BottomTabs + HeaderAuth
    ↓ useCurrentUser() reads alumni_id
  Build link: alumni_id ? `/alumni/${alumni_id}` : `/me`
```

This shows the main vertical slice (nav → suggested alumni query → Feed sidebar) and the Profile tab's dependency on useCurrentUser.
