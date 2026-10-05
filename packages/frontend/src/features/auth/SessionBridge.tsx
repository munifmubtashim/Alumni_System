import { useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { clearToken, getToken, isTokenExpired, subscribe } from '@/services/authToken';
import { setUnauthorizedHandler } from '@/services/httpClient';
import { sessionNoticeAtom } from '@/store/sessionNoticeAtom';

/**
 * Connects the token store and the HTTP client to the app (ADR-03). Renders
 * nothing; mount it once, inside the router.
 *
 * 1. On mount, silently drops a stored token that has already expired.
 * 2. Handles a 401 from an authed request, but only if the request carried the
 *    current token: a late 401 from an older token, or one after logout, is
 *    ignored, and the rest of a burst no longer matches once the first clears
 *    the token (ADV-001).
 * 3. Clears the whole query cache whenever the token value changes, in this tab
 *    or another, so no previous user's data survives (ADV-005).
 */
export function SessionBridge(): null {
  const queryClient = useQueryClient();
  const setNotice = useSetAtom(sessionNoticeAtom);
  const navigate = useNavigate();
  const location = useLocation();

  // The 401 handler is registered once, so it reads the latest location from
  // a ref instead of a stale closure (ADV-008).
  const locationRef = useRef(location);
  useLayoutEffect(() => {
    locationRef.current = location;
  });

  useEffect(() => {
    const token = getToken();
    if (token !== null && isTokenExpired(token)) clearToken();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((requestToken) => {
      if (requestToken !== getToken()) return;
      clearToken();
      setNotice('expired');
      void navigate('/login', {
        replace: true,
        state: { from: locationRef.current },
        flushSync: true,
      });
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [navigate, setNotice]);

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
