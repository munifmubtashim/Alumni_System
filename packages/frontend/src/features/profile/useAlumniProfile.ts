import { skipToken, useQuery } from '@tanstack/react-query';
import { ALUMNI_QUERY_ROOT } from '@/config/queryKeys';
import { getAlumniProfile } from '@/services/alumniApi';

/**
 * One alumni profile from `GET /api/alumni/:id`, keyed by the id from the URL.
 * No `placeholderData`: a new id shows the loading state, never the previous
 * person (AC11). Idle (`skipToken`) without an id. The client's defaults apply
 * (no retry on 4xx, so a 404 ends at once); a 401 reaches the session handler
 * like any other request (ADR-03).
 */
export function useAlumniProfile(id: string | undefined) {
  return useQuery({
    queryKey: [ALUMNI_QUERY_ROOT, 'profile', id],
    queryFn: id === undefined || id === '' ? skipToken : () => getAlumniProfile(id),
  });
}
