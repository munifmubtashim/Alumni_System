import { NavLink } from 'react-router';
import { cx } from '@/components/ui/cx';
import { useCurrentUser, useHasSession, useIsAdmin } from '@/features/auth';
import styles from './BottomTabs.module.css';
import { navItemPath, TAB_NAV_ITEMS, visibleNavItems } from './navItems';

/**
 * The phone's bottom tab bar (docs/design/screens/app/S1-Phone-*): MainNav's
 * pages plus Profile (the user's own `/alumni/<id>`, or /me without an alumni
 * profile), and Admin for admins, each with an icon above its label, the
 * current one in the accent colour. Home is current only on `/`. Signed-in
 * users only; hidden by CSS from 48rem up.
 */
export function BottomTabs() {
  const hasSession = useHasSession();
  const isAdmin = useIsAdmin();
  const alumniId = useCurrentUser().data?.alumni_id;
  if (!hasSession) return null;

  return (
    <nav aria-label="Main tabs" className={styles.tabs}>
      {visibleNavItems(TAB_NAV_ITEMS, isAdmin).map((item) => (
        <NavLink
          key={item.label}
          to={navItemPath(item, alumniId)}
          end={item.end === true}
          className={({ isActive }) => cx(styles.tab, isActive && styles.active)}
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
