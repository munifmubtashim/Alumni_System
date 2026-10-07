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
 * The app's sections, shared by the header nav (desktop) and the bottom tab
 * bar (phone), in S1's order. Only pages that exist are listed: add Admin
 * here when its page is built (S1 shows all four).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: DIRECTORY_PATH, label: 'Directory', icon: <GridIcon /> },
  { to: FEED_PATH, label: 'Feed', icon: <ChatBubbleIcon /> },
  { to: ME_PATH, label: 'My Profile', icon: <PersonIcon /> },
];
