import type { ChangePasswordInput, MyProfile, UpdateMyProfileInput } from '@alumni/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ALUMNI_QUERY_ROOT, FEED_QUERY_ROOT, POSTS_QUERY_ROOT } from '@/config/queryKeys';
import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
import { changePassword, updateMyProfile } from '@/services/authApi';
import { getLiveToken } from '@/services/authToken';

/** One Save: either part may be skipped (planSave decides), never both. */
export interface SaveRequest {
  /** PUT /api/me body, or null when no profile field changed (ADV-003). */
  profile: UpdateMyProfileInput | null;
  /** PUT /api/me/password body, or null when no password was typed. */
  password: ChangePasswordInput | null;
}

export interface SaveResult {
  /** The saved profile from PUT /api/me, or null when that call was skipped. */
  profile: MyProfile | null;
  /** True when PUT /api/me/password ran and succeeded. */
  passwordChanged: boolean;
  /** The password call's error, when it failed; the profile part still counts. */
  passwordError: unknown;
}

// Query-key roots whose rows carry the user's name, photo or profile fields,
// or depend on them. ['alumni', ...]: the directory, /alumni/:id, Home's
// mentors list (the mentorship switch) and the suggested alumni, which are
// ranked by the user's own department and university (REQ-016, CORR-001);
// invalidation matches by prefix, so the root reaches every one. ['posts', ...]:
// recent posts on /alumni/:id. ['feed', ...]: the feed's posts and comments and
// Home's latest posts show the author's name and photo. The roots come from
// config/queryKeys: lazy features never import each other (ADR-08).
const STALE_AFTER_PROFILE_SAVE = [
  [ALUMNI_QUERY_ROOT],
  [POSTS_QUERY_ROOT],
  [FEED_QUERY_ROOT],
] as const;

/**
 * Save for /me: one mutation, two calls (LESSON-REQ-002-3). PUT /api/me runs
 * first when a profile field changed; a failure there throws and nothing else
 * runs. PUT /api/me/password runs next when a password was typed; its failure
 * is returned, not thrown, so a profile that did save is still applied while
 * the error shows on the password section. Not optimistic (architecture: a
 * watched form waits instead of rolling back).
 *
 * The cache work lives here, not in the caller's mutate() callbacks, so it
 * still happens if the user leaves the page while the save is in flight.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: SaveRequest): Promise<SaveResult> => {
      const profile = request.profile ? await updateMyProfile(request.profile) : null;
      let passwordChanged = false;
      let passwordError: unknown = null;
      if (request.password) {
        try {
          await changePassword(request.password);
          passwordChanged = true;
        } catch (error: unknown) {
          passwordError = error;
        }
      }
      return { profile, passwordChanged, passwordError };
    },
    onSuccess: ({ profile }) => {
      // A 401 on the password call has already logged out and cleared the
      // cache (SessionBridge); writing the old profile back would outlive it.
      if (profile === null || getLiveToken() === null) return;
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, profile);
      for (const queryKey of STALE_AFTER_PROFILE_SAVE) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
