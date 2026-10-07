import { NavLink } from 'react-router';
import { cx } from '@/components/ui/cx';
import { useHasSession } from '@/features/auth';
import styles from './MainNav.module.css';
import { HEADER_NAV_ITEMS } from './navItems';

/**
 * The header's main nav (docs/design/screens/app/S1-Desktop-*), shown only to
 * a signed-in user because every section is behind sign-in. NavLink marks the
 * link `aria-current="page"` on its path and below (e.g. /directory?page=2).
 * Hidden by CSS below 48rem, where BottomTabs takes over.
 */
export function MainNav() {
  const hasSession = useHasSession();
  if (!hasSession) return null;

  return (
    <nav aria-label="Main" className={styles.nav}>
      {HEADER_NAV_ITEMS.map((item) => (
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
