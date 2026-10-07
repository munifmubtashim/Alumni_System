import type { Alumni } from '@alumni/shared';
import type { Ref } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { cx } from '@/components/ui/cx';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { BRAND_NAME } from '@/config/brand';
import { headline, present, safeLinkedInUrl } from './format';
import styles from './ProfileHeader.module.css';

/** The h1 when a profile has no name (the API allows a blank one). */
export const UNNAMED_PROFILE = 'Alumni profile';

export interface ProfileHeaderProps {
  alumni: Pick<
    Alumni,
    | 'name'
    | 'photo_url'
    | 'headline'
    | 'job_title'
    | 'current_company'
    | 'graduation_year'
    | 'location'
    | 'linkedin_url'
    | 'mentorship_available'
  >;
  /** The page focuses this h1 when the profile first shows (ADV-005). */
  headingRef?: Ref<HTMLHeadingElement>;
}

/**
 * The profile's header (S3): large avatar, the name as the page's one h1 with
 * the "Available for mentorship" badge beside it (only when the flag is true;
 * a sage pill on success-soft, S3),
 * the line "<headline> · Class of YYYY" under it, then the location and a
 * LinkedIn link (only for a safe http(s) URL). Each part hides when empty.
 * Below 48rem the badge moves under the line (S3 phone). Sets the tab title
 * to "<name> · Alma". Never shows the email.
 */
export function ProfileHeader({ alumni, headingRef }: ProfileHeaderProps) {
  const name = present(alumni.name);
  const heading = name ?? UNNAMED_PROFILE;
  const line = headline(alumni);
  const location = present(alumni.location);
  const linkedIn = safeLinkedInUrl(alumni.linkedin_url);
  const mentor = alumni.mentorship_available === true;

  return (
    <header className={styles.header}>
      <title>{`${heading} · ${BRAND_NAME}`}</title>
      <Avatar
        className={styles.avatar}
        size="lg"
        name={name ?? ''}
        photoUrl={present(alumni.photo_url)}
      />
      <div className={styles.identity}>
        <div className={styles.nameRow}>
          <h1 ref={headingRef} className={styles.name} tabIndex={-1}>
            {heading}
          </h1>
          {mentor && (
            <span className={styles.badge}>
              <svg
                className={styles.badgeDot}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable={false}
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
              Available for mentorship
            </span>
          )}
        </div>
        {line !== undefined && <p className={styles.headline}>{line}</p>}
        {(location !== undefined || linkedIn !== undefined) && (
          <div className={styles.links}>
            {location !== undefined && (
              <p className={styles.location}>
                <svg
                  className={cx(styles.icon, styles.pin)}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable={false}
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <VisuallyHidden>Location:</VisuallyHidden> {location}
              </p>
            )}
            {linkedIn !== undefined && (
              <a
                className={styles.linkedIn}
                href={linkedIn}
                target="_blank"
                rel="noopener noreferrer"
              >
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
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                  <path d="M8 9h4v2a4.5 4.5 0 0 1 8 3v7h-4v-6a2 2 0 0 0-4 0v6H8z" />
                </svg>
                LinkedIn <VisuallyHidden>(opens in a new tab)</VisuallyHidden>
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
