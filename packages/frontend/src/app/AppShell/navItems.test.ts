import { describe, expect, it } from 'vitest';
import { HEADER_NAV_ITEMS, navItemPath, TAB_NAV_ITEMS, visibleNavItems } from './navItems';

function labels(items: readonly { label: string }[]): string[] {
  return items.map((item) => item.label);
}

function item(label: string) {
  const found = TAB_NAV_ITEMS.find((candidate) => candidate.label === label);
  if (!found) throw new Error(`No tab named ${label}`);
  return found;
}

describe('nav items (REQ-016)', () => {
  it('lists Home, Directory, Feed, Admin in the header and adds Profile before Admin in the tabs', () => {
    expect(labels(HEADER_NAV_ITEMS)).toEqual(['Home', 'Directory', 'Feed', 'Admin']);
    expect(labels(TAB_NAV_ITEMS)).toEqual(['Home', 'Directory', 'Feed', 'Profile', 'Admin']);
  });

  it('drops Admin for a non-admin only', () => {
    expect(labels(visibleNavItems(TAB_NAV_ITEMS, false))).toEqual([
      'Home',
      'Directory',
      'Feed',
      'Profile',
    ]);
    expect(labels(visibleNavItems(TAB_NAV_ITEMS, true))).toEqual(labels(TAB_NAV_ITEMS));
  });

  it('marks only Home as `end`', () => {
    expect(TAB_NAV_ITEMS.filter((navItem) => navItem.end === true).map((n) => n.to)).toEqual(['/']);
  });

  it("sends Profile to the user's own profile, or /me without an alumni id", () => {
    expect(navItemPath(item('Profile'), 42)).toBe('/alumni/42');
    expect(navItemPath(item('Profile'), null)).toBe('/me');
    expect(navItemPath(item('Profile'), undefined)).toBe('/me');
  });

  it('leaves every other item at its own path', () => {
    expect(navItemPath(item('Home'), 42)).toBe('/');
    expect(navItemPath(item('Directory'), 42)).toBe('/directory');
    expect(navItemPath(item('Admin'), 42)).toBe('/admin');
  });
});
