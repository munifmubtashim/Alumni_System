import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getAdminStats } from '@/services/adminApi';
import { searchAlumni } from '@/services/alumniApi';
import type { AdminParams } from './params';

/** Rows per admin table page (S6), also the number of skeleton rows. */
export const ADMIN_PAGE_SIZE = 10;

/**
 * Query keys. Everything the admin page caches sits under `['admin']`, so a
 * write invalidates stats and every table page with one call. The directory's
 * cache is `['alumni', …]` and is invalidated separately by the writes.
 */
export const adminKeys = {
  all: ['admin'] as const,
  stats: ['admin', 'stats'] as const,
  alumni: (params: AdminParams) => ['admin', 'alumni', params] as const,
};

/** The four stat-card counts from `GET /api/admin/stats`. */
export function useAdminStats() {
  return useQuery({ queryKey: adminKeys.stats, queryFn: getAdminStats });
}

/**
 * One admin table page from `GET /api/alumni`, sorted by the server. Unlike the
 * directory, the previous page stays on screen while the next loads
 * (`keepPreviousData`): the header and Prev/Next buttons stay mounted, so a
 * sort or page click keeps focus where it was.
 */
export function useAdminAlumni(params: AdminParams) {
  return useQuery({
    queryKey: adminKeys.alumni(params),
    queryFn: () => searchAlumni({ ...params, pageSize: ADMIN_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
}
