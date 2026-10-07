import type { ReactNode } from 'react';
import { DIRECTORY_PATH } from '@/config/directoryReturn';
import { FEED_PATH } from '@/config/feedPath';
import { ME_PATH } from '@/config/mePath';
import { ChatBubbleIcon, GridIcon, PersonIcon } from './NavIcons';

export interface NavItem {
  to: string;
  label: string;
  /** Tab-bar icon (decorative; the label names the link). */
  icon: ReactNode;
}

/**
 * The header nav (desktop), in S1's order. Only pages that exist are listed:
 * add Admin here when its page is built (S1 shows all four). Account settings
 * (/me) is deliberately left out: on desktop it is reached from the avatar
 * menu and the Home card (REQ-012, a deviation from S1, which draws it here).
 */
export const HEADER_NAV_ITEMS: readonly NavItem[] = [
  { to: DIRECTORY_PATH, label: 'Directory', icon: <GridIcon /> },
  { to: FEED_PATH, label: 'Feed', icon: <ChatBubbleIcon /> },
];

/**
 * The bottom tab bar (phone): the header's pages plus Account (/me), since a
 * phone has no other one-tap way there. "Account settings" is too long for a
 * tab, so the tab reads "Account" (S1's phone bar draws "Profile").
 */
export const TAB_NAV_ITEMS: readonly NavItem[] = [
  ...HEADER_NAV_ITEMS,
  { to: ME_PATH, label: 'Account', icon: <PersonIcon /> },
];
