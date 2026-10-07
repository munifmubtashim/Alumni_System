import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useBlocker, type Blocker, type BlockerFunction } from 'react-router';
import { getLiveToken } from '@/services/authToken';

/** Where SessionBridge and logout send a user whose session ended. */
const LOGIN_PATH = '/login';

/**
 * Warns before leaving a page with unsaved work while `active` is true (the
 * form is dirty, or a save is still in flight: ADV-008).
 *
 * - In-app links and Back: React Router's `useBlocker`. The caller shows a
 *   prompt while `blocker.state === 'blocked'` and calls `proceed()` or
 *   `reset()`.
 * - Reload and tab close: a `beforeunload` listener, registered only while
 *   active, so a clean page never asks.
 *
 * Never blocks when the session is gone or the target is /login (ADV-002): a
 * 401 logout clears the token and then navigates, so `shouldBlock` reads the
 * token synchronously at navigation time, and `active` from a ref so the one
 * stable blocker function always sees the latest value. A navigation that
 * stays on the same path (e.g. the phone tab bar's own "Account" tab, or the
 * avatar menu's "Account settings") is not blocked either: it does not leave
 * the form.
 */
export function useLeaveGuard(active: boolean): Blocker {
  const activeRef = useRef(active);
  useLayoutEffect(() => {
    activeRef.current = active;
  });

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      activeRef.current &&
      getLiveToken() !== null &&
      nextLocation.pathname !== LOGIN_PATH &&
      nextLocation.pathname !== currentLocation.pathname,
    [],
  );
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => {
      // preventDefault is what asks for the browser's own "Leave site?" prompt.
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
    };
  }, [active]);

  return blocker;
}
