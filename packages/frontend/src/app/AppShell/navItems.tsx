import type { ReactNode } from 'react';
import { ADMIN_PATH } from '@/config/adminPath';
import { DIRECTORY_PATH } from '@/config/directoryReturn';
import { FEED_PATH } from '@/config/feedPath';
import { ME_PATH } from '@/config/mePath';
import { ChatBubbleIcon, GridIcon, PersonIcon, ShieldIcon } from './NavIcons';

export interface NavItem {
  to: string;
  label: string;
  /** Tab-bar icon (decorative; the label names the link). */
  icon: ReactNode;
  /** Shown to admins only. A nav filter, not access control: RequireAdmin and the API decide. */
  adminOnly?: true;
}

/** The admin page (REQ-015), last in both lists as S6 draws it. */
const ADMIN_NAV_ITEM: NavItem = {
  to: ADMIN_PATH,
  label: 'Admin',
  icon: <ShieldIcon />,
  adminOnly: true,
};

/**
 * The header nav (desktop), in S1's order. Only pages that exist are listed;
 * Admin shows to admins only. Account settings (/me) is deliberately left out:
 * on desktop it is reached from the avatar menu and the Home card (REQ-012, a
 * deviation from S1, which draws it here).
 */
export const HEADER_NAV_ITEMS: readonly NavItem[] = [
  { to: DIRECTORY_PATH, label: 'Directory', icon: <GridIcon /> },
  { to: FEED_PATH, label: 'Feed', icon: <ChatBubbleIcon /> },
  ADMIN_NAV_ITEM,
];

/**
 * The bottom tab bar (phone): the header's pages plus Account (/me), since a
 * phone has no other one-tap way there, with Admin (admins only) last, as S6
 * draws it. "Account settings" is too long for a tab, so the tab reads
 * "Account" (S1's phone bar draws "Profile").
 */
export const TAB_NAV_ITEMS: readonly NavItem[] = [
  ...HEADER_NAV_ITEMS.filter((item) => item !== ADMIN_NAV_ITEM),
  { to: ME_PATH, label: 'Account', icon: <PersonIcon /> },
  ADMIN_NAV_ITEM,
];

/** The items a user may see: `adminOnly` ones only for an admin. */
export function visibleNavItems(items: readonly NavItem[], isAdmin: boolean): readonly NavItem[] {
  return isAdmin ? items : items.filter((item) => item.adminOnly !== true);
}
