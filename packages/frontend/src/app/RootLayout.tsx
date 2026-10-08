import { Outlet } from 'react-router';
import { SessionBridge } from '@/features/auth';
import { useApplyTheme } from '@/features/theme';

/**
 * Path-less root of every page, above both shells. Applies the theme and
 * mounts SessionBridge exactly once, so the auth pages (which have no app
 * header) still get the expired-token drop, the cache clear and the 401 notice.
 */
export function RootLayout() {
  useApplyTheme();
  return (
    <>
      <SessionBridge />
      <Outlet />
    </>
  );
}
