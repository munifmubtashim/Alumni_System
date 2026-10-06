import { useAtom } from 'jotai';
import { Link, Outlet } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BRAND_NAME } from '@/config/brand';
import { themePreferenceAtom } from '@/store/themeAtom';
import styles from './AppShell.module.css';
import { BottomTabs } from './BottomTabs';
import { HeaderAuth } from './HeaderAuth';
import { MainNav } from './MainNav';

/**
 * Layout route: skip link, header, the page outlet and, on phones, the bottom
 * tab bar. Follows docs/design/screens/app/S1-*: the header holds the brand,
 * the main nav (desktop), the compact theme toggle (the same one as the login
 * page) and the account area. The nav lists only pages that exist and shows to
 * signed-in users only. Theme and SessionBridge live in RootLayout, above it.
 */
export function AppShell() {
  const [preference, setPreference] = useAtom(themePreferenceAtom);

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.headerStart}>
          <Link to="/" className={styles.brand}>
            <Logo label={BRAND_NAME} showWordmark />
          </Link>
          <MainNav />
        </div>
        <div className={styles.headerActions}>
          <ThemeToggle value={preference} onValueChange={setPreference} variant="compact" />
          <HeaderAuth />
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  );
}
