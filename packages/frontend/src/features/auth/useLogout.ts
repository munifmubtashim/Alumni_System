import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { clearToken } from '@/services/authToken';

/**
 * Returns a function that logs out: clears the token first (so a 401 still in
 * flight no longer matches and shows no "expired" notice), then goes to
 * /login. SessionBridge clears the query cache when it sees the token change.
 */
export function useLogout(): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    clearToken();
    void navigate('/login', { replace: true, flushSync: true });
  }, [navigate]);
}
