import type { ReactNode } from 'react';
import { ADMIN_PATH } from '@/config/adminPath';
import { DIRECTORY_PATH, profilePath } from '@/config/directoryReturn';
import { FEED_PATH } from '@/config/feedPath';
import { HOME_PATH } from '@/config/homePath';
import { ME_PATH } from '@/config/mePath';
import { ChatBubbleIcon, GridIcon, HomeIcon, PersonIcon, ShieldIcon } from './NavIcons';

export interface NavItem {
  /** Where the link goes; for an `own` item, only the fallback (see `navItemPath`). */
  to: string;
  label: string;
  /** Tab-bar icon (decorative; the label names the link). */
  icon: ReactNode;
  /** Shown to admins only. A nav filter, not access control: RequireAdmin and the API decide. */
  adminOnly?: true;
  /** Current only on exactly `to` (NavLink `end`): Home at `/` must not be current everywhere. */
  end?: true;
  /** The signed-in user's own public profile, resolved per user by `navItemPath`. */
  own?: true;
}

/** Home (REQ-016), first in both lists. */
const HOME_NAV_ITEM: NavItem = { to: HOME_PATH, label: 'Home', icon: <HomeIcon />, end: true };

/** The admin page (REQ-015), last in both lists as S6 draws it. */
const ADMIN_NAV_ITEM: NavItem = {
  to: ADMIN_PATH,
  label: 'Admin',
  icon: <ShieldIcon />,
  adminOnly: true,
};

/**
 * The header nav (desktop): Home, Directory, Feed, then Admin for admins only.
 * Account settings (/me) is deliberately left out: on desktop it is reached
 * from the avatar menu (REQ-012, a deviation from S1, which draws it here).
 */
export const HEADER_NAV_ITEMS: readonly NavItem[] = [
  HOME_NAV_ITEM,
  { to: DIRECTORY_PATH, label: 'Directory', icon: <GridIcon /> },
  { to: FEED_PATH, label: 'Feed', icon: <ChatBubbleIcon /> },
  ADMIN_NAV_ITEM,
];

/**
 * The bottom tab bar (phone): the header's pages plus Profile, the user's own
 * public profile as S1's phone bar draws it (REQ-016; it replaced the
 * "Account" tab), with Admin (admins only) last, as S6 draws it. A user with
 * no alumni profile has no public page, so their Profile tab opens Account
 * settings (/me) instead (REQ-016 A1).
 */
export const TAB_NAV_ITEMS: readonly NavItem[] = [
  ...HEADER_NAV_ITEMS.filter((item) => item !== ADMIN_NAV_ITEM),
  { to: ME_PATH, label: 'Profile', icon: <PersonIcon />, own: true },
  ADMIN_NAV_ITEM,
];

/** The items a user may see: `adminOnly` ones only for an admin. */
export function visibleNavItems(items: readonly NavItem[], isAdmin: boolean): readonly NavItem[] {
  return isAdmin ? items : items.filter((item) => item.adminOnly !== true);
}

/**
 * Where an item links for this user: an `own` item goes to `/alumni/<alumniId>`
 * when the user has an alumni profile, else (no profile, or `['me']` not loaded
 * yet) to its `to`; every other item to its `to`.
 */
export function navItemPath(item: NavItem, alumniId: number | null | undefined): string {
  if (item.own === true && alumniId !== null && alumniId !== undefined) {
    return profilePath(alumniId);
  }
  return item.to;
}
