import { Link, useLocation } from 'react-router';
import { directoryReturnPath } from '@/config/directoryReturn';
import styles from './BackLink.module.css';

/**
 * The profile's top row: one link back to the directory, restoring the search,
 * filters and page the card was clicked from (router state, REQ-008 AC10).
 * From 48rem: chevron + "Back to directory" (S3 desktop). Below 48rem: the
 * chevron alone, its text visually hidden (clip, not display:none, so the name
 * stays), with an aria-hidden "Profile" title beside it (S3 phone's bar). The
 * link's name is "Back to directory" at both widths.
 */
export function BackLink() {
  // location.state is typed `any`; directoryReturnPath checks its shape.
  const state: unknown = useLocation().state;

  return (
    <div className={styles.row}>
      <Link to={directoryReturnPath(state)} className={styles.link}>
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable={false}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className={styles.label}>Back to directory</span>
      </Link>
      <span className={styles.title} aria-hidden="true">
        Profile
      </span>
    </div>
  );
}
