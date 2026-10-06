import { useEffect, useRef, type ReactNode } from 'react';
import { useParams } from 'react-router';
import { isNotFoundError } from '@/services/httpErrors';
import { AboutSection } from './AboutSection';
import { BackLink } from './BackLink';
import { EducationSection } from './EducationSection';
import { EmploymentSection } from './EmploymentSection';
import { ProfileHeader } from './ProfileHeader';
import { ProfileLoadError, ProfileNotFound, ProfileSkeleton } from './ProfileStates';
import { RecentPosts } from './RecentPosts';
import { useAlumniProfile } from './useAlumniProfile';
import styles from './ProfilePage.module.css';

type View = 'loading' | 'notFound' | 'error' | 'profile';

/**
 * One alumni profile at `/alumni/:id` (S3). The id comes from the URL; the
 * profile query decides the state: loading, not found (a 404, which the API
 * also gives for a malformed id), load error with Retry, or the profile. Each
 * state has its own h1, and focus moves to it whenever the state or the id
 * changes, so focus is never left on a node that unmounted (L-REQ-006-2). It
 * moves only when focus is on the body or on a node that left the page (a
 * clicked directory card, a Retry that succeeded); a control the user tabbed
 * to, such as the Back link, keeps it. A failed background refetch keeps the
 * profile already shown (TanStack Query keeps `data` and sets `isError`); only
 * a 404 replaces it. Recent posts owns its own states, so a posts failure
 * keeps the profile.
 */
export function ProfilePage() {
  const { id } = useParams();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const profile = useAlumniProfile(id);

  let view: View;
  if (id === undefined || id === '') view = 'notFound';
  else if (profile.isPending) view = 'loading';
  else if (profile.isError && isNotFoundError(profile.error)) view = 'notFound';
  else if (profile.isError && profile.data === undefined) view = 'error';
  else view = 'profile';

  useEffect(() => {
    const active = document.activeElement;
    if (active === null || active === document.body || !active.isConnected) {
      headingRef.current?.focus();
    }
  }, [id, view]);

  let body: ReactNode;
  if (view === 'loading') {
    body = <ProfileSkeleton headingRef={headingRef} />;
  } else if (view === 'notFound') {
    body = <ProfileNotFound headingRef={headingRef} />;
  } else if (view === 'error') {
    body = (
      <ProfileLoadError
        headingRef={headingRef}
        retrying={profile.isFetching}
        onRetry={() => {
          void profile.refetch();
        }}
      />
    );
  } else if (profile.data !== undefined) {
    const alumni = profile.data;
    body = (
      <>
        <ProfileHeader alumni={alumni} headingRef={headingRef} />
        <AboutSection alumni={alumni} />
        <EducationSection alumni={alumni} />
        <EmploymentSection alumni={alumni} />
        <RecentPosts userId={alumni.user_id} />
      </>
    );
  }

  return (
    <div className={styles.page}>
      <BackLink />
      {body}
    </div>
  );
}
