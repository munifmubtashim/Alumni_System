import type { MyProfile } from '@alumni/shared';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services/authApi';
import { useLiveToken } from './useHasSession';

export const CURRENT_USER_QUERY_KEY = ['me'] as const;

/**
 * The signed-in user's profile (GET /api/me), only fetched while a live token
 * exists. There is no atom copy (ADR-02); SessionBridge clears the cache
 * whenever the token changes, so a previous user's profile is never shown.
 */
export function useCurrentUser() {
  const liveToken = useLiveToken();
  return useQuery<MyProfile>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getMe,
    enabled: liveToken !== null,
  });
}
