import { isAxiosError } from 'axios';
import { Navigate, Outlet, useLocation } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { resolveFrom } from './redirect';
import { useCurrentUser } from './useCurrentUser';
import { useLiveToken } from './useHasSession';
import { useLogout } from './useLogout';
import styles from './guards.module.css';

function isUnauthorized(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401;
}

function LoadingLine() {
  return <p role="status">Loading…</p>;
}

/** The failed-['me'] box both guards show: Retry, or Log out so the user is never stuck. */
function AccountError({ currentUser }: { currentUser: ReturnType<typeof useCurrentUser> }) {
  const logout = useLogout();
  return (
    <Alert tone="error" title="Couldn't load your account">
      <p>Check your connection and try again, or log out.</p>
      <div className={styles.actions}>
        <Button
          variant="primary"
          loading={currentUser.isFetching}
          onClick={() => void currentUser.refetch()}
        >
          Retry
        </Button>
        <Button variant="ghost" onClick={logout}>
          Log out
        </Button>
      </div>
    </Alert>
  );
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

  if (liveToken === null) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // A 401 is SessionBridge's job: it clears the token, and this guard then
  // redirects. Until that render, keep showing the quiet loading line.
  if (currentUser.isPending || (currentUser.isError && isUnauthorized(currentUser.error))) {
    return <LoadingLine />;
  }

  if (currentUser.isError) {
    return <AccountError currentUser={currentUser} />;
  }

  return <Outlet />;
}

/**
 * Shown in place of an admin-only page to a signed-in user who is not an
 * admin. A 403 is not a 401: the session stays (ADR-03).
 */
export function ForbiddenPage() {
  return (
    <Card as="section" aria-labelledby="forbidden-title" className={styles.forbidden}>
      <h1 id="forbidden-title" className={styles.title}>
        You don't have access to this page
      </h1>
      <p className={styles.text}>This page is for administrators only.</p>
      <ButtonLink to="/" variant="primary" className={styles.home}>
        Go to the home page
      </ButtonLink>
    </Card>
  );
}

/**
 * Layout route for admin-only pages, nested inside RequireAuth. An admin gets
 * the child route; anyone else gets ForbiddenPage, so the child's code never
 * loads and no admin request is sent. The server stays the judge. Cached
 * ['me'] data wins over a failed background refetch, so the error box shows
 * only when there is no data at all (L-REQ-010-2).
 */
export function RequireAdmin() {
  const currentUser = useCurrentUser();
  const user = currentUser.data;

  if (user === undefined) {
    if (currentUser.isError && !isUnauthorized(currentUser.error)) {
      return <AccountError currentUser={currentUser} />;
    }
    return <LoadingLine />;
  }

  return user.role === 'admin' ? <Outlet /> : <ForbiddenPage />;
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
