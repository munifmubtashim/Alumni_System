import type { Ref } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { BRAND_NAME } from '@/config/brand';
import styles from './ProfileStates.module.css';

/**
 * The profile page's non-success states. Each has its own h1 (`tabIndex={-1}`,
 * the page focuses it when the state shows) and its own tab title, so a screen
 * reader user always hears where they are (ADV-005).
 */

export const LOADING_HEADING = 'Loading profile';
export const NOT_FOUND_HEADING = 'Profile not found';
export const LOAD_ERROR_HEADING = "Couldn't load this profile";

interface HeadingRefProps {
  headingRef?: Ref<HTMLHeadingElement>;
}

/** Loading: a hidden h1, a polite status line, and a decorative header skeleton. */
export function ProfileSkeleton({ headingRef }: HeadingRefProps) {
  return (
    <div>
      <title>{`Profile · ${BRAND_NAME}`}</title>
      {/* The h1 holds the hidden text (VisuallyHidden takes no ref); it is
          focusable even though it draws nothing. */}
      <h1 ref={headingRef} className={styles.hiddenHeading} tabIndex={-1}>
        <VisuallyHidden>{LOADING_HEADING}</VisuallyHidden>
      </h1>
      <VisuallyHidden as="p" role="status">
        Loading profile…
      </VisuallyHidden>
      <div className={styles.skeleton} aria-hidden="true" aria-busy="true">
        <div className={styles.skeletonHeader}>
          <Skeleton shape="circle" className={styles.skeletonAvatar} />
          <div className={styles.skeletonIdentity}>
            <Skeleton className={styles.skeletonName} />
            <Skeleton className={styles.skeletonLine} />
          </div>
        </div>
        <div className={styles.skeletonSection}>
          <Skeleton className={styles.skeletonHeading} />
          <Skeleton />
          <Skeleton className={styles.skeletonLine} />
        </div>
      </div>
    </div>
  );
}

/** No profile with this id (a 404, also for a malformed id: G14). */
export function ProfileNotFound({ headingRef }: HeadingRefProps) {
  return (
    <div className={styles.message}>
      <title>{`${NOT_FOUND_HEADING} · ${BRAND_NAME}`}</title>
      <h1 ref={headingRef} className={styles.heading} tabIndex={-1}>
        {NOT_FOUND_HEADING}
      </h1>
      <p className={styles.text}>
        This profile doesn't exist or was removed. Go back to the directory to find someone else.
      </p>
    </div>
  );
}

export interface ProfileLoadErrorProps extends HeadingRefProps {
  onRetry: () => void;
  /** True while the retry is in flight: the button shows busy and is disabled. */
  retrying?: boolean;
}

/** Any other failure: a message and a Retry that refetches. A 401 never gets here (ADR-03). */
export function ProfileLoadError({ headingRef, onRetry, retrying = false }: ProfileLoadErrorProps) {
  return (
    <div className={styles.message}>
      <title>{`${LOAD_ERROR_HEADING} · ${BRAND_NAME}`}</title>
      <h1 ref={headingRef} className={styles.heading} tabIndex={-1}>
        {LOAD_ERROR_HEADING}
      </h1>
      <Alert tone="error">
        Something went wrong on our side or with the connection. Try again in a moment.
      </Alert>
      <Button className={styles.retry} loading={retrying} onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
