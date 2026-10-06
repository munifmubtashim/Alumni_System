import { NavLink } from 'react-router';
import { cx } from '@/components/ui/cx';
import { useHasSession } from '@/features/auth';
import styles from './MainNav.module.css';

/** The app's sections. Only Directory exists so far (REQ-006). */
const NAV_ITEMS = [{ to: '/directory', label: 'Directory' }] as const;

/**
 * The header's main nav (docs/design/screens/app/S1-*), shown only to a
 * signed-in user because every section is behind sign-in. NavLink marks the
 * link `aria-current="page"` on its path and below (e.g. /directory?page=2).
 * On phones it stays in the header and wraps under the brand, instead of
 * S1-Phone's bottom tab bar (REQ-006 architecture).
 */
export function MainNav() {
  const hasSession = useHasSession();
  if (!hasSession) return null;

  return (
    <nav aria-label="Main" className={styles.nav}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cx(styles.link, isActive && styles.active)}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
