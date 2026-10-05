import { isAxiosError } from 'axios';
import { Navigate, Outlet, useLocation } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { resolveFrom } from './redirect';
import { useCurrentUser } from './useCurrentUser';
import { useLiveToken } from './useHasSession';
import { useLogout } from './useLogout';

function isUnauthorized(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401;
}

function LoadingLine() {
  return <p role="status">Loading…</p>;
}

/**
 * Layout route for signed-in pages. A guest goes to /login, remembering this
 * location as `state.from`. With a live token it waits for ['me'], then
 * renders the child route. If ['me'] fails (not a 401) it offers Retry and
 * Log out, so the user is never stuck (ADV-006).
 */
export function RequireAuth() {
  const location = useLocation();
  const liveToken = useLiveToken();
  const currentUser = useCurrentUser();
  const logout = useLogout();

  if (liveToken === null) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // A 401 is SessionBridge's job: it clears the token, and this guard then
  // redirects. Until that render, keep showing the quiet loading line.
  if (currentUser.isPending || (currentUser.isError && isUnauthorized(currentUser.error))) {
    return <LoadingLine />;
  }

  if (currentUser.isError) {
    return (
      <Alert tone="error" title="Couldn't load your account">
        <p>Check your connection and try again, or log out.</p>
        <div>
          <Button
            variant="primary"
            loading={currentUser.isFetching}
            onClick={() => void currentUser.refetch()}
          >
            Retry
          </Button>{' '}
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </Alert>
    );
  }

  return <Outlet />;
}

/**
 * Layout route for /login and /register. A signed-in user is sent to the page
 * they first asked for, if it is safe, else home. This is the only place that
 * navigates after a successful login or sign-up (ADV-003).
 */
export function GuestOnly() {
  const location = useLocation();
  const liveToken = useLiveToken();

  if (liveToken !== null) {
    return <Navigate to={resolveFrom(location.state) ?? '/'} replace />;
  }
  return <Outlet />;
}
