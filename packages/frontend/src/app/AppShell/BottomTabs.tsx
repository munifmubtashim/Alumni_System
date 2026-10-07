import { NavLink } from 'react-router';
import { cx } from '@/components/ui/cx';
import { useHasSession } from '@/features/auth';
import styles from './BottomTabs.module.css';
import { TAB_NAV_ITEMS } from './navItems';

/**
 * The phone's bottom tab bar (docs/design/screens/app/S1-Phone-*): MainNav's
 * pages plus Account (/me), each with an icon above its label, the current one
 * in the accent colour. Signed-in users only; hidden by CSS from 48rem up.
 */
export function BottomTabs() {
  const hasSession = useHasSession();
  if (!hasSession) return null;

  return (
    <nav aria-label="Main tabs" className={styles.tabs}>
      {TAB_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cx(styles.tab, isActive && styles.active)}
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
