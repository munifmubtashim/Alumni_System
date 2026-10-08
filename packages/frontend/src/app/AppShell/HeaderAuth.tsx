import { useNavigate } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@/components/ui/Menu';
import { ADMIN_PATH } from '@/config/adminPath';
import { profilePath } from '@/config/directoryReturn';
import { ME_PATH } from '@/config/mePath';
import { useCurrentUser, useHasSession, useIsAdmin, useLogout } from '@/features/auth';
import styles from './AppShell.module.css';

/**
 * The header's auth area. Guests get Log in and Sign up links. A signed-in
 * user gets an avatar menu (initials, chevron): their name and email, View
 * profile (their public /alumni/:id page, only with an alumni row, so never
 * for a student), Account settings (/me), Admin settings (/admin, admins only),
 * then Log out. While ['me'] is loading or has failed the button reads
 * "Account menu" and still offers Account settings and Log out (ADV-006). On desktop this menu is the only
 * way to /me (the header nav leaves it out, REQ-012; the phone has no Account tab since REQ-016).
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
  const isAdmin = useIsAdmin();
  const logout = useLogout();
  const navigate = useNavigate();
  const alumniId = user?.alumni_id ?? null;
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
          {alumniId !== null && (
            <MenuItem onSelect={() => void navigate(profilePath(alumniId))}>View profile</MenuItem>
          )}
        </>
      )}
      <MenuItem onSelect={() => void navigate(ME_PATH)}>Account settings</MenuItem>
      {isAdmin && <MenuItem onSelect={() => void navigate(ADMIN_PATH)}>Admin settings</MenuItem>}
      <MenuSeparator />
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
