import { useQuery } from '@tanstack/react-query';
import { ALUMNI_QUERY_ROOT } from '@/config/queryKeys';
import { getSuggestedAlumni } from '@/services/alumniApi';

/** The suggestions query key. Under the `alumni` root, so admin writes that invalidate it refresh it too. */
export const SUGGESTED_ALUMNI_KEY = [ALUMNI_QUERY_ROOT, 'suggestions'] as const;

/** Suggestions change slowly (they depend on other people's profiles), so they stay fresh longer than the 30 s default. */
const SUGGESTIONS_STALE_MS = 5 * 60_000;

/**
 * Up to 5 suggested alumni from `GET /api/alumni/suggestions`, shared by Home
 * and the Feed sidebar (one cache entry, one request for both). The client's
 * retry policy applies (no retry on 4xx); a 401 reaches the session handler
 * like any other request (ADR-03). Errors stay in the query result, never
 * thrown into the render tree.
 */
export function useSuggestedAlumni() {
  return useQuery({
    queryKey: SUGGESTED_ALUMNI_KEY,
    queryFn: getSuggestedAlumni,
    staleTime: SUGGESTIONS_STALE_MS,
  });
}
