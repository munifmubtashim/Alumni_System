import { useAtom } from 'jotai';
import { Outlet } from 'react-router';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { themePreferenceAtom } from '@/store/themeAtom';
import styles from './AuthShell.module.css';

/**
 * Layout route for /login and /register: no app header, only the compact
 * (icon-only) theme toggle
 * in the top-right corner over a full-height page (docs/design/screens/login).
 * No skip link: there is no header to skip.
 */
export function AuthShell() {
  const [preference, setPreference] = useAtom(themePreferenceAtom);

  return (
    <div className={styles.shell}>
      <div className={styles.toggle}>
        <ThemeToggle value={preference} onValueChange={setPreference} variant="compact" />
      </div>
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
