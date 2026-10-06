import { useAtom } from 'jotai';
import { Link, Outlet } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BRAND_NAME } from '@/config/brand';
import { themePreferenceAtom } from '@/store/themeAtom';
import styles from './AppShell.module.css';
import { HeaderAuth } from './HeaderAuth';

/**
 * Layout route: skip link, header (brand, auth area, theme toggle) and the page
 * outlet. The header follows docs/design/screens/app/S1-*, minus its nav links
 * until their pages exist. Theme and SessionBridge live in RootLayout, above it.
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
          <Link to="/" className={styles.brand}>
            <Logo label={BRAND_NAME} showWordmark />
          </Link>
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
