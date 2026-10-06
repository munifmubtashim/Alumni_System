import type { ReactNode } from 'react';
import { GridIcon } from './NavIcons';

export interface NavItem {
  to: string;
  label: string;
  /** Tab-bar icon (decorative; the label names the link). */
  icon: ReactNode;
}

/**
 * The app's sections, shared by the header nav (desktop) and the bottom tab
 * bar (phone). Only pages that exist are listed: add Feed, Profile and Admin
 * here when their pages are built (S1 shows all four).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/directory', label: 'Directory', icon: <GridIcon /> },
];
