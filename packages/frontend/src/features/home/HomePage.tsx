import { useCurrentUser } from '@/features/auth';
import { SuggestedAlumni } from '@/features/people';
import { LatestPosts } from './LatestPosts';
import { MentorsAvailable } from './MentorsAvailable';
import { ProfileCompletenessCard } from './ProfileCompletenessCard';
import styles from './HomePage.module.css';

/** "Amina Rao" -> "Amina". A blank name gives "" (the greeting then has no name). */
function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

/**
 * The signed-in home (REQ-016): the greeting, the profile-completeness card
 * while the profile is incomplete, then "Latest from the feed" beside
 * "Mentors available" and "Suggested alumni" (one column on phones). Each
 * section has its own query and states, so one failing never hides the
 * others. No stats or counts. Rendered under RequireAuth, which waits for
 * ['me'], so the profile is already in the cache here.
 */
export function HomePage() {
  const { data: user } = useCurrentUser();
  if (!user) return null;
  const firstName = firstNameOf(user.name);

  return (
    <div className={styles.home}>
      <div className={styles.intro}>
        <h1 className={styles.title}>
          {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        </h1>
        <p className={styles.subtitle}>Here&apos;s what&apos;s happening in your alumni network.</p>
      </div>
      <ProfileCompletenessCard profile={user} />
      <div className={styles.columns}>
        <LatestPosts />
        <div className={styles.side}>
          <MentorsAvailable ownAlumniId={user.alumni_id} />
          <SuggestedAlumni />
        </div>
      </div>
    </div>
  );
}
