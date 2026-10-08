import { useQuery } from '@tanstack/react-query';
import { ALUMNI_QUERY_ROOT } from '@/config/queryKeys';
import { searchAlumni } from '@/services/alumniApi';
import { DIRECTORY_PAGE_SIZE } from './constants';
import type { DirectoryParams } from './params';

/**
 * One directory page from `GET /api/alumni`, keyed by the parsed URL state.
 * No `placeholderData`/`keepPreviousData`: a new search or page shows
 * skeletons, never the previous results as if they were current (AC11).
 * The client's defaults apply (30 s stale, no retry on 4xx); a 401 reaches
 * the session handler like any other request (ADR-03).
 */
export function useAlumniSearch(params: DirectoryParams) {
  return useQuery({
    queryKey: [ALUMNI_QUERY_ROOT, 'search', params],
    queryFn: () => searchAlumni({ ...params, pageSize: DIRECTORY_PAGE_SIZE }),
  });
}
