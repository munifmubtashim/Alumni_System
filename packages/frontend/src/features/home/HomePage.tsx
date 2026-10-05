import type { MyProfile } from '@alumni/shared';
import { useCurrentUser } from '@/features/auth';
import styles from './HomePage.module.css';

const ROLE_PHRASE: Record<MyProfile['role'], string> = {
  student: 'a student',
  alumni: 'an alumnus',
  admin: 'an admin',
};

/**
 * The signed-in home. Rendered under RequireAuth, which waits for ['me'], so
 * the profile is already in the cache here.
 */
export function HomePage() {
  const { data: user } = useCurrentUser();
  if (!user) return null;

  return (
    <section className={styles.home} aria-labelledby="home-title">
      <h1 id="home-title" className={styles.title}>
        Welcome, {user.name}
      </h1>
      <p className={styles.role}>You&apos;re signed in as {ROLE_PHRASE[user.role]}.</p>
      <p className={styles.soon}>More is coming soon: the feed, directory and profiles.</p>
    </section>
  );
}
