import { ButtonLink } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@/components/ui/Menu';
import { useCurrentUser, useHasSession, useLogout } from '@/features/auth';
import styles from './AppShell.module.css';

/**
 * The header's auth area. Guests get Log in and Sign up links. A signed-in
 * user gets an avatar menu (initials, chevron) that shows their name and email
 * above Log out; while ['me'] is loading or has failed the button reads
 * "Account menu" and still offers Log out (ADV-006). View profile and Admin
 * settings join it when those pages exist.
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
  const trimmed = user?.name.trim() ?? '';
  const avatarName = trimmed.length > 0 ? trimmed : '?';

  return (
    <Menu
      label={user?.name ? `Account menu for ${user.name}` : 'Account menu'}
      trigger={
        <>
          {/* "?" until the profile loads, so the button is never an empty circle. */}
          <Avatar name={avatarName} size="xs" className={styles.avatar} />
          <ChevronIcon />
        </>
      }
      align="end"
      className={styles.accountButton}
    >
      {user && (
        <>
          <MenuLabel>
            <span className={styles.menuName}>{user.name}</span>
            <span className={styles.menuEmail}>{user.email}</span>
          </MenuLabel>
          <MenuSeparator />
        </>
      )}
      <MenuItem onSelect={logout}>Log out</MenuItem>
    </Menu>
  );
}

function ChevronIcon() {
  return (
    <svg
      className={styles.chevron}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
