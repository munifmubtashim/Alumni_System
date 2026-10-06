import { Link } from 'react-router';
import { DIRECTORY_PATH } from '@/config/directoryReturn';
import { useCurrentUser } from '@/features/auth';
import styles from './HomePage.module.css';

interface QuickLink {
  to: string;
  title: string;
  description: string;
}

/**
 * The cards under the greeting (docs/design/screens/app/S1-*). Only pages
 * that exist are listed; add the feed, profile and admin cards when those
 * pages are built.
 */
const QUICK_LINKS: readonly QuickLink[] = [
  {
    to: DIRECTORY_PATH,
    title: 'Browse the directory',
    description: 'Find classmates by year, department or field',
  },
];

/** "Amina Rao" -> "Amina". A blank name gives "" (the greeting then has no name). */
function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

/**
 * The signed-in home. Rendered under RequireAuth, which waits for ['me'], so
 * the profile is already in the cache here.
 */
export function HomePage() {
  const { data: user } = useCurrentUser();
  if (!user) return null;
  const firstName = firstNameOf(user.name);

  return (
    <section className={styles.home} aria-labelledby="home-title">
      <div className={styles.intro}>
        <h1 id="home-title" className={styles.title}>
          {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        </h1>
        <p className={styles.subtitle}>Here&apos;s what&apos;s happening in your alumni network.</p>
      </div>
      <ul className={styles.cards}>
        {QUICK_LINKS.map((link) => (
          <li key={link.to} className={styles.item}>
            <Link to={link.to} className={styles.card}>
              <span className={styles.cardTitle}>{link.title}</span>
              <span className={styles.cardText}>{link.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
