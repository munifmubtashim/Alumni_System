import { useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  clearToken,
  getToken,
  getTokenExpiresAt,
  isTokenExpired,
  subscribe,
} from '@/services/authToken';
import { setUnauthorizedHandler } from '@/services/httpClient';
import { sessionNoticeAtom } from '@/store/sessionNoticeAtom';

// The largest delay setTimeout accepts (2^31 - 1 ms).
const MAX_TIMER_DELAY_MS = 2_147_483_647;

/**
 * Connects the token store and the HTTP client to the app (ADR-03). Renders
 * nothing; mount it once, inside the router.
 *
 * 1. On mount, silently drops a stored token that has already expired.
 * 2. Handles a 401 from an authed request, but only if the request carried the
 *    current token: a late 401 from an older token, or one after logout, is
 *    ignored, and the rest of a burst no longer matches once the first clears
 *    the token (ADV-001).
 * 3. Ends the session the same way when the live token reaches its expiry
 *    while the app is open: a timer per token, reset when the token changes
 *    (CORR-002). A token that is already expired when it appears gets no
 *    timer: it counts as signed out with no notice, as on load (step 1).
 * 4. Clears the whole query cache whenever the token value changes, in this tab
 *    or another, so no previous user's data survives (ADV-005).
 */
export function SessionBridge(): null {
  const queryClient = useQueryClient();
  const setNotice = useSetAtom(sessionNoticeAtom);
  const navigate = useNavigate();
  const location = useLocation();

  // The 401 handler and expiry timer are set up once, so they read the latest
  // location from a ref instead of a stale closure (ADV-008).
  const locationRef = useRef(location);
  useLayoutEffect(() => {
    locationRef.current = location;
  });

  // Log out with the "session expired" notice, back to this page after login.
  const expireSession = useCallback(() => {
    clearToken();
    setNotice('expired');
    void navigate('/login', {
      replace: true,
      state: { from: locationRef.current },
      flushSync: true,
    });
  }, [navigate, setNotice]);

  useEffect(() => {
    const token = getToken();
    if (token !== null && isTokenExpired(token)) clearToken();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((requestToken) => {
      if (requestToken !== getToken()) return;
      expireSession();
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [expireSession]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let watched: string | null = null;

    const arm = (token: string, expiresAt: number) => {
      // setTimeout overflows past ~24.8 days; a longer wait re-arms on firing.
      const delay = Math.min(Math.max(expiresAt - Date.now(), 0), MAX_TIMER_DELAY_MS);
      timer = setTimeout(() => {
        timer = undefined;
        if (getToken() !== token) return;
        if (isTokenExpired(token)) expireSession();
        else arm(token, expiresAt);
      }, delay);
    };

    const watch = () => {
      const token = getToken();
      if (token === watched) return;
      watched = token;
      clearTimeout(timer);
      timer = undefined;
      if (token === null || isTokenExpired(token)) return;
      const expiresAt = getTokenExpiresAt(token);
      if (expiresAt !== null) arm(token, expiresAt);
    };

    watch();
    const unsubscribe = subscribe(watch);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [expireSession]);

  useEffect(() => {
    let lastSeen = getToken();
    return subscribe(() => {
      const current = getToken();
      if (current === lastSeen) return;
      lastSeen = current;
      queryClient.clear();
    });
  }, [queryClient]);

  return null;
}
