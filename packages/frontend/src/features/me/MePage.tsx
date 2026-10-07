import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { BRAND_NAME } from '@/config/brand';
import { useCurrentUser } from '@/features/auth';
import { ProfileForm } from './ProfileForm';
import styles from './MePage.module.css';

export const ME_HEADING = 'My Profile';
export const LOAD_ERROR_TEXT = "We couldn't load your profile. Try again in a moment.";

type View = 'loading' | 'error' | 'form';

/**
 * /me (S5): the signed-in user's own profile editor, from the ['me'] query
 * that the header already uses. Loading shows skeleton cards, a failed first
 * load an error with Retry; once the profile is there the form stays, even if
 * a background refetch fails. ProfileForm is keyed on `user_id` only, so a
 * refetch or the save's own cache write never remounts it (ADV-004).
 *
 * Below 48rem the page starts with S5's phone bar (a back arrow home and the
 * "My Profile" title, both one link named "Back to home"); the h1 is then
 * visually hidden but still the page's heading. From 48rem the bar goes and
 * the h1 shows. Focus moves to the h1 when the view changes only if focus was
 * lost (LESSON-REQ-008-2).
 */
export function MePage() {
  const me = useCurrentUser();
  const headingRef = useRef<HTMLHeadingElement>(null);

  let view: View;
  if (me.data !== undefined) view = 'form';
  else if (me.isError) view = 'error';
  else view = 'loading';

  useEffect(() => {
    const active = document.activeElement;
    if (active === null || active === document.body || !active.isConnected) {
      headingRef.current?.focus();
    }
  }, [view]);

  return (
    <div className={styles.page}>
      <title>{`${ME_HEADING} · ${BRAND_NAME}`}</title>
      <div className={styles.phoneBar}>
        <Link to="/" className={styles.back}>
          <svg className={styles.backIcon} viewBox="0 0 24 24" aria-hidden="true" focusable={false}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <VisuallyHidden>Back to home</VisuallyHidden>
          <span aria-hidden="true">{ME_HEADING}</span>
        </Link>
      </div>
      <h1 ref={headingRef} tabIndex={-1} className={styles.heading}>
        {ME_HEADING}
      </h1>
      {view === 'loading' && <MeSkeleton />}
      {view === 'error' && (
        <div className={styles.error}>
          <Alert tone="error">{LOAD_ERROR_TEXT}</Alert>
          <Button
            className={styles.retry}
            loading={me.isFetching}
            onClick={() => {
              void me.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      )}
      {me.data !== undefined && (
        <ProfileForm key={me.data.user_id} profile={me.data} headingRef={headingRef} />
      )}
    </div>
  );
}

/** Loading: a polite status line and decorative card skeletons (aria-busy only on them, G30). */
function MeSkeleton() {
  return (
    <>
      <VisuallyHidden as="p" role="status">
        Loading your profile…
      </VisuallyHidden>
      <div className={styles.skeleton} aria-hidden="true" aria-busy="true">
        {[0, 1, 2].map((card) => (
          <div key={card} className={styles.skeletonCard}>
            <Skeleton className={styles.skeletonHeading} />
            <Skeleton className={styles.skeletonField} shape="block" />
            <Skeleton className={styles.skeletonField} shape="block" />
          </div>
        ))}
      </div>
    </>
  );
}
