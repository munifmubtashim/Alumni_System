import { useAtom } from 'jotai';
import { Link, Outlet } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BRAND_NAME } from '@/config/brand';
import { themePreferenceAtom } from '@/store/themeAtom';
import styles from './AppShell.module.css';
import { HeaderAuth } from './HeaderAuth';
import { MainNav } from './MainNav';

/**
 * Layout route: skip link, header (brand, main nav, auth area, theme toggle)
 * and the page outlet. The header follows docs/design/screens/app/S1-*; its
 * main nav holds only the pages that exist (Directory) and shows to signed-in
 * users only. Theme and SessionBridge live in RootLayout, above it.
 */
export function AppShell() {
  const [preference, setPreference] = useAtom(themePreferenceAtom);

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerStart}>
            <Link to="/" className={styles.brand}>
              <Logo label={BRAND_NAME} showWordmark />
            </Link>
            <MainNav />
          </div>
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
