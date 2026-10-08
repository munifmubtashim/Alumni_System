import type { MyProfile } from '@alumni/shared';
import { useId } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ME_PATH } from '@/config/mePath';
import { NEXT_STEP_TEXT, profileCompleteness } from './profileCompleteness';
import styles from './ProfileCompletenessCard.module.css';

export interface ProfileCompletenessCardProps {
  /** The signed-in user's own record (`['me']`, already loaded under RequireAuth). */
  profile: MyProfile;
}

/**
 * "Complete your profile": shown only while the profile is incomplete, and
 * never for an account with neither an alumni nor a student row (REQ-016 A2).
 * A native `<progress>` (role progressbar, value in percent) and one next
 * step, the first missing field, linking to Account settings. Pure client
 * logic over `['me']`, so it has no loading or error state of its own.
 */
export function ProfileCompletenessCard({ profile }: ProfileCompletenessCardProps) {
  const headingId = useId();
  const result = profileCompleteness(profile);
  if (result?.nextStep === undefined) return null;

  return (
    <Card as="section" aria-labelledby={headingId} className={styles.card}>
      <div className={styles.text}>
        <h2 id={headingId} className={styles.heading}>
          Complete your profile
        </h2>
        <p className={styles.summary}>
          Your profile is {result.percent}% complete. A full profile helps classmates find you.
        </p>
      </div>
      <progress
        className={styles.bar}
        max={100}
        value={result.percent}
        aria-label="Profile completeness"
      >
        {result.percent}%
      </progress>
      <ButtonLink to={ME_PATH} variant="secondary" className={styles.step}>
        {NEXT_STEP_TEXT[result.nextStep]}
      </ButtonLink>
    </Card>
  );
}
