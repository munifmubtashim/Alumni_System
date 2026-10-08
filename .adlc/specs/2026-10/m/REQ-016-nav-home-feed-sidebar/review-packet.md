# REQ-016-nav-home-feed-sidebar — Review Packet (round 2)

`Packet: 98KB · round 2 · only files changed by the fix pass (uncommitted vs HEAD)`

## Round 2 — what changed since round 1

Open findings addressed (all were actionable): QUAL-001 (shared SectionCard/PersonList in features/people replace HomeSection + 2 CSS copies), CORR-001 (implementer says false positive: useUpdateProfile already invalidates the ['alumni'] prefix; a pinning test was added: VERIFY this claim), UI-001 (PersonRow container-query: Mentor tag moves under text below 16rem), ARCH-001 (--page-max moved to :root in global.css), ARCH-002 (shared SuggestedAlumni type removed; service returns AlumniListItem[]), QUAL-002 (README/comment), QUAL-003 (shared fake-API helpers in src/test/fakeApi.tsx).
Not addressed on purpose (needs your call): QUAL-004, REFL-001..005, QUAL-005, UI-002.
Spec, architecture: unchanged; see the round-1 packet (review-packet-round1.md) if needed.

## Diff with full context (vs HEAD)

```diff
diff --git a/packages/frontend/src/app/AppShell/AppShell.module.css b/packages/frontend/src/app/AppShell/AppShell.module.css
index 234125bb..81647358 100644
--- a/packages/frontend/src/app/AppShell/AppShell.module.css
+++ b/packages/frontend/src/app/AppShell/AppShell.module.css
@@ -1,193 +1,190 @@
 /* App frame after docs/design/screens/app/S1-*. Phone: a top bar (logo, theme
    toggle, avatar) and a bottom tab bar (BottomTabs). From 48rem: a 4rem
    header, full width, with the nav beside the logo and the toggle and avatar
    menu on the right. Content sits in a full-width column with S1's gutters;
    each page caps its own width. Everything wraps rather than overflowing, down
    to 360px and at 200% zoom.
    Sizes with no token use a calc() of tokens: 14px = space-3 + space-1 / 2,
    20px = space-4 + space-1. */
 
 /* --tab-bar-height: how tall BottomTabs is on phones (0 from 48rem, where it
    is hidden), so a page's own fixed bottom bar can sit just above it (ADV-001,
    REQ-010). The sum mirrors BottomTabs.module.css: hairline, bar padding
    (space-1 top, space-2 + space-1 / 2 bottom), tab padding (space-2 twice),
    the 1.25rem icon, the space-1 gap and one caption line. BottomTabs uses it
    as its min height, so the two never disagree by more than a wrapped label.
-   --page-max: the widest a page's content column gets (REQ-016). Home,
-   Directory, Profile, Feed and the footer's inner box all use
-   min(100%, var(--page-max)), centred inside the same gutters, so the footer
-   lines up with the page above it. */
+   --page-max (the page column width, REQ-016) is declared in
+   styles/global.css :root. */
 .shell {
-  --page-max: 72rem;
   --tab-bar-height: calc(
     1px + var(--space-1) + var(--space-2) * 2 + 1.25rem + var(--space-1) +
       var(--text-caption-line) + var(--space-2) + var(--space-1) / 2
   );
 
   display: flex;
   flex-direction: column;
   min-height: 100vh;
 }
 
 /* Off-screen until focused, then shown in the top-left corner. */
 .skipLink {
   position: absolute;
   top: 0;
   left: 0;
   z-index: 2;
   padding: var(--space-2) var(--space-4);
   background: var(--surface-raised);
   color: var(--accent);
   font: var(--text-label);
   border: 1px solid var(--border-subtle);
   border-radius: var(--radius-md);
   transform: translateY(-200%);
 }
 
 .skipLink:focus {
   transform: none;
 }
 
 .header {
   display: flex;
   flex-wrap: wrap;
   align-items: center;
   justify-content: space-between;
   gap: var(--space-3) var(--space-4);
   padding: calc(var(--space-3) + var(--space-1) / 2) var(--space-4);
   background: var(--surface-raised);
   border-bottom: 1px solid var(--border-subtle);
 }
 
 /* Brand + main nav. The nav stretches to the header's full height so its
    underline sits on the header's hairline. */
 .headerStart {
   display: flex;
   align-items: center;
   align-self: stretch;
   gap: var(--space-6);
 }
 
 /* Brand link home: the Logo with its wordmark, which gives the link its name.
    Phone sizes (26px mark, 14px wordmark) come from S1-Phone; the desktop ones
    (28px, 16px) are the Logo's own. */
 .brand {
   display: inline-flex;
   color: var(--ink-primary);
   text-decoration: none;
   border-radius: var(--radius-sm);
 }
 
 .brand svg {
   inline-size: 1.625rem;
   block-size: 1.625rem;
 }
 
 .brand span:last-child {
   font: var(--text-body-sm);
   font-weight: var(--text-heading-sm-weight);
 }
 
 /* Theme toggle + account area. */
 .headerActions,
 .authLinks {
   display: flex;
   align-items: center;
   gap: var(--space-3);
 }
 
 .headerActions {
   gap: var(--space-4);
   margin-inline-start: auto;
 }
 
 /* The account button: avatar and chevron, no box until hovered. The Menu
    primitive's trigger rules are overridden with a tag-qualified selector. */
 button.accountButton {
   gap: calc(var(--space-1) * 1.5);
   padding: var(--space-1);
   color: var(--ink-secondary);
 }
 
 /* Phone avatar 30px; from 48rem the Avatar's own xs size (32px). Qualified
    with the span and data-size so it outranks the Avatar's size rule. */
 span.avatar[data-size='xs'] {
   inline-size: 1.875rem;
   block-size: 1.875rem;
   font: var(--text-caption);
   font-weight: var(--text-heading-sm-weight);
 }
 
 /* S1-Phone shows the avatar alone. */
 .chevron {
   display: none;
   inline-size: 0.875rem;
   block-size: 0.875rem;
 }
 
 /* Who is signed in, inside the account menu: name, then email. */
 .menuName {
   display: block;
   color: var(--ink-primary);
   font: var(--text-label);
 }
 
 .menuEmail {
   display: block;
   overflow-wrap: anywhere;
 }
 
 .main {
   flex: 1;
   padding: calc(var(--space-4) + var(--space-1)) var(--space-4);
 }
 
 .main:focus {
   outline: none;
 }
 
 @media (width >= 48rem) {
   .shell {
     --tab-bar-height: 0px;
   }
 
   .header {
     flex-wrap: nowrap;
     gap: var(--space-5);
     min-height: calc(4rem + 1px);
     padding: 0 var(--space-6);
   }
 
   .headerStart {
     gap: var(--space-6);
   }
 
   .brand svg {
     inline-size: 1.75rem;
     block-size: 1.75rem;
   }
 
   /* S1-Desktop puts 10px between the mark and the name (phone: 8px). */
   .brand > span {
     gap: calc(var(--space-2) + var(--space-1) / 2);
   }
 
   .brand span:last-child {
     font: var(--text-heading-sm);
   }
 
   span.avatar[data-size='xs'] {
     inline-size: 2rem;
     block-size: 2rem;
     font: var(--text-label);
     font-weight: var(--text-heading-sm-weight);
   }
 
   .chevron {
     display: block;
   }
 
   .main {
     padding: var(--space-6);
   }
 }
diff --git a/packages/frontend/src/app/AppShell/SiteFooter.module.css b/packages/frontend/src/app/AppShell/SiteFooter.module.css
index fb7b6ae1..2b42ef12 100644
--- a/packages/frontend/src/app/AppShell/SiteFooter.module.css
+++ b/packages/frontend/src/app/AppShell/SiteFooter.module.css
@@ -1,67 +1,67 @@
 /* Footer after docs/design/screens/app/S7-*: a hairline, then © and the links.
-   The inner box is as wide as the page column (--page-max from AppShell,
+   The inner box is as wide as the page column (--page-max from global.css,
    REQ-016; S7 drew 900px) and the footer's side padding equals .main's, so
    its edges line up with the page content. Phones stack and centre them. The ©
    uses ink-secondary rather than S7's muted grey: ink-muted on the page
    background is under 4.5:1 (G33). */
 
 .footer {
   border-top: 1px solid var(--border-subtle);
   padding: var(--space-4) var(--space-4) var(--space-5);
 }
 
 .inner {
   display: flex;
   flex-direction: column;
   align-items: center;
   gap: calc(var(--space-2) + var(--space-1) / 2);
   width: min(100%, var(--page-max));
   margin-inline: auto;
 }
 
 .copyright {
   font-size: var(--text-caption-size);
   line-height: var(--text-caption-line);
   font-weight: var(--text-body-weight);
   color: var(--ink-secondary);
 }
 
 .links {
   display: flex;
   gap: var(--space-4);
 }
 
 .link {
   font-size: var(--text-caption-size);
   line-height: var(--text-caption-line);
   font-weight: var(--text-body-weight);
   color: var(--ink-secondary);
   text-decoration: none;
   border-radius: var(--radius-sm);
 }
 
 .link:hover {
   color: var(--ink-primary);
   text-decoration: underline;
 }
 
 @media (width >= 48rem) {
   .footer {
     padding: calc(var(--space-5) + var(--space-1)) var(--space-6);
   }
 
   .inner {
     flex-direction: row;
     justify-content: space-between;
   }
 
   .copyright,
   .link {
     font-size: var(--text-label-size);
     line-height: var(--text-label-line);
   }
 
   .links {
     gap: calc(var(--space-4) + var(--space-1));
   }
 }
diff --git a/packages/frontend/src/features/directory/DirectoryPage.module.css b/packages/frontend/src/features/directory/DirectoryPage.module.css
index c4c52c04..afc113b2 100644
--- a/packages/frontend/src/features/directory/DirectoryPage.module.css
+++ b/packages/frontend/src/features/directory/DirectoryPage.module.css
@@ -1,66 +1,66 @@
 /* Design: docs/design/screens/app/S2-Desktop-Light and S2-Phone-Light.
    Nearest tokens: heading text-heading-sm on phone (design 18px) and
    text-heading-md from 48rem (design 22px); count caption size on phone
    (12px) and label size from 48rem (13px), regular weight, ink-secondary;
    column gap space-4 on phone (16px) and space-5 from 48rem (design 20px).
    The count spans swap by CSS class, not the hidden attribute (G18). */
 
 .page {
   /* The shell no longer caps page width (REQ-007), so the page does, with the
-     shared --page-max from AppShell (REQ-016). */
+     shared --page-max from global.css (REQ-016). */
   width: min(100%, var(--page-max));
   margin-inline: auto;
   display: flex;
   flex-direction: column;
   gap: var(--space-4);
   min-width: 0;
 }
 
 .headingRow {
   display: flex;
   flex-wrap: wrap;
   align-items: baseline;
   justify-content: space-between;
   gap: var(--space-2);
 }
 
 .title {
   margin: 0;
   color: var(--ink-primary);
   font: var(--text-heading-sm);
 }
 
 .count {
   margin: 0;
   color: var(--ink-secondary);
   font-size: var(--text-caption-size);
   font-weight: var(--text-body-weight);
   line-height: var(--text-caption-line);
 }
 
 .countLong {
   display: none;
 }
 
 @media (width >= 48rem) {
   .page {
     gap: var(--space-5);
   }
 
   .title {
     font: var(--text-heading-md);
   }
 
   .count {
     font-size: var(--text-label-size);
     line-height: var(--text-label-line);
   }
 
   .countLong {
     display: inline;
   }
 
   .countShort {
     display: none;
   }
 }
diff --git a/packages/frontend/src/features/feed/FeedPage.module.css b/packages/frontend/src/features/feed/FeedPage.module.css
index c843f9e1..dfd6c306 100644
--- a/packages/frontend/src/features/feed/FeedPage.module.css
+++ b/packages/frontend/src/features/feed/FeedPage.module.css
@@ -1,68 +1,68 @@
 /* Design: S4 page column, centred. Since REQ-016 the page takes the shared
-   --page-max (from AppShell) so its edges line up with the footer, and from
+   --page-max (from global.css) so its edges line up with the footer, and from
    48rem it is a grid: the post column (flexible; S4's fixed 640px column no
    longer applies once a sidebar exists) and a "Suggested alumni" sidebar
    (no design screen): 16rem from 48rem, so the posts keep about 27rem at a
    48rem window, and 20rem from 64rem; sticky so it stays in view while the posts
    scroll. Title 18px phone / 22px desktop: text-heading-sm / text-heading-md
    (as the directory). Gaps 16px / 20px: space-4 / space-5 (nearest). Posts
    16px apart. The shell gives the page padding (REQ-007). */
 
 .page {
   width: min(100%, var(--page-max));
   margin-inline: auto;
   min-width: 0;
 }
 
 .main {
   display: flex;
   flex-direction: column;
   gap: var(--space-4);
   min-width: 0;
 }
 
 .title {
   margin: 0;
   color: var(--ink-primary);
   font: var(--text-heading-sm);
 }
 
 .list {
   display: flex;
   flex-direction: column;
   gap: var(--space-4);
   margin: 0;
   padding: 0;
   list-style: none;
 }
 
 @media (width >= 48rem) {
   .page {
     display: grid;
     grid-template-columns: minmax(0, 1fr) 16rem;
     gap: var(--space-5);
     align-items: start;
   }
 
   .main {
     gap: var(--space-5);
   }
 
   .title {
     font: var(--text-heading-md);
   }
 
   /* The header does not stick, so the sidebar sticks just below the top. */
   .aside {
     position: sticky;
     top: var(--space-5);
     min-width: 0;
   }
 }
 
 @media (width >= 64rem) {
   .page {
     grid-template-columns: minmax(0, 1fr) 20rem;
     gap: var(--space-6);
   }
 }
diff --git a/packages/frontend/src/features/home/HomePage.test.tsx b/packages/frontend/src/features/home/HomePage.test.tsx
index ec60fcdf..78fb4be5 100644
--- a/packages/frontend/src/features/home/HomePage.test.tsx
+++ b/packages/frontend/src/features/home/HomePage.test.tsx
@@ -1,114 +1,114 @@
-import type { AlumniListResponse, Post, SuggestedAlumni } from '@alumni/shared';
+import type { AlumniListItem, AlumniListResponse, Post } from '@alumni/shared';
 import { screen, within } from '@testing-library/react';
 import { afterEach, describe, expect, it } from 'vitest';
 import { HomePage } from './HomePage';
 import { fail, mockApi, ok, profile, renderHome, resetApi } from './homeTestKit';
 
 afterEach(resetApi);
 
 const posts: Post[] = [{ id: 1, user_id: 10, caption: 'Hello all', author_name: 'Ada' }];
 const mentors: AlumniListResponse = {
   items: [{ id: 2, user_id: 20, name: 'Grace Mentor', mentorship_available: true }],
   total: 1,
 };
-const suggestions: SuggestedAlumni = [{ id: 3, user_id: 30, name: 'Linus Suggested' }];
+const suggestions: AlumniListItem[] = [{ id: 3, user_id: 30, name: 'Linus Suggested' }];
 
 const all = { '/posts': ok(posts), '/alumni': ok(mentors), '/alumni/suggestions': ok(suggestions) };
 
 const section = (name: string) => screen.getByRole('region', { name });
 
 describe('HomePage', () => {
   it('greets the user by first name with the subtitle', () => {
     mockApi({});
     renderHome(<HomePage />, profile('alumni', { name: 'Amina Rao' }));
 
     expect(
       screen.getByRole('heading', { level: 1, name: 'Welcome back, Amina' }),
     ).toBeInTheDocument();
     expect(screen.getByText("Here's what's happening in your alumni network.")).toBeInTheDocument();
   });
 
   it('uses a one-word name as it is', () => {
     mockApi({});
     renderHome(<HomePage />, profile('student', { name: 'Jonas' }));
     expect(screen.getByRole('heading', { name: 'Welcome back, Jonas' })).toBeInTheDocument();
   });
 
   it('greets without a name when the name is blank', () => {
     mockApi({});
     renderHome(<HomePage />, profile('alumni', { name: '  ' }));
     expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument();
   });
 
   it('shows the completeness card, latest posts, mentors and suggested alumni', async () => {
     mockApi(all);
     renderHome(<HomePage />, profile('alumni'));
 
     expect(section('Complete your profile')).toBeInTheDocument();
     expect(
       await within(section('Latest from the feed')).findByText('Hello all'),
     ).toBeInTheDocument();
     expect(
       await within(section('Mentors available')).findByText('Grace Mentor'),
     ).toBeInTheDocument();
     expect(
       await within(section('Suggested alumni')).findByText('Linus Suggested'),
     ).toBeInTheDocument();
     const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
     expect(headings).toEqual([
       'Complete your profile',
       'Latest from the feed',
       'Mentors available',
       'Suggested alumni',
     ]);
   });
 
   it('has no quick-link cards, stats or counts', () => {
     mockApi({});
     renderHome(<HomePage />, profile('alumni'));
 
     expect(screen.queryByText('Browse the directory')).not.toBeInTheDocument();
     expect(screen.queryByText('Catch up on the feed')).not.toBeInTheDocument();
     expect(screen.queryByText(/Total alumni|Students|Posts$/)).not.toBeInTheDocument();
   });
 
   it('keeps every other section when one fails', async () => {
     mockApi({ ...all, '/posts': fail() });
     renderHome(<HomePage />, profile('alumni'));
 
     expect(await within(section('Latest from the feed')).findByRole('alert')).toHaveTextContent(
       "Posts didn't load",
     );
     expect(
       await within(section('Mentors available')).findByText('Grace Mentor'),
     ).toBeInTheDocument();
     expect(
       await within(section('Suggested alumni')).findByText('Linus Suggested'),
     ).toBeInTheDocument();
     expect(screen.getAllByRole('alert')).toHaveLength(1);
   });
 
   it('keeps the posts when mentors and suggestions both fail', async () => {
     mockApi({ '/posts': ok(posts), '/alumni': fail(), '/alumni/suggestions': fail() });
     renderHome(<HomePage />, profile('alumni'));
 
     expect(
       await within(section('Latest from the feed')).findByText('Hello all'),
     ).toBeInTheDocument();
     expect(await within(section('Mentors available')).findByRole('alert')).toBeInTheDocument();
     expect(await within(section('Suggested alumni')).findByRole('alert')).toBeInTheDocument();
   });
 
   it('shows no completeness card for an account without a profile row', () => {
     mockApi({});
     renderHome(<HomePage />, profile('none'));
     expect(screen.queryByRole('region', { name: 'Complete your profile' })).not.toBeInTheDocument();
     expect(section('Latest from the feed')).toBeInTheDocument();
   });
 
   it('renders nothing without a loaded profile', () => {
     mockApi({});
     const { container } = renderHome(<HomePage />);
     expect(container).toBeEmptyDOMElement();
   });
 });
diff --git a/packages/frontend/src/features/home/HomeSection.module.css b/packages/frontend/src/features/home/HomeSection.module.css
deleted file mode 100644
index cbfa47a3..00000000
--- a/packages/frontend/src/features/home/HomeSection.module.css
+++ /dev/null
@@ -1,53 +0,0 @@
-/* A Home section card (REQ-016, no design screen): Card's surface, border,
-   radius and padding; the title in heading-sm with the "See all" style link
-   on the right in the accent label (as the log-in page's links). The error
-   state follows the profile's Recent posts: the alert spans the card and
-   Retry sits under it, start-aligned. */
-
-.section {
-  min-width: 0;
-}
-
-.header {
-  display: flex;
-  align-items: baseline;
-  justify-content: space-between;
-  gap: var(--space-3);
-}
-
-.heading {
-  margin: 0;
-  color: var(--ink-primary);
-  font: var(--text-heading-sm);
-}
-
-.action {
-  flex: none;
-  color: var(--accent);
-  font: var(--text-label);
-  text-decoration: none;
-  border-radius: var(--radius-sm);
-}
-
-.action:hover {
-  text-decoration: underline;
-}
-
-.empty {
-  margin: 0;
-  color: var(--ink-secondary);
-  font: var(--text-body-sm);
-}
-
-.error {
-  display: flex;
-  flex-direction: column;
-  align-items: stretch;
-  gap: var(--space-3);
-  min-width: 0;
-}
-
-.retry {
-  align-self: flex-start;
-  padding: var(--space-2) var(--space-4);
-}
diff --git a/packages/frontend/src/features/home/HomeSection.tsx b/packages/frontend/src/features/home/HomeSection.tsx
deleted file mode 100644
index 1385017e..00000000
--- a/packages/frontend/src/features/home/HomeSection.tsx
+++ /dev/null
@@ -1,83 +0,0 @@
-import { useId, type ReactNode } from 'react';
-import { Link } from 'react-router';
-import { Alert } from '@/components/ui/Alert';
-import { Button } from '@/components/ui/Button';
-import { Card } from '@/components/ui/Card';
-import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
-import { cx } from '@/components/ui/cx';
-import styles from './HomeSection.module.css';
-
-export interface HomeSectionAction {
-  to: string;
-  /** The visible link text ("See all"). */
-  label: string;
-  /** A fuller accessible name when the label alone is vague; must start with the label (WCAG 2.5.3). */
-  name?: string;
-}
-
-export interface HomeSectionProps {
-  title: string;
-  /** A link beside the title (to the full page). */
-  action?: HomeSectionAction;
-  className?: string;
-  children: ReactNode;
-}
-
-/**
- * One Home section: a card (`<section>`, named by its h2 title) with an
- * optional link to the full page beside the title. The section's own
- * loading, empty and error content goes in as children.
- */
-export function HomeSection({ title, action, className, children }: HomeSectionProps) {
-  const headingId = useId();
-  return (
-    <Card as="section" aria-labelledby={headingId} className={cx(styles.section, className)}>
-      <div className={styles.header}>
-        <h2 id={headingId} className={styles.heading}>
-          {title}
-        </h2>
-        {action !== undefined && (
-          <Link to={action.to} className={styles.action} aria-label={action.name}>
-            {action.label}
-          </Link>
-        )}
-      </div>
-      {children}
-    </Card>
-  );
-}
-
-/** A loading status line for screen readers; it sits outside the aria-busy skeletons so it is announced. */
-export function SectionLoadingStatus({ children }: { children: string }) {
-  return (
-    <VisuallyHidden as="p" role="status">
-      {children}
-    </VisuallyHidden>
-  );
-}
-
-export interface SectionErrorProps {
-  title: string;
-  /** True while a retry is in flight (the button shows its spinner). */
-  retrying: boolean;
-  onRetry: () => void;
-}
-
-/** A section's own error: an inline alert with Retry under it, so the rest of Home stays. */
-export function SectionError({ title, retrying, onRetry }: SectionErrorProps) {
-  return (
-    <div className={styles.error}>
-      <Alert tone="error" title={title}>
-        Something went wrong on our side or with the connection. Try again in a moment.
-      </Alert>
-      <Button className={styles.retry} loading={retrying} onClick={onRetry}>
-        Retry
-      </Button>
-    </div>
-  );
-}
-
-/** The one-line note a section shows when it has nothing to list. */
-export function SectionEmpty({ children }: { children: ReactNode }) {
-  return <p className={styles.empty}>{children}</p>;
-}
diff --git a/packages/frontend/src/features/home/LatestPosts.tsx b/packages/frontend/src/features/home/LatestPosts.tsx
index ea0217d7..3573dde3 100644
--- a/packages/frontend/src/features/home/LatestPosts.tsx
+++ b/packages/frontend/src/features/home/LatestPosts.tsx
@@ -1,145 +1,145 @@
 import type { Post } from '@alumni/shared';
 import { useQuery } from '@tanstack/react-query';
 import type { ReactNode } from 'react';
 import { Link } from 'react-router';
 import { Avatar } from '@/components/ui/Avatar';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { profilePath } from '@/config/directoryReturn';
 import { FEED_PATH } from '@/config/feedPath';
 import { FEED_QUERY_ROOT } from '@/config/queryKeys';
 import { relativeTime } from '@/config/relativeTime';
 import { present } from '@/config/text';
+import { SectionCard, SectionEmpty, SectionError, SectionLoadingStatus } from '@/features/people';
 import { listPosts } from '@/services/postsApi';
-import { HomeSection, SectionEmpty, SectionError, SectionLoadingStatus } from './HomeSection';
 import styles from './LatestPosts.module.css';
 
 /** How many posts Home previews. */
 export const LATEST_POSTS_LIMIT = 3;
 /**
  * Home's own key under the feed root. The feed's optimistic writes touch only
  * their exact keys, so this entry refetches every time Home mounts instead
  * (ADV-004); an admin write's invalidation of `['feed']` reaches it too.
  */
 const LATEST_POSTS_KEY = [FEED_QUERY_ROOT, 'latest'] as const;
 const UNKNOWN_AUTHOR = 'Unknown member';
 
 function useLatestPosts() {
   return useQuery({
     queryKey: LATEST_POSTS_KEY,
     queryFn: () => listPosts({ limit: LATEST_POSTS_LIMIT, offset: 0 }),
     refetchOnMount: 'always',
   });
 }
 
 /** An ISO timestamp for `<time dateTime>`, or undefined for a missing or invalid date. */
 function isoDate(value: Date | string | undefined): string | undefined {
   if (value === undefined) return undefined;
   const date = new Date(value);
   return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
 }
 
 /**
  * One compact post: avatar, author name (a link to `/alumni/<author_alumni_id>`
  * only when that is set, L-REQ-009-1), relative time and the caption clamped
  * to three lines. Not the feed's PostCard: that lives in the lazy Feed, and
  * importing it would pull the Feed chunk into the main bundle (ADR-08).
  */
 function PostPreview({ post }: { post: Post }) {
   const name = present(post.author_name) ?? UNKNOWN_AUTHOR;
   const caption = present(post.caption);
   const dateTime = isoDate(post.created_at);
   const when = dateTime === undefined ? '' : relativeTime(dateTime);
   const alumniId = post.author_alumni_id;
 
   return (
     <article className={styles.post}>
       <Avatar name={name} photoUrl={present(post.author_photo)} size="sm" />
       <div className={styles.body}>
         <p className={styles.byline}>
           {alumniId === null || alumniId === undefined ? (
             <span className={styles.author}>{name}</span>
           ) : (
             <Link to={profilePath(alumniId)} className={styles.author}>
               {name}
             </Link>
           )}
           {when !== '' && dateTime !== undefined && (
             <>
               <span aria-hidden="true"> · </span>
               <time dateTime={dateTime}>{when}</time>
             </>
           )}
         </p>
         {caption !== undefined && <p className={styles.caption}>{caption}</p>}
       </div>
     </article>
   );
 }
 
 /** A placeholder in the preview's shape. Decorative. */
 function PostPreviewSkeleton() {
   return (
     <div aria-hidden="true" className={styles.post} data-skeleton="">
       <Skeleton shape="circle" className={styles.skeletonAvatar} />
       <div className={styles.body}>
         <Skeleton className={styles.skeletonByline} />
         <Skeleton />
       </div>
     </div>
   );
 }
 
 /**
  * "Latest from the feed": the 3 newest posts from `GET /api/posts?limit=3`,
  * with "See all" to `/feed`. Owns its loading, empty and error states, so a
  * failure never hides the rest of Home; a failed background refetch keeps the
  * posts already shown.
  */
 export function LatestPosts() {
   const posts = useLatestPosts();
 
   let body: ReactNode;
   if (posts.isPending) {
     body = (
       <>
         <SectionLoadingStatus>Loading posts…</SectionLoadingStatus>
         <div className={styles.list} aria-busy="true">
           {Array.from({ length: LATEST_POSTS_LIMIT }, (_, index) => (
             <PostPreviewSkeleton key={index} />
           ))}
         </div>
       </>
     );
   } else if (posts.isError && posts.data === undefined) {
     body = (
       <SectionError
         title="Posts didn't load"
         retrying={posts.isFetching}
         onRetry={() => {
           void posts.refetch();
         }}
       />
     );
   } else if (posts.data.length === 0) {
     body = <SectionEmpty>No posts yet. Be the first to share something on the feed.</SectionEmpty>;
   } else {
     body = (
       <ul className={styles.list}>
         {posts.data.slice(0, LATEST_POSTS_LIMIT).map((post) => (
           <li key={post.id}>
             <PostPreview post={post} />
           </li>
         ))}
       </ul>
     );
   }
 
   return (
-    <HomeSection
+    <SectionCard
       title="Latest from the feed"
       action={{ to: FEED_PATH, label: 'See all', name: 'See all posts' }}
     >
       {body}
-    </HomeSection>
+    </SectionCard>
   );
 }
diff --git a/packages/frontend/src/features/home/MentorsAvailable.module.css b/packages/frontend/src/features/home/MentorsAvailable.module.css
deleted file mode 100644
index 56e9d129..00000000
--- a/packages/frontend/src/features/home/MentorsAvailable.module.css
+++ /dev/null
@@ -1,12 +0,0 @@
-/* The mentors list, as features/people's Suggested alumni: the rows bring
-   their own space-2 padding, so the list pulls them out by that much to line
-   the avatars up with the heading. */
-
-.list {
-  display: flex;
-  flex-direction: column;
-  gap: var(--space-1);
-  margin: 0 calc(-1 * var(--space-2));
-  padding: 0;
-  list-style: none;
-}
diff --git a/packages/frontend/src/features/home/MentorsAvailable.tsx b/packages/frontend/src/features/home/MentorsAvailable.tsx
index f159f525..65436d3d 100644
--- a/packages/frontend/src/features/home/MentorsAvailable.tsx
+++ b/packages/frontend/src/features/home/MentorsAvailable.tsx
@@ -1,88 +1,83 @@
 import { useQuery } from '@tanstack/react-query';
 import type { ReactNode } from 'react';
 import { DIRECTORY_PATH } from '@/config/directoryReturn';
 import { ALUMNI_QUERY_ROOT } from '@/config/queryKeys';
-import { PersonRow, PersonRowSkeleton } from '@/features/people';
+import {
+  PersonList,
+  PersonListSkeleton,
+  SectionCard,
+  SectionEmpty,
+  SectionError,
+  SectionLoadingStatus,
+} from '@/features/people';
 import { searchAlumni } from '@/services/alumniApi';
-import { HomeSection, SectionEmpty, SectionError, SectionLoadingStatus } from './HomeSection';
-import styles from './MentorsAvailable.module.css';
 
 /** How many mentors Home shows. */
 export const MENTORS_SHOWN = 4;
 /** One more than shown, so dropping the signed-in user still leaves 4 when 4 others exist. */
 const MENTORS_FETCHED = MENTORS_SHOWN + 1;
 /** Under the alumni root, so an admin write's invalidation of `['alumni']` refreshes it. */
 const MENTORS_KEY = [ALUMNI_QUERY_ROOT, 'mentors'] as const;
 const SKELETON_COUNT = 3;
 
 function useMentors() {
   return useQuery({
     queryKey: MENTORS_KEY,
     queryFn: () => searchAlumni({ mentorship: true, page: 1, pageSize: MENTORS_FETCHED }),
   });
 }
 
 export interface MentorsAvailableProps {
   /** The signed-in user's own alumni id, left out of the list; null without an alumni profile. */
   ownAlumniId: number | null;
 }
 
 /**
  * "Mentors available": up to 4 alumni with mentorship on, from
  * `GET /api/alumni?mentorship=true`, as `PersonRow`s (each has the Mentor
  * tag), never the signed-in user, with "Browse directory" to `/directory`.
  * Owns its loading, empty and error states, so a failure never hides the rest
  * of Home.
  */
 export function MentorsAvailable({ ownAlumniId }: MentorsAvailableProps) {
   const mentors = useMentors();
 
   let body: ReactNode;
   if (mentors.isPending) {
     body = (
       <>
         <SectionLoadingStatus>Loading mentors…</SectionLoadingStatus>
-        <div className={styles.list} aria-busy="true">
-          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
-            <PersonRowSkeleton key={index} />
-          ))}
-        </div>
+        <PersonListSkeleton count={SKELETON_COUNT} />
       </>
     );
   } else if (mentors.isError && mentors.data === undefined) {
     body = (
       <SectionError
         title="Mentors didn't load"
         retrying={mentors.isFetching}
         onRetry={() => {
           void mentors.refetch();
         }}
       />
     );
   } else {
     const people = mentors.data.items
       .filter((person) => person.id !== ownAlumniId)
       .slice(0, MENTORS_SHOWN);
     body =
       people.length === 0 ? (
         <SectionEmpty>No mentors available yet. Check back soon.</SectionEmpty>
       ) : (
-        <ul className={styles.list}>
-          {people.map((person) => (
-            <li key={person.id}>
-              <PersonRow person={person} />
-            </li>
-          ))}
-        </ul>
+        <PersonList people={people} />
       );
   }
 
   return (
-    <HomeSection
+    <SectionCard
       title="Mentors available"
       action={{ to: DIRECTORY_PATH, label: 'Browse directory' }}
     >
       {body}
-    </HomeSection>
+    </SectionCard>
   );
 }
diff --git a/packages/frontend/src/features/home/homeTestKit.tsx b/packages/frontend/src/features/home/homeTestKit.tsx
index 65359c2f..7bf1dda3 100644
--- a/packages/frontend/src/features/home/homeTestKit.tsx
+++ b/packages/frontend/src/features/home/homeTestKit.tsx
@@ -1,119 +1,38 @@
 /*
  * Test-only helpers for the Home tests (imported by *.test.tsx here, never by
- * app code): a fake API at the axios adapter (the REQ-001 test policy), a
- * profile builder and a render helper. One copy for the Home tests (G26; the
- * app-wide src/test/ helper is the open follow-up QUAL-002). No app/ import:
- * this is not a test file to the lint rules, so it builds its own client.
+ * app code): the shared fake API from src/test/fakeApi (re-exported, so the
+ * tests keep one import), a profile builder and a render helper that seeds
+ * `['me']`.
  */
 import type { MyProfile } from '@alumni/shared';
-import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
-import { render } from '@testing-library/react';
-import {
-  AxiosError,
-  type AxiosAdapter,
-  type AxiosResponse,
-  type InternalAxiosRequestConfig,
-} from 'axios';
 import type { ReactNode } from 'react';
-import { MemoryRouter } from 'react-router';
 import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
-import { httpClient } from '@/services/httpClient';
+import { renderWithProviders } from '@/test/fakeApi';
 
-export type Responder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;
-
-export const ok =
-  (data: unknown): Responder =>
-  (config) =>
-    Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
-
-// A custom adapter must reject non-2xx itself (G26). Tests use a 4xx so the
-// app's retry policy (5xx only) never delays the error state.
-export const fail =
-  (status = 400): Responder =>
-  (config) =>
-    Promise.reject(
-      new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, {
-        data: { message: 'nope' },
-        status,
-        statusText: String(status),
-        headers: {},
-        config,
-      }),
-    );
-
-/** Never answers: the query stays pending. */
-export const never: Responder = () => new Promise<AxiosResponse>(() => undefined);
-
-export interface SeenRequest {
-  url: string;
-  params: unknown;
-}
-
-/** Every request the fake API received, in order. */
-export const requests: SeenRequest[] = [];
-const originalAdapter = httpClient.defaults.adapter;
-
-/**
- * Routes each request by URL. A URL takes its responders in turn and the last
- * one repeats; an unlisted URL never answers (so a section under test is not
- * disturbed by the others).
- */
-export function mockApi(routes: Readonly<Record<string, Responder | readonly Responder[]>>): void {
-  const calls = new Map<string, number>();
-  const adapter: AxiosAdapter = (config) => {
-    const url = config.url ?? '';
-    requests.push({ url, params: config.params });
-    const route = routes[url];
-    if (route === undefined) return never(config);
-    const list = typeof route === 'function' ? [route] : route;
-    const count = (calls.get(url) ?? 0) + 1;
-    calls.set(url, count);
-    const responder = list[Math.min(count, list.length) - 1];
-    return responder === undefined ? never(config) : responder(config);
-  };
-  httpClient.defaults.adapter = adapter;
-}
-
-export function resetApi(): void {
-  requests.length = 0;
-  httpClient.defaults.adapter = originalAdapter;
-}
+export { fail, mockApi, never, ok, requests, resetApi } from '@/test/fakeApi';
+export type { Responder, SeenRequest } from '@/test/fakeApi';
 
 /** An alumni or student account (or one with neither row) for `['me']`. */
 export function profile(
   kind: 'alumni' | 'student' | 'none',
   fields: Partial<MyProfile> = {},
 ): MyProfile {
   return {
     user_id: 1,
     name: 'Amina Rao',
     email: 'amina@example.com',
     role: kind === 'none' ? 'admin' : kind,
     alumni_id: kind === 'alumni' ? 7 : null,
     has_alumni_profile: kind === 'alumni',
     student_id: kind === 'student' ? 9 : null,
     has_student_profile: kind === 'student',
     ...fields,
   };
 }
 
-/**
- * Renders `ui` with a query client, a router and (when given) `['me']` already
- * loaded. Errors end at once (no retry); the app's retry policy is tested in
- * app/queryClient.test.ts.
- */
+/** Renders `ui` with a query client, a router and (when given) `['me']` already loaded. */
 export function renderHome(ui: ReactNode, user?: MyProfile) {
-  const queryClient = new QueryClient({
-    defaultOptions: { queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false } },
-  });
-  if (user) queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
-  // A wrapper, not a parent element, so `rerender` keeps the providers.
-  const result = render(ui, {
-    wrapper: ({ children }) => (
-      <QueryClientProvider client={queryClient}>
-        <MemoryRouter>{children}</MemoryRouter>
-      </QueryClientProvider>
-    ),
+  return renderWithProviders(ui, (queryClient) => {
+    if (user) queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
   });
-  return { ...result, queryClient };
 }
diff --git a/packages/frontend/src/features/me/useLeaveGuard.ts b/packages/frontend/src/features/me/useLeaveGuard.ts
index d686add6..82eab216 100644
--- a/packages/frontend/src/features/me/useLeaveGuard.ts
+++ b/packages/frontend/src/features/me/useLeaveGuard.ts
@@ -1,55 +1,54 @@
 import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
 import { useBlocker, type Blocker, type BlockerFunction } from 'react-router';
 import { getLiveToken } from '@/services/authToken';
 
 /** Where SessionBridge and logout send a user whose session ended. */
 const LOGIN_PATH = '/login';
 
 /**
  * Warns before leaving a page with unsaved work while `active` is true (the
  * form is dirty, or a save is still in flight: ADV-008).
  *
  * - In-app links and Back: React Router's `useBlocker`. The caller shows a
  *   prompt while `blocker.state === 'blocked'` and calls `proceed()` or
  *   `reset()`.
  * - Reload and tab close: a `beforeunload` listener, registered only while
  *   active, so a clean page never asks.
  *
  * Never blocks when the session is gone or the target is /login (ADV-002): a
  * 401 logout clears the token and then navigates, so `shouldBlock` reads the
  * token synchronously at navigation time, and `active` from a ref so the one
  * stable blocker function always sees the latest value. A navigation that
- * stays on the same path (e.g. the avatar menu's "Account
- * settings" while on /me) is not blocked either: it does not leave
- * the form.
+ * stays on the same path (e.g. the avatar menu's "Account settings" while on
+ * /me) is not blocked either: it does not leave the form.
  */
 export function useLeaveGuard(active: boolean): Blocker {
   const activeRef = useRef(active);
   useLayoutEffect(() => {
     activeRef.current = active;
   });
 
   const shouldBlock = useCallback<BlockerFunction>(
     ({ currentLocation, nextLocation }) =>
       activeRef.current &&
       getLiveToken() !== null &&
       nextLocation.pathname !== LOGIN_PATH &&
       nextLocation.pathname !== currentLocation.pathname,
     [],
   );
   const blocker = useBlocker(shouldBlock);
 
   useEffect(() => {
     if (!active) return;
     const warn = (event: BeforeUnloadEvent) => {
       // preventDefault is what asks for the browser's own "Leave site?" prompt.
       event.preventDefault();
     };
     window.addEventListener('beforeunload', warn);
     return () => {
       window.removeEventListener('beforeunload', warn);
     };
   }, [active]);
 
   return blocker;
 }
diff --git a/packages/frontend/src/features/me/useUpdateProfile.test.tsx b/packages/frontend/src/features/me/useUpdateProfile.test.tsx
index bde2ab50..1f1b4edd 100644
--- a/packages/frontend/src/features/me/useUpdateProfile.test.tsx
+++ b/packages/frontend/src/features/me/useUpdateProfile.test.tsx
@@ -1,175 +1,197 @@
 import type { MyProfile } from '@alumni/shared';
 import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
 import { act, renderHook, waitFor } from '@testing-library/react';
 import { AxiosError, type AxiosResponse } from 'axios';
 import type { ReactNode } from 'react';
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
 import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
+import { SUGGESTED_ALUMNI_KEY } from '@/features/people';
 import { clearToken, setToken } from '@/services/authToken';
 import { httpClient } from '@/services/httpClient';
 import { useUpdateProfile } from './useUpdateProfile';
 
 function signIn(): void {
   const encode = (value: object) => window.btoa(JSON.stringify(value)).replace(/=+$/, '');
   const exp = Math.floor(Date.now() / 1000) + 3600;
   setToken(`${encode({ alg: 'HS256' })}.${encode({ sub: 1, exp })}.sig`);
 }
 
 const PROFILE: MyProfile = {
   user_id: 1,
   name: 'Sophia Martins',
   email: 'sophia@example.com',
   role: 'alumni',
   alumni_id: 11,
   has_alumni_profile: true,
   student_id: null,
   has_student_profile: false,
 };
 
 const originalAdapter = httpClient.defaults.adapter;
 let urls: string[] = [];
 
 /** Answers each URL with a status; a status of 300 or more rejects (G26). */
 function api(statuses: Record<string, number>, onRequest?: () => void): void {
   httpClient.defaults.adapter = (config) => {
     const url = config.url ?? '';
     urls.push(url);
     onRequest?.();
     const status = statuses[url] ?? 500;
     const data = url === '/me' ? { ...PROFILE, name: 'Saved name' } : undefined;
     const response: AxiosResponse = { data, status, statusText: '', headers: {}, config };
     if (status >= 300) {
       return Promise.reject(
         new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
           ...response,
           data: { message: 'Current password is incorrect' },
         }),
       );
     }
     return Promise.resolve(response);
   };
 }
 
 function setup() {
   const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
   client.setQueryData(CURRENT_USER_QUERY_KEY, PROFILE);
   const invalidate = vi.spyOn(client, 'invalidateQueries');
   const wrapper = ({ children }: { children: ReactNode }) => (
     <QueryClientProvider client={client}>{children}</QueryClientProvider>
   );
   const { result } = renderHook(() => useUpdateProfile(), { wrapper });
   return { client, invalidate, result };
 }
 
 const PASSWORD = { current_password: 'oldpassword', new_password: 'newpassword1' };
 
 beforeEach(() => {
   urls = [];
   signIn();
 });
 
 afterEach(() => {
   httpClient.defaults.adapter = originalAdapter;
   clearToken();
 });
 
 describe('useUpdateProfile', () => {
   it('saves the profile, writes ["me"] and refetches every cache that shows the user', async () => {
     api({ '/me': 200 });
     const { client, result } = setup();
     // The keys other features read (they are not imported: lazy features never
     // import each other). Seeded with data and an active observer each, so
     // invalidation shows up as a real refetch, not just a spy call.
     const keys = [
       ['feed', 'posts'],
       ['feed', 'comments', 1],
       ['alumni', 'profile', 11],
       ['alumni', 'search', {}],
+      // Home and the Feed sidebar: ranked by the user's own department and
+      // university, and the mentors list follows the mentorship switch.
+      ['alumni', 'suggestions'],
+      ['alumni', 'mentors'],
       ['posts', 'user', 1],
     ] as const;
     const fetches = new Map<string, number>();
     const unsubscribes = keys.map((queryKey) => {
       client.setQueryData(queryKey, []);
       const observer = new QueryObserver(client, {
         queryKey,
         queryFn: () => {
           const id = JSON.stringify(queryKey);
           fetches.set(id, (fetches.get(id) ?? 0) + 1);
           return [];
         },
         staleTime: Infinity,
       });
       return observer.subscribe(() => undefined);
     });
 
     const saved = await act(() =>
       result.current.mutateAsync({ profile: { name: 'Saved name' }, password: null }),
     );
     expect(urls).toEqual(['/me']);
     expect(saved).toEqual({
       profile: { ...PROFILE, name: 'Saved name' },
       passwordChanged: false,
       passwordError: null,
     });
     expect(client.getQueryData<MyProfile>(CURRENT_USER_QUERY_KEY)?.name).toBe('Saved name');
     await waitFor(() => {
       for (const queryKey of keys) {
         expect(fetches.get(JSON.stringify(queryKey)), JSON.stringify(queryKey)).toBe(1);
       }
     });
     for (const queryKey of keys) {
       expect(client.getQueryState(queryKey)?.status, JSON.stringify(queryKey)).toBe('success');
     }
     // ['me'] holds the saved profile; it is written, not refetched.
     expect(client.getQueryState(CURRENT_USER_QUERY_KEY)?.isInvalidated).toBe(false);
     unsubscribes.forEach((unsubscribe) => {
       unsubscribe();
     });
   });
 
+  it('marks the suggested alumni stale, so Home and the Feed re-rank them (CORR-001)', async () => {
+    api({ '/me': 200 });
+    const { client, result } = setup();
+    // No observer: the card is not on /me, so the entry only goes stale and
+    // refetches when Home or the Feed mounts it again.
+    client.setQueryData(SUGGESTED_ALUMNI_KEY, []);
+
+    await act(() =>
+      result.current.mutateAsync({
+        profile: { name: 'Sophia Martins', department: 'Physics' },
+        password: null,
+      }),
+    );
+
+    expect(client.getQueryState(SUGGESTED_ALUMNI_KEY)?.isInvalidated).toBe(true);
+  });
+
   it('skips PUT /api/me when only the password is sent, and leaves the cache alone', async () => {
     api({ '/me/password': 204 });
     const { client, invalidate, result } = setup();
     const saved = await act(() =>
       result.current.mutateAsync({ profile: null, password: PASSWORD }),
     );
     expect(urls).toEqual(['/me/password']);
     expect(saved).toMatchObject({ profile: null, passwordChanged: true, passwordError: null });
     expect(client.getQueryData(CURRENT_USER_QUERY_KEY)).toBe(PROFILE);
     expect(invalidate).not.toHaveBeenCalled();
   });
 
   it('returns a password failure instead of throwing, after the profile saved', async () => {
     api({ '/me': 200, '/me/password': 400 });
     const { client, result } = setup();
     const saved = await act(() =>
       result.current.mutateAsync({ profile: { name: 'Saved name' }, password: PASSWORD }),
     );
     expect(urls).toEqual(['/me', '/me/password']);
     expect(saved.passwordChanged).toBe(false);
     expect(saved.passwordError).toBeInstanceOf(AxiosError);
     expect(client.getQueryData<MyProfile>(CURRENT_USER_QUERY_KEY)?.name).toBe('Saved name');
   });
 
   it('throws when PUT /api/me fails, and never sends the password', async () => {
     api({ '/me': 400, '/me/password': 204 });
     const { result } = setup();
     await act(async () => {
       await expect(
         result.current.mutateAsync({ profile: { name: 'x' }, password: PASSWORD }),
       ).rejects.toBeInstanceOf(AxiosError);
     });
     expect(urls).toEqual(['/me']);
   });
 
   it('does not write ["me"] back once the session is gone', async () => {
     // The token is dropped while the request is out (a 401 logout elsewhere).
     api({ '/me': 200 }, clearToken);
     const { client, invalidate, result } = setup();
     await act(() =>
       result.current.mutateAsync({ profile: { name: 'Saved name' }, password: null }),
     );
     expect(client.getQueryData(CURRENT_USER_QUERY_KEY)).toBe(PROFILE);
     expect(invalidate).not.toHaveBeenCalled();
   });
 });
diff --git a/packages/frontend/src/features/me/useUpdateProfile.ts b/packages/frontend/src/features/me/useUpdateProfile.ts
index 8d1f6061..ef921b72 100644
--- a/packages/frontend/src/features/me/useUpdateProfile.ts
+++ b/packages/frontend/src/features/me/useUpdateProfile.ts
@@ -1,70 +1,77 @@
 import type { ChangePasswordInput, MyProfile, UpdateMyProfileInput } from '@alumni/shared';
 import { useMutation, useQueryClient } from '@tanstack/react-query';
+import { ALUMNI_QUERY_ROOT, FEED_QUERY_ROOT, POSTS_QUERY_ROOT } from '@/config/queryKeys';
 import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
 import { changePassword, updateMyProfile } from '@/services/authApi';
 import { getLiveToken } from '@/services/authToken';
 
 /** One Save: either part may be skipped (planSave decides), never both. */
 export interface SaveRequest {
   /** PUT /api/me body, or null when no profile field changed (ADV-003). */
   profile: UpdateMyProfileInput | null;
   /** PUT /api/me/password body, or null when no password was typed. */
   password: ChangePasswordInput | null;
 }
 
 export interface SaveResult {
   /** The saved profile from PUT /api/me, or null when that call was skipped. */
   profile: MyProfile | null;
   /** True when PUT /api/me/password ran and succeeded. */
   passwordChanged: boolean;
   /** The password call's error, when it failed; the profile part still counts. */
   passwordError: unknown;
 }
 
-// Query keys whose rows carry the user's name, photo or profile fields:
-// ['alumni', ...] (the directory and /alumni/:id), ['posts', ...] (recent posts
-// on /alumni/:id) and ['feed', ...] (the feed's ['feed','posts'] and
-// ['feed','comments',id] show the author's name and photo). 'feed' is a string
-// literal, not features/feed's POSTS_QUERY_KEY: lazy features never import
-// each other (ADR-08), so keep it in step with features/feed/constants.ts.
-const STALE_AFTER_PROFILE_SAVE = [['alumni'], ['posts'], ['feed']] as const;
+// Query-key roots whose rows carry the user's name, photo or profile fields,
+// or depend on them. ['alumni', ...]: the directory, /alumni/:id, Home's
+// mentors list (the mentorship switch) and the suggested alumni, which are
+// ranked by the user's own department and university (REQ-016, CORR-001);
+// invalidation matches by prefix, so the root reaches every one. ['posts', ...]:
+// recent posts on /alumni/:id. ['feed', ...]: the feed's posts and comments and
+// Home's latest posts show the author's name and photo. The roots come from
+// config/queryKeys: lazy features never import each other (ADR-08).
+const STALE_AFTER_PROFILE_SAVE = [
+  [ALUMNI_QUERY_ROOT],
+  [POSTS_QUERY_ROOT],
+  [FEED_QUERY_ROOT],
+] as const;
 
 /**
  * Save for /me: one mutation, two calls (LESSON-REQ-002-3). PUT /api/me runs
  * first when a profile field changed; a failure there throws and nothing else
  * runs. PUT /api/me/password runs next when a password was typed; its failure
  * is returned, not thrown, so a profile that did save is still applied while
  * the error shows on the password section. Not optimistic (architecture: a
  * watched form waits instead of rolling back).
  *
  * The cache work lives here, not in the caller's mutate() callbacks, so it
  * still happens if the user leaves the page while the save is in flight.
  */
 export function useUpdateProfile() {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (request: SaveRequest): Promise<SaveResult> => {
       const profile = request.profile ? await updateMyProfile(request.profile) : null;
       let passwordChanged = false;
       let passwordError: unknown = null;
       if (request.password) {
         try {
           await changePassword(request.password);
           passwordChanged = true;
         } catch (error: unknown) {
           passwordError = error;
         }
       }
       return { profile, passwordChanged, passwordError };
     },
     onSuccess: ({ profile }) => {
       // A 401 on the password call has already logged out and cleared the
       // cache (SessionBridge); writing the old profile back would outlive it.
       if (profile === null || getLiveToken() === null) return;
       queryClient.setQueryData(CURRENT_USER_QUERY_KEY, profile);
       for (const queryKey of STALE_AFTER_PROFILE_SAVE) {
         void queryClient.invalidateQueries({ queryKey });
       }
     },
   });
 }
diff --git a/packages/frontend/src/features/people/PersonRow.module.css b/packages/frontend/src/features/people/PersonRow.module.css
index 89828a55..1ac23591 100644
--- a/packages/frontend/src/features/people/PersonRow.module.css
+++ b/packages/frontend/src/features/people/PersonRow.module.css
@@ -1,72 +1,107 @@
 /* No design screen for this row (REQ-016); it follows the directory card
    (S2): avatar, name in heading-sm, "job title, company" in ink-secondary,
    the accent Mentor tag. A compact row for a narrow column: the sm avatar
    (2.5rem), a sunken hover like a menu item. The name is one line with an
-   ellipsis; "role, company" wraps to at most two lines so a narrow sidebar
-   still shows the company (REQ-016 screenshot pass). Neither widens it. */
+   ellipsis; "role, company" wraps to at most two lines. Neither widens it.
+   The link is a size container: when the row is narrower than 16rem (the
+   16rem Feed sidebar at 48-64rem, UI-001) the Mentor tag moves under the
+   text, so the role line gets the full width instead of being cut. */
 
 .row {
-  display: flex;
-  align-items: center;
-  gap: var(--space-3);
+  display: block;
+  container-type: inline-size;
   min-width: 0;
   padding: var(--space-2);
   border-radius: var(--radius-md);
   color: var(--ink-primary);
   text-decoration: none;
   transition: background-color var(--duration-fast) var(--easing-standard);
 }
 
 a.row:hover {
   background: var(--surface-sunken);
 }
 
+.layout {
+  display: grid;
+  grid-template-areas: 'avatar identity tag';
+  grid-template-columns: auto minmax(0, 1fr) auto;
+  align-items: center;
+  gap: var(--space-1) var(--space-3);
+}
+
+.avatar {
+  grid-area: avatar;
+}
+
+@container (width < 16rem) {
+  .layout {
+    grid-template-areas:
+      'avatar identity'
+      'avatar tag';
+    grid-template-columns: auto minmax(0, 1fr);
+  }
+
+  .tag {
+    justify-self: start;
+  }
+}
+
 .identity {
   display: flex;
   flex: 1;
   flex-direction: column;
+  grid-area: identity;
   min-width: 0;
 }
 
 .name,
 .role {
   margin: 0;
   overflow: hidden;
 }
 
 .name {
   text-overflow: ellipsis;
   white-space: nowrap;
   font: var(--text-label);
   font-weight: var(--text-heading-sm-weight);
 }
 
 .role {
   color: var(--ink-secondary);
   font: var(--text-caption);
   font-weight: var(--text-body-weight);
   display: -webkit-box;
   overflow-wrap: anywhere;
   -webkit-box-orient: vertical;
   -webkit-line-clamp: 2;
   line-clamp: 2;
 }
 
 .tag {
   display: flex;
-  flex: none;
+  grid-area: tag;
+}
+
+/* The loading placeholder: the row's spacing as a plain flex line. */
+.skeletonRow {
+  display: flex;
+  align-items: center;
+  gap: var(--space-3);
+  padding: var(--space-2);
 }
 
 .skeletonAvatar {
   inline-size: 2.5rem;
   block-size: 2.5rem;
 }
 
 .skeletonName {
   inline-size: 55%;
 }
 
 .skeletonRole {
   inline-size: 75%;
   block-size: var(--text-caption-line);
 }
diff --git a/packages/frontend/src/features/people/PersonRow.tsx b/packages/frontend/src/features/people/PersonRow.tsx
index b68db8a1..7dccd646 100644
--- a/packages/frontend/src/features/people/PersonRow.tsx
+++ b/packages/frontend/src/features/people/PersonRow.tsx
@@ -1,60 +1,69 @@
 import type { AlumniListItem } from '@alumni/shared';
 import { Link } from 'react-router';
 import { Avatar } from '@/components/ui/Avatar';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { Tag } from '@/components/ui/Tag';
 import { profilePath } from '@/config/directoryReturn';
 import { present } from '@/config/text';
 import styles from './PersonRow.module.css';
 
 export interface PersonRowProps {
   person: AlumniListItem;
 }
 
 /** "Job title, Company", leaving out whichever part is missing (no stray comma). */
 function roleLine(person: AlumniListItem): string | undefined {
   const parts = [present(person.job_title), present(person.current_company)].filter(
     (part): part is string => part !== undefined,
   );
   return parts.length > 0 ? parts.join(', ') : undefined;
 }
 
 /**
  * One person in a short list (Suggested alumni, Mentors available): avatar,
  * name, "job title, company" and a "Mentor" tag when `mentorship_available`
  * is true. The whole row is one link to the profile. It carries no directory
  * router state, so the profile's back link goes to the plain directory. Each
  * line is its own block element so the link's name reads with spaces (G27).
+ * In a narrow column the Mentor tag drops under the text (a container query
+ * in the CSS), so the role line keeps the full width.
  */
 export function PersonRow({ person }: PersonRowProps) {
   const name = present(person.name) ?? '';
   const role = roleLine(person);
 
   return (
     <Link to={profilePath(person.id)} className={styles.row}>
-      <Avatar name={name} photoUrl={present(person.photo_url)} size="sm" />
-      <div className={styles.identity}>
-        <p className={styles.name}>{name}</p>
-        {role !== undefined && <p className={styles.role}>{role}</p>}
-      </div>
-      {person.mentorship_available === true && (
-        <div className={styles.tag}>
-          <Tag tone="accent">Mentor</Tag>
+      <div className={styles.layout}>
+        <Avatar
+          name={name}
+          photoUrl={present(person.photo_url)}
+          size="sm"
+          className={styles.avatar}
+        />
+        <div className={styles.identity}>
+          <p className={styles.name}>{name}</p>
+          {role !== undefined && <p className={styles.role}>{role}</p>}
         </div>
-      )}
+        {person.mentorship_available === true && (
+          <div className={styles.tag}>
+            <Tag tone="accent">Mentor</Tag>
+          </div>
+        )}
+      </div>
     </Link>
   );
 }
 
 /** A placeholder in the row's shape, shown while the list loads. Decorative. */
 export function PersonRowSkeleton() {
   return (
-    <div aria-hidden="true" className={styles.row} data-skeleton="">
+    <div aria-hidden="true" className={styles.skeletonRow} data-skeleton="">
       <Skeleton shape="circle" className={styles.skeletonAvatar} />
       <div className={styles.identity}>
         <Skeleton className={styles.skeletonName} />
         <Skeleton className={styles.skeletonRole} />
       </div>
     </div>
   );
 }
diff --git a/packages/frontend/src/features/people/SuggestedAlumni.module.css b/packages/frontend/src/features/people/SuggestedAlumni.module.css
deleted file mode 100644
index 4e9992f4..00000000
--- a/packages/frontend/src/features/people/SuggestedAlumni.module.css
+++ /dev/null
@@ -1,42 +0,0 @@
-/* No design screen for this card (REQ-016). Card supplies the surface,
-   border, radius and padding; the rows bring their own space-2 padding, so
-   the list pulls them out by that much to line the avatars up with the
-   heading. The error state follows the profile's Recent posts: the alert
-   spans the card and Retry sits under it, start-aligned. */
-
-.card {
-  min-width: 0;
-}
-
-.heading {
-  margin: 0;
-  font: var(--text-heading-sm);
-}
-
-.list {
-  display: flex;
-  flex-direction: column;
-  gap: var(--space-1);
-  margin: 0 calc(-1 * var(--space-2));
-  padding: 0;
-  list-style: none;
-}
-
-.empty {
-  margin: 0;
-  color: var(--ink-secondary);
-  font: var(--text-body-sm);
-}
-
-.error {
-  display: flex;
-  flex-direction: column;
-  align-items: stretch;
-  gap: var(--space-3);
-  min-width: 0;
-}
-
-.retry {
-  align-self: flex-start;
-  padding: var(--space-2) var(--space-4);
-}
diff --git a/packages/frontend/src/features/people/SuggestedAlumni.test.tsx b/packages/frontend/src/features/people/SuggestedAlumni.test.tsx
index 24f30766..a9049c3f 100644
--- a/packages/frontend/src/features/people/SuggestedAlumni.test.tsx
+++ b/packages/frontend/src/features/people/SuggestedAlumni.test.tsx
@@ -1,181 +1,134 @@
-import type { SuggestedAlumni as SuggestedAlumniList } from '@alumni/shared';
-import { QueryClientProvider } from '@tanstack/react-query';
-import { act, render, screen, within } from '@testing-library/react';
+import type { AlumniListItem } from '@alumni/shared';
+import { act, screen, within } from '@testing-library/react';
 import userEvent from '@testing-library/user-event';
+import { afterEach, describe, expect, it } from 'vitest';
 import {
-  AxiosError,
-  type AxiosAdapter,
-  type AxiosResponse,
-  type InternalAxiosRequestConfig,
-} from 'axios';
-import { MemoryRouter } from 'react-router';
-import { afterEach, beforeEach, describe, expect, it } from 'vitest';
-import { createQueryClient } from '@/app/queryClient';
-import { httpClient } from '@/services/httpClient';
+  fail,
+  mockApi,
+  never,
+  ok,
+  renderWithProviders,
+  requests,
+  resetApi,
+  type Responder,
+} from '@/test/fakeApi';
 import { SuggestedAlumni, type SuggestedAlumniProps } from './SuggestedAlumni';
 
-// ---- a fake API at the axios adapter (the REQ-001 test policy) ----
-
-type Responder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;
-
-const ok =
-  (data: unknown): Responder =>
-  (config) =>
-    Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
-
-// A custom adapter must reject non-2xx itself (G26).
-const fail =
-  (status: number): Responder =>
-  (config) =>
-    Promise.reject(
-      new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, {
-        data: { message: 'nope' },
-        status,
-        statusText: String(status),
-        headers: {},
-        config,
-      }),
-    );
-
-/** Never answers: the query stays pending. */
-const never: Responder = () => new Promise<AxiosResponse>(() => undefined);
-
-const originalAdapter = httpClient.defaults.adapter;
-const requests: string[] = [];
+const SUGGESTIONS_URL = '/alumni/suggestions';
 
 /** Each GET /alumni/suggestions takes the next responder; the last one repeats. */
 function mockSuggestions(...responders: Responder[]): void {
-  const adapter: AxiosAdapter = (config) => {
-    const url = config.url ?? '';
-    if (url !== '/alumni/suggestions') return Promise.reject(new Error(`Unmocked: ${url}`));
-    requests.push(url);
-    const responder = responders[Math.min(requests.length, responders.length) - 1];
-    if (responder === undefined) return Promise.reject(new Error('no responder'));
-    return responder(config);
-  };
-  httpClient.defaults.adapter = adapter;
+  mockApi({ [SUGGESTIONS_URL]: responders });
 }
 
-const people: SuggestedAlumniList = [
+const people: AlumniListItem[] = [
   {
     id: 3,
     user_id: 30,
     name: 'Ada Lovelace',
     job_title: 'Engineer',
     current_company: 'Analytical',
     mentorship_available: true,
   },
   { id: 4, user_id: 40, name: 'Grace Hopper', mentorship_available: false },
 ];
 
 function renderSuggestions(props: SuggestedAlumniProps = {}) {
-  const client = createQueryClient();
-  // Errors end at once here; the app's retry policy is tested in queryClient.test.ts.
-  client.setDefaultOptions({
-    queries: { ...client.getDefaultOptions().queries, retry: false },
-  });
-  render(
-    <QueryClientProvider client={client}>
-      <MemoryRouter>
-        <p>Parent content</p>
-        <SuggestedAlumni {...props} />
-      </MemoryRouter>
-    </QueryClientProvider>,
-  );
-  return client;
+  return renderWithProviders(
+    <>
+      <p>Parent content</p>
+      <SuggestedAlumni {...props} />
+    </>,
+  ).queryClient;
 }
 
 const region = () => screen.getByRole('region', { name: 'Suggested alumni' });
 
-beforeEach(() => {
-  requests.length = 0;
-});
-
 afterEach(() => {
-  httpClient.defaults.adapter = originalAdapter;
+  resetApi();
 });
 
 describe('SuggestedAlumni', () => {
   it('lists each suggested person as a link to their profile', async () => {
     mockSuggestions(ok(people));
     renderSuggestions();
 
     const links = await within(region()).findAllByRole('link');
     expect(links.map((link) => link.getAttribute('href'))).toEqual(['/alumni/3', '/alumni/4']);
     expect(links[0]).toHaveAccessibleName('Ada Lovelace Engineer, Analytical Mentor');
     expect(links[1]).toHaveAccessibleName('Grace Hopper');
-    expect(requests).toEqual(['/alumni/suggestions']);
+    expect(requests.map((request) => request.url)).toEqual([SUGGESTIONS_URL]);
   });
 
   it("caches under the alumni root, so the admin page's invalidation reaches it", async () => {
     mockSuggestions(ok(people));
     const client = renderSuggestions();
     await within(region()).findAllByRole('link');
     expect(client.getQueryData(['alumni', 'suggestions'])).toEqual(people);
   });
 
   it('titles the card with a level-2 heading by default', () => {
     mockSuggestions(never);
     renderSuggestions();
     expect(screen.getByRole('heading', { level: 2, name: 'Suggested alumni' })).toBeInTheDocument();
   });
 
   it('takes the heading level from the parent', () => {
     mockSuggestions(never);
     renderSuggestions({ headingLevel: 3 });
     expect(screen.getByRole('heading', { level: 3, name: 'Suggested alumni' })).toBeInTheDocument();
     expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
   });
 
   it('shows skeleton rows and an announced loading status while it loads', () => {
     mockSuggestions(never);
     renderSuggestions();
     expect(within(region()).getByRole('status')).toHaveTextContent('Loading suggestions…');
     const busy = region().querySelector('[aria-busy="true"]');
     expect(busy).not.toBeNull();
     expect(busy?.querySelectorAll('[data-skeleton]')).toHaveLength(3);
     // A live region inside a busy subtree may not be announced (REFL-004).
     expect(busy?.contains(within(region()).getByRole('status'))).toBe(false);
     expect(within(region()).queryByRole('link')).not.toBeInTheDocument();
   });
 
   it('shows a short note when there is nobody to suggest', async () => {
     mockSuggestions(ok([]));
     renderSuggestions();
     expect(await within(region()).findByText(/No suggestions yet/)).toBeInTheDocument();
     expect(within(region()).queryByRole('list')).not.toBeInTheDocument();
   });
 
   it('shows an inline error with Retry, and Retry loads the people', async () => {
     mockSuggestions(fail(400), ok(people));
     const user = userEvent.setup();
     renderSuggestions();
 
     const alert = await within(region()).findByRole('alert');
     expect(alert).toHaveTextContent("Suggestions didn't load");
     await user.click(within(region()).getByRole('button', { name: 'Retry' }));
 
     expect(await within(region()).findByText('Ada Lovelace')).toBeInTheDocument();
     expect(within(region()).queryByRole('alert')).not.toBeInTheDocument();
     expect(requests).toHaveLength(2);
   });
 
   it('keeps its failure to itself: the parent content stays', async () => {
     mockSuggestions(fail(400));
     renderSuggestions();
     await within(region()).findByRole('alert');
     expect(screen.getByText('Parent content')).toBeInTheDocument();
   });
 
   it('keeps the people shown when a background refetch fails', async () => {
     mockSuggestions(ok(people), fail(400));
     const client = renderSuggestions();
     await within(region()).findByText('Ada Lovelace');
 
     await act(() => client.refetchQueries({ queryKey: ['alumni', 'suggestions'] }));
 
     expect(client.getQueryState(['alumni', 'suggestions'])?.status).toBe('error');
     expect(await within(region()).findByText('Ada Lovelace')).toBeInTheDocument();
     expect(within(region()).queryByRole('alert')).not.toBeInTheDocument();
   });
 });
diff --git a/packages/frontend/src/features/people/SuggestedAlumni.tsx b/packages/frontend/src/features/people/SuggestedAlumni.tsx
index cb5d9892..20786792 100644
--- a/packages/frontend/src/features/people/SuggestedAlumni.tsx
+++ b/packages/frontend/src/features/people/SuggestedAlumni.tsx
@@ -1,89 +1,61 @@
-import { useId, type ReactNode } from 'react';
-import { Alert } from '@/components/ui/Alert';
-import { Button } from '@/components/ui/Button';
-import { Card } from '@/components/ui/Card';
-import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
-import { cx } from '@/components/ui/cx';
-import { PersonRow, PersonRowSkeleton } from './PersonRow';
-import styles from './SuggestedAlumni.module.css';
+import type { ReactNode } from 'react';
+import { PersonList, PersonListSkeleton } from './PersonList';
+import {
+  SectionCard,
+  SectionEmpty,
+  SectionError,
+  SectionLoadingStatus,
+  type SectionHeadingLevel,
+} from './SectionCard';
 import { useSuggestedAlumni } from './useSuggestedAlumni';
 
 const SKELETON_COUNT = 3;
 
-const HEADINGS = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;
-
 export interface SuggestedAlumniProps {
   /** The title's heading level, so it fits the parent page's outline. Default 2. */
-  headingLevel?: keyof typeof HEADINGS;
+  headingLevel?: SectionHeadingLevel;
   /** Placement from the parent (grid area, margins). */
   className?: string;
 }
 
 /**
- * "Suggested alumni": a card listing the people `GET /api/alumni/suggestions`
- * returns, each a `PersonRow`. Used by Home and the Feed sidebar (REQ-016).
- * It owns its states, so its failure never reaches the parent: skeleton rows
- * while loading, an inline message with Retry on error, a short note when
- * there is nobody to suggest. A failed background refetch keeps the people
- * already shown. The loading status sits outside the aria-busy skeletons so
- * it is announced (as in the profile's Recent posts).
+ * "Suggested alumni": a `SectionCard` listing the people
+ * `GET /api/alumni/suggestions` returns, each a `PersonRow`. Used by Home and
+ * the Feed sidebar (REQ-016). It owns its states, so its failure never reaches
+ * the parent: skeleton rows while loading, an inline message with Retry on
+ * error, a short note when there is nobody to suggest. A failed background
+ * refetch keeps the people already shown.
  */
 export function SuggestedAlumni({ headingLevel = 2, className }: SuggestedAlumniProps) {
-  const headingId = useId();
   const suggestions = useSuggestedAlumni();
-  const Heading = HEADINGS[headingLevel];
 
   let body: ReactNode;
   if (suggestions.isPending) {
     body = (
       <>
-        <VisuallyHidden as="p" role="status">
-          Loading suggestions…
-        </VisuallyHidden>
-        <div className={styles.list} aria-busy="true">
-          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
-            <PersonRowSkeleton key={index} />
-          ))}
-        </div>
+        <SectionLoadingStatus>Loading suggestions…</SectionLoadingStatus>
+        <PersonListSkeleton count={SKELETON_COUNT} />
       </>
     );
   } else if (suggestions.isError && suggestions.data === undefined) {
     body = (
-      <div className={styles.error}>
-        <Alert tone="error" title="Suggestions didn't load">
-          Something went wrong on our side or with the connection. Try again in a moment.
-        </Alert>
-        <Button
-          className={styles.retry}
-          loading={suggestions.isFetching}
-          onClick={() => {
-            void suggestions.refetch();
-          }}
-        >
-          Retry
-        </Button>
-      </div>
+      <SectionError
+        title="Suggestions didn't load"
+        retrying={suggestions.isFetching}
+        onRetry={() => {
+          void suggestions.refetch();
+        }}
+      />
     );
   } else if (suggestions.data.length === 0) {
-    body = <p className={styles.empty}>No suggestions yet. Check back as more alumni join.</p>;
+    body = <SectionEmpty>No suggestions yet. Check back as more alumni join.</SectionEmpty>;
   } else {
-    body = (
-      <ul className={styles.list}>
-        {suggestions.data.map((person) => (
-          <li key={person.id}>
-            <PersonRow person={person} />
-          </li>
-        ))}
-      </ul>
-    );
+    body = <PersonList people={suggestions.data} />;
   }
 
   return (
-    <Card as="section" aria-labelledby={headingId} className={cx(styles.card, className)}>
-      <Heading id={headingId} className={styles.heading}>
-        Suggested alumni
-      </Heading>
+    <SectionCard title="Suggested alumni" headingLevel={headingLevel} className={className}>
       {body}
-    </Card>
+    </SectionCard>
   );
 }
diff --git a/packages/frontend/src/features/people/index.ts b/packages/frontend/src/features/people/index.ts
index 8d770814..949244d0 100644
--- a/packages/frontend/src/features/people/index.ts
+++ b/packages/frontend/src/features/people/index.ts
@@ -1,5 +1,13 @@
 export { PersonRow, PersonRowSkeleton } from './PersonRow';
 export type { PersonRowProps } from './PersonRow';
+export { PersonList, PersonListSkeleton } from './PersonList';
+export { SectionCard, SectionEmpty, SectionError, SectionLoadingStatus } from './SectionCard';
+export type {
+  SectionCardAction,
+  SectionCardProps,
+  SectionErrorProps,
+  SectionHeadingLevel,
+} from './SectionCard';
 export { SuggestedAlumni } from './SuggestedAlumni';
 export type { SuggestedAlumniProps } from './SuggestedAlumni';
 export { useSuggestedAlumni, SUGGESTED_ALUMNI_KEY } from './useSuggestedAlumni';
diff --git a/packages/frontend/src/services/alumniApi.test.ts b/packages/frontend/src/services/alumniApi.test.ts
index 7ffdebe9..277a1fd6 100644
--- a/packages/frontend/src/services/alumniApi.test.ts
+++ b/packages/frontend/src/services/alumniApi.test.ts
@@ -1,242 +1,242 @@
-import type { Alumni, AlumniListResponse, Post, SuggestedAlumni } from '@alumni/shared';
+import type { Alumni, AlumniListItem, AlumniListResponse, Post } from '@alumni/shared';
 import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
 import { afterEach, describe, expect, it } from 'vitest';
 import { getAlumniProfile, getPostsByUser, getSuggestedAlumni, searchAlumni } from './alumniApi';
 import { httpClient } from './httpClient';
 
 const originalAdapter = httpClient.defaults.adapter;
 
 const reply: AlumniListResponse = {
   items: [{ id: 1, user_id: 7, name: 'Ada Lovelace', department: 'CSE', graduation_year: 2020 }],
   total: 41,
 };
 
 // searchAlumni takes no config, so the mock goes on the client's default
 // adapter for one test (restored in afterEach).
 function respondWith(data: unknown): () => InternalAxiosRequestConfig {
   let captured: InternalAxiosRequestConfig | undefined;
   const adapter: AxiosAdapter = (config) => {
     captured = config;
     return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
   };
   httpClient.defaults.adapter = adapter;
   return () => {
     if (!captured) throw new Error('adapter was not called');
     return captured;
   };
 }
 
 // A custom adapter must reject non-2xx itself (axios's status check lives inside
 // its built-in adapters), the way httpClient.test.ts does.
 function failWith(status: number, data: unknown): void {
   httpClient.defaults.adapter = (config) =>
     Promise.reject(
       new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
         data,
         status,
         statusText: String(status),
         headers: {},
         config,
       }),
     );
 }
 
 // The query string axios actually sends, so the test checks the wire format.
 function queryOf(config: InternalAxiosRequestConfig): URLSearchParams {
   const uri = httpClient.getUri(config);
   return new URL(uri, 'http://localhost').searchParams;
 }
 
 describe('searchAlumni', () => {
   afterEach(() => {
     httpClient.defaults.adapter = originalAdapter;
   });
 
   it('gets /alumni with every param in the query string and returns { items, total }', async () => {
     const sent = respondWith(reply);
 
     await expect(
       searchAlumni({
         q: 'ada',
         department: 'CSE',
         university: 'NSU',
         graduationYear: 2020,
         page: 2,
         pageSize: 20,
       }),
     ).resolves.toEqual(reply);
 
     const config = sent();
     expect(config.method).toBe('get');
     expect(config.url).toBe('/alumni');
     expect(Object.fromEntries(queryOf(config))).toEqual({
       q: 'ada',
       department: 'CSE',
       university: 'NSU',
       graduationYear: '2020',
       page: '2',
       pageSize: '20',
     });
   });
 
   it('leaves out empty and blank text and undefined filters', async () => {
     const sent = respondWith(reply);
 
     await searchAlumni({ q: '', department: '   ', university: undefined, page: 1, pageSize: 20 });
 
     const query = queryOf(sent());
     expect([...query.keys()].sort()).toEqual(['page', 'pageSize']);
   });
 
   it('always sends page and pageSize, even with no filters', async () => {
     const sent = respondWith(reply);
 
     await searchAlumni({ page: 1, pageSize: 50 });
 
     expect(Object.fromEntries(queryOf(sent()))).toEqual({ page: '1', pageSize: '50' });
   });
 
   it('sends sort and order when set', async () => {
     const sent = respondWith(reply);
 
     await searchAlumni({ sort: 'graduationYear', order: 'desc', page: 1, pageSize: 10 });
 
     expect(Object.fromEntries(queryOf(sent()))).toEqual({
       sort: 'graduationYear',
       order: 'desc',
       page: '1',
       pageSize: '10',
     });
   });
 
   it('sends mentorship=true only when set', async () => {
     const sent = respondWith(reply);
 
     await searchAlumni({ mentorship: true, page: 1, pageSize: 5 });
     expect(Object.fromEntries(queryOf(sent()))).toEqual({
       mentorship: 'true',
       page: '1',
       pageSize: '5',
     });
 
     await searchAlumni({ page: 1, pageSize: 5 });
     expect(queryOf(sent()).has('mentorship')).toBe(false);
   });
 
   it('sends either half of the sort on its own', async () => {
     const sent = respondWith(reply);
 
     await searchAlumni({ order: 'desc', page: 1, pageSize: 10 });
     expect([...queryOf(sent()).keys()].sort()).toEqual(['order', 'page', 'pageSize']);
 
     await searchAlumni({ sort: 'name', page: 1, pageSize: 10 });
     expect([...queryOf(sent()).keys()].sort()).toEqual(['page', 'pageSize', 'sort']);
   });
 
   it('encodes text with spaces and symbols', async () => {
     const sent = respondWith(reply);
 
     await searchAlumni({ q: 'R&D lead', page: 1, pageSize: 20 });
 
     expect(queryOf(sent()).get('q')).toBe('R&D lead');
   });
 
   it('rejects with the axios error on a non-2xx answer', async () => {
     failWith(400, { message: 'graduationYear must be a 4-digit year' });
 
     const error: unknown = await searchAlumni({ page: 1, pageSize: 20 }).catch((e: unknown) => e);
 
     expect(error).toBeInstanceOf(AxiosError);
     expect((error as AxiosError).response?.status).toBe(400);
   });
 });
 
 describe('getAlumniProfile', () => {
   afterEach(() => {
     httpClient.defaults.adapter = originalAdapter;
   });
 
   const profile: Alumni = { id: 3, user_id: 7, name: 'Ada Lovelace', email: 'ada@example.com' };
 
   it('gets /alumni/:id and returns the profile', async () => {
     const sent = respondWith(profile);
 
     await expect(getAlumniProfile('3')).resolves.toEqual(profile);
 
     const config = sent();
     expect(config.method).toBe('get');
     expect(config.url).toBe('/alumni/3');
   });
 
   it('encodes an id with odd characters so it stays one path segment', async () => {
     const sent = respondWith(profile);
 
     await getAlumniProfile('1/../users?x=1#y z');
 
     expect(sent().url).toBe('/alumni/1%2F..%2Fusers%3Fx%3D1%23y%20z');
   });
 
   it('rejects with the axios error on a 404', async () => {
     failWith(404, { message: 'Alumni not found' });
 
     const error: unknown = await getAlumniProfile('999').catch((e: unknown) => e);
 
     expect(error).toBeInstanceOf(AxiosError);
     expect((error as AxiosError).response?.status).toBe(404);
   });
 });
 
 describe('getPostsByUser', () => {
   afterEach(() => {
     httpClient.defaults.adapter = originalAdapter;
   });
 
   it('gets /posts/user/:userId and returns the list', async () => {
     const posts: Post[] = [{ id: 11, user_id: 7, caption: 'Hello' }];
     const sent = respondWith(posts);
 
     await expect(getPostsByUser(7)).resolves.toEqual(posts);
 
     const config = sent();
     expect(config.method).toBe('get');
     expect(config.url).toBe('/posts/user/7');
   });
 
   it('rejects with the axios error on a non-2xx answer', async () => {
     failWith(500, { message: 'Something went wrong' });
 
     const error: unknown = await getPostsByUser(7).catch((e: unknown) => e);
 
     expect(error).toBeInstanceOf(AxiosError);
     expect((error as AxiosError).response?.status).toBe(500);
   });
 });
 
 describe('getSuggestedAlumni', () => {
   afterEach(() => {
     httpClient.defaults.adapter = originalAdapter;
   });
 
   it('gets /alumni/suggestions with no query string and returns the array', async () => {
-    const people: SuggestedAlumni = [
+    const people: AlumniListItem[] = [
       { id: 2, user_id: 8, name: 'Grace Hopper', mentorship_available: true },
     ];
     const sent = respondWith(people);
 
     await expect(getSuggestedAlumni()).resolves.toEqual(people);
 
     const config = sent();
     expect(config.method).toBe('get');
     expect(config.url).toBe('/alumni/suggestions');
     expect([...queryOf(config).keys()]).toEqual([]);
   });
 
   it('rejects with the axios error on a non-2xx answer', async () => {
     failWith(401, { message: 'Unauthorized' });
 
     const error: unknown = await getSuggestedAlumni().catch((e: unknown) => e);
 
     expect(error).toBeInstanceOf(AxiosError);
     expect((error as AxiosError).response?.status).toBe(401);
   });
 });
diff --git a/packages/frontend/src/services/alumniApi.ts b/packages/frontend/src/services/alumniApi.ts
index 6a95f932..abc0d2cc 100644
--- a/packages/frontend/src/services/alumniApi.ts
+++ b/packages/frontend/src/services/alumniApi.ts
@@ -1,74 +1,74 @@
 import type {
   Alumni,
+  AlumniListItem,
   AlumniListResponse,
   AlumniSort,
   Post,
   SortOrder,
-  SuggestedAlumni,
 } from '@alumni/shared';
 import { httpClient } from './httpClient';
 
 // Search params for GET /api/alumni. The page size is the caller's choice; its
 // default lives in the directory feature, not here.
 export interface AlumniSearchParams {
   q?: string;
   department?: string;
   university?: string;
   graduationYear?: number;
   /** Only alumni available for mentorship. The API has no "false" filter. */
   mentorship?: true;
   /** Server-side sort; left out, the API sorts by name (the directory's order). */
   sort?: AlumniSort;
   order?: SortOrder;
   page: number;
   pageSize: number;
 }
 
 type QueryParams = Record<string, string | number>;
 
 // Blank text and missing filters are left out of the query string, so the URL
 // only carries what the user actually searched for (the API treats them as
 // absent anyway). mentorship, sort and order go only when set. page and pageSize are
 // always sent.
 function toQueryParams(params: AlumniSearchParams): QueryParams {
   const out: QueryParams = {};
   const text = { q: params.q, department: params.department, university: params.university };
   for (const [key, value] of Object.entries(text)) {
     if (value !== undefined && value.trim() !== '') out[key] = value;
   }
   if (params.graduationYear !== undefined) out.graduationYear = params.graduationYear;
   if (params.mentorship === true) out.mentorship = 'true';
   if (params.sort !== undefined) out.sort = params.sort;
   if (params.order !== undefined) out.order = params.order;
   out.page = params.page;
   out.pageSize = params.pageSize;
   return out;
 }
 
 export async function searchAlumni(params: AlumniSearchParams): Promise<AlumniListResponse> {
   const res = await httpClient.get<AlumniListResponse>('/alumni', {
     params: toQueryParams(params),
   });
   return res.data;
 }
 
 // GET /api/alumni/suggestions: up to 5 other alumni for the signed-in user
 // (ranked by the API; a bare array, [] when there is nobody else).
-export async function getSuggestedAlumni(): Promise<SuggestedAlumni> {
-  const res = await httpClient.get<SuggestedAlumni>('/alumni/suggestions');
+export async function getSuggestedAlumni(): Promise<AlumniListItem[]> {
+  const res = await httpClient.get<AlumniListItem[]>('/alumni/suggestions');
   return res.data;
 }
 
 // GET /api/alumni/:id. The id comes from the URL, so it is encoded: a stray "/"
 // or "?" must reach the API as part of the id (and get its 400 or 404), never
 // change which endpoint is called.
 export async function getAlumniProfile(id: string): Promise<Alumni> {
   const res = await httpClient.get<Alumni>(`/alumni/${encodeURIComponent(id)}`);
   return res.data;
 }
 
 // GET /api/posts/user/:userId, newest first as the API returns them.
 export async function getPostsByUser(userId: number): Promise<Post[]> {
   const res = await httpClient.get<Post[]>(`/posts/user/${String(userId)}`);
   return res.data;
 }
diff --git a/packages/frontend/src/styles/global.css b/packages/frontend/src/styles/global.css
index 73dd1612..91eb815f 100644
--- a/packages/frontend/src/styles/global.css
+++ b/packages/frontend/src/styles/global.css
@@ -1,75 +1,84 @@
 /* Reset and base element styles. Every value comes from tokens.css, which
    main.tsx imports just before this file (no @import here). */
 
 *,
 *::before,
 *::after {
   box-sizing: border-box;
 }
 
+/* --page-max: the widest a page's content column gets (REQ-016). Home,
+   Directory, Profile, Feed and SiteFooter's inner box all use
+   min(100%, var(--page-max)), centred, so the footer lines up with the page
+   above it. Declared once here, not on the shell, so a page rendered outside
+   AppShell (a test page, an error element) still gets the cap. */
+:root {
+  --page-max: 72rem;
+}
+
 body {
   margin: 0;
   background: var(--surface-page);
   color: var(--ink-primary);
   font: var(--text-body);
   -webkit-font-smoothing: antialiased;
 }
 
 h1,
 h2,
 h3,
 h4,
 h5,
 h6,
 p {
   margin: 0;
 }
 
 h1,
 h2,
 h3,
 h4,
 h5,
 h6 {
   font: inherit;
 }
 
 button,
 input,
 select,
 textarea {
   font: inherit;
   color: inherit;
 }
 
 img,
 svg {
   display: block;
   max-width: 100%;
 }
 
 /* Keyboard focus ring for every control. An outline, not a shadow; the Input
    primitive overrides this with its border-only focus (design README). */
 :focus-visible {
   outline: 2px solid var(--accent);
   outline-offset: 2px;
 }
 
 /* Phones: the sticky tab bar (about 4.5rem) must not hide a control that
    scrolls into view on focus. */
 @media (width < 48rem) {
   html {
     scroll-padding-block-end: 5rem;
   }
 }
 
 @media (prefers-reduced-motion: reduce) {
   *,
   *::before,
   *::after {
     transition-duration: 0.01ms !important;
     animation-duration: 0.01ms !important;
     animation-iteration-count: 1 !important;
     scroll-behavior: auto !important;
   }
 }
diff --git a/packages/shared/src/types/alumni.types.ts b/packages/shared/src/types/alumni.types.ts
index 6e3b4ace..c855da47 100644
--- a/packages/shared/src/types/alumni.types.ts
+++ b/packages/shared/src/types/alumni.types.ts
@@ -1,115 +1,115 @@
 import type { User } from "./user.types";
 
 export interface Alumni {
   id: number;
   user_id: number;
   graduation_year?: number | null; // INTEGER column; null when not set
   department?: string;
   current_company?: string;
   job_title?: string;
   experience?: string;
   bio?: string;
   linkedin_url?: string;
   headline?: string | null;
   location?: string | null;
   degree?: string | null;
   start_year?: number | null; // INTEGER column; null when not set
   // The API always sends a boolean (column is NOT NULL DEFAULT false); optional so older fixtures compile.
   mentorship_available?: boolean;
   created_at?: Date;
   updated_at?: Date;
   // Joined from users. `email` is only returned by GET /api/alumni/:id.
   name?: string;
   email?: string;
   photo_url?: string;
   university?: string;
 }
 
 // One row of GET /api/alumni: the profile plus the joined public user columns (never email).
 export type AlumniListItem = Omit<Alumni, "email">;
 
 // Optional server-side sort on GET /api/alumni. No sort = name, then id (the directory's order).
 // order without sort applies to name; graduationYear puts alumni with no year last in both directions.
 export type AlumniSort = "name" | "graduationYear";
 export type SortOrder = "asc" | "desc";
 
 // GET /api/alumni?q=&department=&university=&graduationYear=&mentorship=&sort=&order=&page=&pageSize=
 // mentorship=true returns only alumni with mentorship_available; it takes no other value (REQ-016).
 // page defaults to 1 (max 10000), pageSize to 20 (max 100). total counts every match, not just this page.
 export interface AlumniListResponse {
   items: AlumniListItem[];
   total: number;
 }
 
 // GET /api/alumni/suggestions (any signed-in role; REQ-016): a bare array of up to 5 other alumni,
 // never the caller. Order: same department as the caller (their alumni row, else students row) first,
 // then same university, then name and id; missing values never count as a match. [] when nobody else.
-export type SuggestedAlumni = AlumniListItem[];
+// The body is AlumniListItem[]; there is no alias, so the name stays free for the UI card.
 
 // GET/PUT /api/me: the caller's account plus their alumni or students row, if they have one.
 // Every role gets a profile; alumni fields are empty when has_alumni_profile is false,
 // student fields when has_student_profile is false.
 export interface MyProfile {
   user_id: number;
   name: string;
   email: string;
   photo_url?: string;
   role: User["role"];
   university?: string;
   alumni_id: number | null;
   has_alumni_profile: boolean;
   student_id: number | null;
   has_student_profile: boolean;
   // department, company, job title, experience, bio and LinkedIn: from the alumni or the student profile.
   department?: string;
   expected_graduation_year?: string; // students only
   graduation_year?: string;
   current_company?: string;
   job_title?: string;
   experience?: string;
   bio?: string;
   linkedin_url?: string;
   // Alumni only: null for students and accounts without an alumni row.
   headline?: string | null;
   location?: string | null;
   degree?: string | null;
   start_year?: string; // text like graduation_year
   // Always a boolean from the API (false without an alumni row); optional in the type, read missing as false.
   mentorship_available?: boolean;
   created_at?: Date;
   login_at?: Date;
   updated_at?: Date; // latest change to the account or alumni profile
 }
 
 // PUT /api/me replaces all of these; omitted optional fields are cleared (an omitted email is kept).
 // Everyone can change name, email, photo_url and university. Alumni and students (with a profile row)
 // also edit company, job title, LinkedIn, bio and experience. Alumni edit department + graduation_year,
 // plus headline, location, degree, start_year (not after graduation_year) and mentorship_available
 // (omitted = false); students must send department + expected_graduation_year and never these five.
 // Changing the email requires current_password. Role cannot be changed; password has its own endpoint.
 export interface UpdateMyProfileInput {
   name: string;
   email?: string;
   current_password?: string;
   photo_url?: string;
   university?: string;
   department?: string;
   expected_graduation_year?: string;
   graduation_year?: string;
   current_company?: string;
   job_title?: string;
   experience?: string;
   bio?: string;
   linkedin_url?: string;
   headline?: string;
   location?: string;
   degree?: string;
   start_year?: string;
   mentorship_available?: boolean;
 }
 
 // PUT /api/me/password (204 on success). new_password: 8–72 characters, different from the current one.
 export interface ChangePasswordInput {
   current_password: string;
   new_password: string;
 }
```

## New files (untracked)

### packages/frontend/src/features/people/PersonList.module.css

```
/* A short list of PersonRows inside a section card. The rows bring their own
   space-2 padding, so the list pulls them out by that much to line the
   avatars up with the heading. */

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0 calc(-1 * var(--space-2));
  padding: 0;
  list-style: none;
}
```

### packages/frontend/src/features/people/PersonList.tsx

```
import type { AlumniListItem } from '@alumni/shared';
import { PersonRow, PersonRowSkeleton } from './PersonRow';
import styles from './PersonList.module.css';

/** People as a list of `PersonRow`s, keyed by alumni id. */
export function PersonList({ people }: { people: readonly AlumniListItem[] }) {
  return (
    <ul className={styles.list}>
      {people.map((person) => (
        <li key={person.id}>
          <PersonRow person={person} />
        </li>
      ))}
    </ul>
  );
}

/**
 * `count` skeleton rows in an `aria-busy` box. Pair it with a
 * `SectionLoadingStatus` placed outside it, so the status is announced.
 */
export function PersonListSkeleton({ count }: { count: number }) {
  return (
    <div className={styles.list} aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <PersonRowSkeleton key={index} />
      ))}
    </div>
  );
}
```

### packages/frontend/src/features/people/SectionCard.module.css

```
/* A section card (REQ-016, no design screen), shared by Home's sections and
   the Feed sidebar: Card's surface, border, radius and padding; the title in
   heading-sm with the "See all" style link on the right in the accent label
   (as the log-in page's links). The error state follows the profile's Recent
   posts: the alert spans the card and Retry sits under it, start-aligned. */

.section {
  min-width: 0;
}

.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.heading {
  margin: 0;
  color: var(--ink-primary);
  font: var(--text-heading-sm);
}

.action {
  flex: none;
  color: var(--accent);
  font: var(--text-label);
  text-decoration: none;
  border-radius: var(--radius-sm);
}

.action:hover {
  text-decoration: underline;
}

.empty {
  margin: 0;
  color: var(--ink-secondary);
  font: var(--text-body-sm);
}

.error {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3);
  min-width: 0;
}

.retry {
  align-self: flex-start;
  padding: var(--space-2) var(--space-4);
}
```

### packages/frontend/src/features/people/SectionCard.tsx

```
import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { cx } from '@/components/ui/cx';
import styles from './SectionCard.module.css';

const HEADINGS = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

export type SectionHeadingLevel = keyof typeof HEADINGS;

export interface SectionCardAction {
  to: string;
  /** The visible link text ("See all"). */
  label: string;
  /** A fuller accessible name when the label alone is vague; must start with the label (WCAG 2.5.3). */
  name?: string;
}

export interface SectionCardProps {
  title: string;
  /** The title's heading level, so it fits the parent page's outline. Default 2. */
  headingLevel?: SectionHeadingLevel;
  /** A link beside the title (to the full page). */
  action?: SectionCardAction;
  /** Placement from the parent (grid area, margins). */
  className?: string;
  children: ReactNode;
}

/**
 * One section card (Home's sections, the Feed sidebar): a `<section>` named by
 * its title, with an optional link to the full page beside the title. The
 * section's own loading, empty and error content goes in as children, built
 * from the helpers below, so every section looks and behaves alike.
 */
export function SectionCard({
  title,
  headingLevel = 2,
  action,
  className,
  children,
}: SectionCardProps) {
  const headingId = useId();
  const Heading = HEADINGS[headingLevel];
  return (
    <Card as="section" aria-labelledby={headingId} className={cx(styles.section, className)}>
      <div className={styles.header}>
        <Heading id={headingId} className={styles.heading}>
          {title}
        </Heading>
        {action !== undefined && (
          <Link to={action.to} className={styles.action} aria-label={action.name}>
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

/** A loading status line for screen readers; it sits outside the aria-busy skeletons so it is announced. */
export function SectionLoadingStatus({ children }: { children: string }) {
  return (
    <VisuallyHidden as="p" role="status">
      {children}
    </VisuallyHidden>
  );
}

export interface SectionErrorProps {
  title: string;
  /** True while a retry is in flight (the button shows its spinner). */
  retrying: boolean;
  onRetry: () => void;
}

/** A section's own error: an inline alert with Retry under it, so the rest of the page stays. */
export function SectionError({ title, retrying, onRetry }: SectionErrorProps) {
  return (
    <div className={styles.error}>
      <Alert tone="error" title={title}>
        Something went wrong on our side or with the connection. Try again in a moment.
      </Alert>
      <Button className={styles.retry} loading={retrying} onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

/** The one-line note a section shows when it has nothing to list. */
export function SectionEmpty({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}
```

### packages/frontend/src/test/fakeApi.tsx

```
/*
 * Shared test-only helpers (imported by *.test.tsx and feature test kits,
 * never by app code): a fake API at the axios adapter (the REQ-001 test
 * policy) and a render helper with a query client and a router. Started for
 * Home and features/people (REQ-016, QUAL-003); the older feed and admin kits
 * keep their own copies until they move here.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { httpClient } from '@/services/httpClient';

export type Responder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

export const ok =
  (data: unknown): Responder =>
  (config) =>
    Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });

// A custom adapter must reject non-2xx itself (G26). Tests use a 4xx so the
// app's retry policy (5xx only) never delays the error state.
export const fail =
  (status = 400): Responder =>
  (config) =>
    Promise.reject(
      new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, {
        data: { message: 'nope' },
        status,
        statusText: String(status),
        headers: {},
        config,
      }),
    );

/** Never answers: the query stays pending. */
export const never: Responder = () => new Promise<AxiosResponse>(() => undefined);

export interface SeenRequest {
  url: string;
  params: unknown;
}

/** Every request the fake API received, in order. */
export const requests: SeenRequest[] = [];
const originalAdapter = httpClient.defaults.adapter;

/**
 * Routes each request by URL. A URL takes its responders in turn and the last
 * one repeats; an unlisted URL never answers (so a section under test is not
 * disturbed by the others).
 */
export function mockApi(routes: Readonly<Record<string, Responder | readonly Responder[]>>): void {
  const calls = new Map<string, number>();
  const adapter: AxiosAdapter = (config) => {
    const url = config.url ?? '';
    requests.push({ url, params: config.params });
    const route = routes[url];
    if (route === undefined) return never(config);
    const list = typeof route === 'function' ? [route] : route;
    const count = (calls.get(url) ?? 0) + 1;
    calls.set(url, count);
    const responder = list[Math.min(count, list.length) - 1];
    return responder === undefined ? never(config) : responder(config);
  };
  httpClient.defaults.adapter = adapter;
}

/** Puts the real adapter back and forgets the recorded requests (call in afterEach). */
export function resetApi(): void {
  requests.length = 0;
  httpClient.defaults.adapter = originalAdapter;
}

/**
 * Renders `ui` with a fresh query client and a router. `seed` may fill the
 * cache first (e.g. `['me']`). Errors end at once (no retry); the app's retry
 * policy is tested in app/queryClient.test.ts.
 */
export function renderWithProviders(ui: ReactNode, seed?: (queryClient: QueryClient) => void) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false } },
  });
  seed?.(queryClient);
  // A wrapper, not a parent element, so `rerender` keeps the providers.
  const result = render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  });
  return { ...result, queryClient };
}
```

