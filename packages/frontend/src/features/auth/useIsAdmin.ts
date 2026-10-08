import { useCurrentUser } from './useCurrentUser';

/**
 * True only once ['me'] has loaded with the admin role. The nav, tab bar and
 * avatar menu read it to show admin-only links; RequireAdmin and the API
 * decide access.
 */
export function useIsAdmin(): boolean {
  return useCurrentUser().data?.role === 'admin';
}
