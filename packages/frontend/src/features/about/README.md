# features/about

The public About page at `/about` (REQ-014), after `docs/design/screens/app/S7-*`.

- `AboutPage.tsx` — hero (mission line), "How it works" (3 steps) and the "For students" / "For alumni" cards. Static copy, no API calls, no session needed; the header and footer come from `AppShell`.
- Lazy (ADR-08): only `app/router.tsx`'s dynamic `import()` may reach this folder (`ABOUT_ROUTE`, outside `RequireAuth`). Link to it with `ABOUT_PATH` from `@/config/aboutPath`.
- Copy rule: describe only what the app does today; no counts or statistics. `AboutPage.test.tsx` fails on digits (other than the step numbers) and on promises of messaging or hiring.
- Deviations from S7 are listed in `.adlc/knowledge/concepts/route-layout.md`.
