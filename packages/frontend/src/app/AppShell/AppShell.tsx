import { useAtom } from 'jotai';
import { Outlet } from 'react-router';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SessionBridge } from '@/features/auth';
import { useApplyTheme } from '@/features/theme';
import { themePreferenceAtom } from '@/store/themeAtom';
import { BRAND_NAME } from '../brand';
import styles from './AppShell.module.css';
import { HeaderAuth } from './HeaderAuth';

/**
 * Layout route: skip link, header (brand, auth area, theme toggle) and the page
 * outlet. Also mounts SessionBridge once, inside the router.
 */
export function AppShell() {
  useApplyTheme();
  const [preference, setPreference] = useAtom(themePreferenceAtom);

  return (
    <div className={styles.shell}>
      <SessionBridge />
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.brand}>{BRAND_NAME}</span>
          <div className={styles.headerActions}>
            <HeaderAuth />
            <ThemeToggle value={preference} onValueChange={setPreference} />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
