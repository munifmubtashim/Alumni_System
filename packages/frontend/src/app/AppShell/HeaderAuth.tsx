import type { MyProfile } from '@alumni/shared';
import { ButtonLink } from '@/components/ui/Button';
import { Menu, MenuItem, MenuLabel } from '@/components/ui/Menu';
import { useCurrentUser, useHasSession, useLogout } from '@/features/auth';
import styles from './AppShell.module.css';

const ROLE_LABEL: Record<MyProfile['role'], string> = {
  student: 'Student',
  alumni: 'Alumni',
  admin: 'Admin',
};

/**
 * The header's auth area. Guests get Log in and Sign up links. A signed-in
 * user gets a menu named after them; while ['me'] is loading or has failed it
 * reads "Account" and still offers Log out (ADV-006).
 */
export function HeaderAuth() {
  const hasSession = useHasSession();

  if (!hasSession) {
    return (
      <nav aria-label="Account" className={styles.authLinks}>
        <ButtonLink to="/login" variant="ghost">
          Log in
        </ButtonLink>
        <ButtonLink to="/register" variant="primary">
          Sign up
        </ButtonLink>
      </nav>
    );
  }
  return <UserMenu />;
}

function UserMenu() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <Menu trigger={user?.name ?? 'Account'} align="end">
      {user && (
        <MenuLabel>
          <span className={styles.menuName}>{user.name}</span>
          <span className={styles.menuRole}>{ROLE_LABEL[user.role]}</span>
        </MenuLabel>
      )}
      <MenuItem onSelect={logout}>Log out</MenuItem>
    </Menu>
  );
}
