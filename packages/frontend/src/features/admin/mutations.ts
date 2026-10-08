import type { AdminAlumniCreateInput, AdminAlumniUpdateInput } from '@alumni/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ALUMNI_QUERY_ROOT, FEED_QUERY_ROOT, POSTS_QUERY_ROOT } from '@/config/queryKeys';
import { createAlumniAccount, deleteAlumniAccount, updateAlumniAccount } from '@/services/adminApi';
import { adminKeys } from './queries';

// Other features' query roots whose rows show what an admin write changes.
// Shared constants from config/, not imports: lazy features never import each
// other (ADR-08, L-REQ-010-1), and the owning features build their keys from
// the same roots. ['alumni', ...] is the directory and /alumni/:id; a name
// change also shows on ['posts', ...] (recent posts on /alumni/:id) and
// ['feed', ...] (author names in the feed).
const DIRECTORY_KEY = [ALUMNI_QUERY_ROOT] as const;
const STALE_AFTER_EDIT = [DIRECTORY_KEY, [POSTS_QUERY_ROOT], [FEED_QUERY_ROOT]] as const;
// A delete removes the person's posts and comments and recounts other posts'
// comment counts, so the same three roots go stale.
const STALE_AFTER_DELETE = STALE_AFTER_EDIT;

function isNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

/**
 * Refetches the admin page (stats and every table page) and marks the other
 * features' caches stale. The returned promise settles when the admin refetch
 * has landed, so a mutation that returns it stays pending until the table
 * shows the server's rows; focus can then go back to a row that still exists.
 */
function refreshAfterWrite(
  queryClient: QueryClient,
  others: readonly (readonly string[])[],
): Promise<void> {
  for (const queryKey of others) void queryClient.invalidateQueries({ queryKey });
  return queryClient.invalidateQueries({ queryKey: adminKeys.all });
}

/**
 * Add alumni: POST /api/admin/alumni. Not optimistic: the new row's place
 * depends on the server's sort and paging. The cache work lives here, not in
 * the caller's mutate() callbacks, so it happens even if the page unmounts.
 */
export function useCreateAlumni() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminAlumniCreateInput) => createAlumniAccount(input),
    onSuccess: () => refreshAfterWrite(queryClient, [DIRECTORY_KEY]),
  });
}

export interface UpdateAlumniRequest {
  /** The alumni id (the row's `id`, not its user id). */
  id: number;
  input: AdminAlumniUpdateInput;
}

/**
 * Edit alumni: PUT /api/admin/alumni/:id. Not optimistic. A 404 (deleted
 * meanwhile) refreshes too, so the stale row leaves the table.
 */
export function useUpdateAlumni() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: UpdateAlumniRequest) => updateAlumniAccount(id, input),
    onSuccess: () => refreshAfterWrite(queryClient, STALE_AFTER_EDIT),
    onError: (error) =>
      isNotFound(error) ? refreshAfterWrite(queryClient, STALE_AFTER_EDIT) : undefined,
  });
}

/**
 * Delete alumni: DELETE /api/admin/alumni/:id (the alumni id). Not optimistic:
 * the dialog shows a busy button until the server answers and the table has
 * refetched without the row. A 404 (deleted meanwhile) refreshes too. If the
 * delete empties the last page, AdminPage steps back a page itself.
 */
export function useDeleteAlumni() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAlumniAccount(id),
    onSuccess: () => refreshAfterWrite(queryClient, STALE_AFTER_DELETE),
    onError: (error) =>
      isNotFound(error) ? refreshAfterWrite(queryClient, STALE_AFTER_DELETE) : undefined,
  });
}
